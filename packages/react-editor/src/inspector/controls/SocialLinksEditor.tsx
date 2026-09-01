import type { FieldDescriptor } from "@kivcode/engine";
import type { SocialLink } from "@kivcode/nodes";
import { useMemo } from "react";

export interface SocialLinksEditorProps {
	value?: string;
	/** Part of the common plugin-control contract; unused here (same as the Vue original, which never declared it either). */
	fieldKey?: string;
	descriptor?: FieldDescriptor;
	onChange: (value: string) => void;
}

// Every platform social-icons.ts knows how to render an icon for — kept in
// sync with PLATFORM_ICON there. Showing only these options (instead of a
// free-text platform field) means every link a user adds actually renders
// with a real icon, never a blank/mystery entry.
const PLATFORMS = [
	{ value: "twitter", label: "X (Twitter)" },
	{ value: "facebook", label: "Facebook" },
	{ value: "instagram", label: "Instagram" },
	{ value: "linkedin", label: "LinkedIn" },
	{ value: "youtube", label: "YouTube" },
	{ value: "github", label: "GitHub" },
	{ value: "tiktok", label: "TikTok" },
	{ value: "whatsapp", label: "WhatsApp" },
	{ value: "email", label: "Email" },
] as const;

function parse(v: string | undefined): SocialLink[] {
	if (!v) return [];
	try {
		const parsed = JSON.parse(v);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter((item): item is SocialLink => !!item && typeof item === "object")
			.map((item) => ({
				platform: String(item.platform ?? "twitter"),
				url: String(item.url ?? ""),
			}));
	} catch {
		return [];
	}
}

export function SocialLinksEditor({
	value,
	fieldKey: _fieldKey,
	descriptor: _descriptor,
	onChange,
}: SocialLinksEditorProps) {
	const links = useMemo(() => parse(value), [value]);

	function commit(next: SocialLink[]): void {
		onChange(JSON.stringify(next));
	}

	function addLink(): void {
		commit([...links, { platform: "twitter", url: "" }]);
	}

	function updatePlatform(index: number, platform: string): void {
		commit(links.map((l, i) => (i === index ? { ...l, platform } : l)));
	}

	function updateUrl(index: number, url: string): void {
		commit(links.map((l, i) => (i === index ? { ...l, url } : l)));
	}

	function removeLink(index: number): void {
		commit(links.filter((_, i) => i !== index));
	}

	return (
		<div className="kiv-social-links">
			{links.length === 0 && (
				<div className="kiv-social-links__empty">No links yet.</div>
			)}
			{links.map((link, i) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: SocialLink has no stable id — same positional keying as the Vue original's `:key="i"`
					key={i}
					className="kiv-social-links__row"
				>
					<select
						className="kiv-select kiv-social-links__platform"
						value={link.platform}
						onChange={(e) => updatePlatform(i, e.target.value)}
					>
						{PLATFORMS.map((p) => (
							<option key={p.value} value={p.value}>
								{p.label}
							</option>
						))}
					</select>
					<input
						type="text"
						className="kiv-input kiv-social-links__url"
						value={link.url}
						placeholder="https://..."
						onChange={(e) => updateUrl(i, e.target.value)}
					/>
					<button
						type="button"
						className="kiv-social-links__remove"
						title="Remove link"
						onClick={() => removeLink(i)}
					>
						&times;
					</button>
				</div>
			))}
			<button type="button" className="kiv-social-links__add" onClick={addLink}>
				+ Add link
			</button>
		</div>
	);
}
