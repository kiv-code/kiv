import type { MediaAsset, MediaProvider } from "@kivcode/engine";
import {
	type ChangeEvent,
	type MouseEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { FileTypeIcon } from "./FileTypeIcon";
import { mediaListCache } from "./media-list-cache";

export interface KivMediaBrowserProps {
	open: boolean;
	media: MediaProvider | null;
	onClose: () => void;
	onSelect: (asset: MediaAsset) => void;
}

const TYPE_OPTIONS = [
	{ value: "all", label: "All" },
	{ value: "image", label: "Images" },
	{ value: "video", label: "Videos" },
	{ value: "file", label: "Files" },
] as const;

type TypeFilter = (typeof TYPE_OPTIONS)[number]["value"];

// `asset.url` is frequently a data: URI (mock providers, inline SVG
// placeholders) — slicing after the last "/" on one of those tears into the
// base64 payload instead of finding a filename, since base64 itself can
// contain "/". `filename` (the real uploaded name) wins when the provider
// sets it; `alt` is accessibility text and only a fallback proxy for it —
// path-parsing the URL is the last resort, for older assets/providers that
// predate `filename`.
function assetLabel(asset: MediaAsset): string {
	if (asset.filename) return asset.filename;
	if (asset.alt) return asset.alt;
	if (asset.url.startsWith("data:")) return asset.id;
	const withoutQuery = asset.url.split("?")[0] ?? asset.url;
	return withoutQuery.split("/").pop() || asset.id;
}

export function KivMediaBrowser({
	open,
	media,
	onClose,
	onSelect,
}: KivMediaBrowserProps) {
	const [assets, setAssets] = useState<MediaAsset[]>([]);
	const [loading, setLoading] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
	const [deleting, setDeleting] = useState<Set<string>>(new Set());

	const searchInputRef = useRef<HTMLInputElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	// `list` is optional on MediaProvider — without it the library can't be
	// browsed, only uploaded to for the current session (see media/types.ts).
	const canList = typeof media?.list === "function";

	// Always fetches the FULL, unfiltered list — `visibleAssets` below already
	// re-filters client-side by search/type, so there's no need to hit the
	// network again on every keystroke, and it means the cached copy is one
	// single reusable list rather than one entry per query string.
	async function fetchAssets(): Promise<MediaAsset[]> {
		if (!media?.list) return [];
		return media.list();
	}

	async function loadAssets() {
		if (!media?.list) {
			setAssets([]);
			return;
		}

		const cached = mediaListCache.get(media);
		if (cached) {
			// Instant — no spinner, no wait. A background refresh follows to
			// pick up anything uploaded/deleted from elsewhere (another tab,
			// another editor session) without making every single open pay for it.
			setAssets(cached);
			fetchAssets()
				.then((fresh) => {
					setAssets(fresh);
					mediaListCache.set(media, fresh);
				})
				.catch(() => {
					// Silent — the cached copy is still shown; loud errors here
					// would fire on every open whenever the network hiccups.
				});
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const fresh = await fetchAssets();
			setAssets(fresh);
			mediaListCache.set(media, fresh);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load media");
		} finally {
			setLoading(false);
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: only re-runs when the dialog opens or the provider identity changes — mirrors the Vue original's `watch(() => props.open, ...)`, which never re-fetches on search/type changes either
	useEffect(() => {
		if (!open) return;
		setSearch("");
		setTypeFilter("all");
		loadAssets();
		const raf = requestAnimationFrame(() => searchInputRef.current?.focus());
		return () => cancelAnimationFrame(raf);
	}, [open, media]);

	// Defensive client-side re-filter — some providers may not honor the query
	// (e.g. a naive mock), so the grid stays correct either way.
	const visibleAssets = useMemo(() => {
		const q = search.toLowerCase().trim();
		return assets.filter((asset) => {
			if (typeFilter !== "all" && asset.type !== typeFilter) return false;
			if (!q) return true;
			return (
				asset.url.toLowerCase().includes(q) ||
				(asset.alt ?? "").toLowerCase().includes(q) ||
				(asset.filename ?? "").toLowerCase().includes(q)
			);
		});
	}, [assets, search, typeFilter]);

	function thumbSrc(asset: MediaAsset): string {
		if (asset.type !== "image") return "";
		return media?.resolve(asset.url, { width: 160 }) ?? asset.url;
	}

	// Accepts multiple files (see the `multiple` attribute on the <input>
	// below) — uploads them all into the library so they're ready to reuse
	// anywhere, without forcing a one-at-a-time round trip through this
	// dialog. `onSelect` only auto-fires when exactly one file was chosen
	// (preserves the original single-pick convenience for a field's own
	// picker); a bulk batch just populates the grid and leaves the choice of
	// which one to use to the user.
	async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
		const input = e.target;
		const files = input.files ? Array.from(input.files) : [];
		input.value = "";
		if (!files.length || !media) return;

		setUploading(true);
		setError(null);
		const uploaded: MediaAsset[] = [];
		try {
			for (const file of files) {
				try {
					uploaded.push(await media.upload(file));
				} catch (err) {
					setError(err instanceof Error ? err.message : "Upload failed");
					// Keep going — one bad file in a batch of 20 shouldn't lose
					// the other 19 that already succeeded.
				}
			}
		} finally {
			setUploading(false);
		}

		if (uploaded.length) {
			setAssets((prev) => {
				const next = [...uploaded, ...prev];
				mediaListCache.set(media, next);
				return next;
			});
			if (uploaded.length === 1) onSelect(uploaded[0] as MediaAsset);
		}
	}

	function triggerUpload() {
		fileInputRef.current?.click();
	}

	async function deleteAsset(asset: MediaAsset, e: MouseEvent) {
		e.stopPropagation();
		if (!media || deleting.has(asset.id)) return;
		if (!window.confirm(`Delete "${assetLabel(asset)}"? This can't be undone.`))
			return;

		setDeleting((prev) => new Set(prev).add(asset.id));
		try {
			await media.delete(asset.url);
			setAssets((prev) => {
				const next = prev.filter((a) => a.id !== asset.id);
				mediaListCache.set(media, next);
				return next;
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Delete failed");
		} finally {
			setDeleting((prev) => {
				const next = new Set(prev);
				next.delete(asset.id);
				return next;
			});
		}
	}

	function onBackdrop(e: MouseEvent<HTMLDivElement>) {
		if (e.target === e.currentTarget) onClose();
	}

	function onKeyDown(e: { key: string }) {
		if (e.key === "Escape") onClose();
	}

	if (!open) return null;

	return (
		<div
			className="kiv-media-backdrop"
			role="dialog"
			aria-modal="true"
			aria-label="Media library"
			onClick={onBackdrop}
			onKeyDown={onKeyDown}
		>
			<div className="kiv-media-modal">
				<div className="kiv-media-modal__header">
					<div className="kiv-media-modal__title">Media library</div>
					<button
						type="button"
						className="kiv-media-modal__close"
						onClick={onClose}
					>
						<svg
							width="12"
							height="12"
							viewBox="0 0 12 12"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M1 1l10 10M11 1L1 11"
								stroke="currentColor"
								strokeWidth={1.5}
								strokeLinecap="round"
							/>
						</svg>
					</button>
				</div>

				<div className="kiv-media-modal__toolbar">
					<input
						ref={searchInputRef}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						type="text"
						className="kiv-media-modal__search"
						placeholder="Search media…"
						disabled={!canList}
					/>
					<select
						value={typeFilter}
						onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
						className="kiv-media-modal__filter"
						disabled={!canList}
					>
						{TYPE_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
					<button
						type="button"
						className="kiv-media-modal__upload"
						disabled={uploading || !media}
						onClick={triggerUpload}
					>
						{uploading ? "Uploading…" : "Upload"}
					</button>
					<input
						ref={fileInputRef}
						type="file"
						multiple
						className="kiv-media-modal__file-input"
						accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.zip,.txt,.md"
						onChange={onFileChange}
					/>
				</div>

				{!canList && (
					<div className="kiv-media-modal__notice">
						This media provider doesn't support browsing an existing library —
						upload a file to use it here.
					</div>
				)}
				{error && <div className="kiv-media-modal__error">{error}</div>}

				<div className="kiv-media-modal__grid">
					{loading ? (
						<div className="kiv-media-modal__empty">Loading…</div>
					) : visibleAssets.length ? (
						visibleAssets.map((asset) => (
							<div key={asset.id} className="kiv-media-modal__card-wrap">
								<button
									type="button"
									className="kiv-media-modal__card"
									disabled={deleting.has(asset.id)}
									onClick={() => onSelect(asset)}
								>
									{asset.type === "image" ? (
										<img
											src={thumbSrc(asset)}
											alt={asset.alt ?? ""}
											className="kiv-media-modal__thumb"
											loading="lazy"
										/>
									) : (
										<div className="kiv-media-modal__thumb kiv-media-modal__thumb--placeholder">
											<FileTypeIcon
												url={asset.url}
												filename={asset.filename ?? asset.alt}
												assetType={asset.type}
											/>
										</div>
									)}
									<span className="kiv-media-modal__card-name">
										{assetLabel(asset)}
									</span>
								</button>
								{media && (
									<button
										type="button"
										className="kiv-media-modal__delete"
										title="Delete"
										disabled={deleting.has(asset.id)}
										onClick={(e) => deleteAsset(asset, e)}
									>
										<svg
											width="11"
											height="11"
											viewBox="0 0 12 12"
											fill="none"
											aria-hidden="true"
										>
											<path
												d="M1 1l10 10M11 1L1 11"
												stroke="currentColor"
												strokeWidth={1.5}
												strokeLinecap="round"
											/>
										</svg>
									</button>
								)}
							</div>
						))
					) : (
						<div className="kiv-media-modal__empty">
							{canList
								? "No media found."
								: "No files uploaded yet this session."}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
