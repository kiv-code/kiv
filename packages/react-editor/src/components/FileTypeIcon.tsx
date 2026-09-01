import type { CSSProperties } from "react";
import { useMemo } from "react";

// Line-style file icon per extension — used by MediaPicker's non-image/video
// preview (a PDF/DOC/ZIP/etc URL just shows a broken-image icon in a plain
// <img>, so this gives a meaningful preview instead).

export interface FileTypeIconProps {
	/** The asset's URL — used to infer the file extension when `filename` isn't given. */
	url?: string;
	/** Original filename/alt text, preferred over parsing `url` (see extOf()). */
	filename?: string;
	/** MediaAsset.type — "video" gets its own icon even without a recognized extension. */
	assetType?: "image" | "video" | "file";
}

interface FileKind {
	label: string;
	color: string;
	kind: "video" | "audio" | "doc";
}

// url is frequently a data: URI (mock providers, inline SVG placeholders) —
// slicing after the last "/" on one of those tears into the base64 payload
// instead of finding a filename, same pitfall assetLabel() in
// KivMediaBrowser.vue guards against. Prefer `filename`, and only parse
// `url` when it actually looks like a path.
function extOf(input: string): string {
	const clean = input.split(/[?#]/)[0] ?? input;
	const base = clean.split("/").pop() ?? clean;
	const dot = base.lastIndexOf(".");
	return dot > 0 ? base.slice(dot + 1).toLowerCase() : "";
}

const EXTENSION_KIND: Record<string, FileKind> = {
	pdf: { label: "PDF", color: "#dc2626", kind: "doc" },
	doc: { label: "DOC", color: "#2563eb", kind: "doc" },
	docx: { label: "DOC", color: "#2563eb", kind: "doc" },
	xls: { label: "XLS", color: "#16a34a", kind: "doc" },
	xlsx: { label: "XLS", color: "#16a34a", kind: "doc" },
	csv: { label: "CSV", color: "#16a34a", kind: "doc" },
	ppt: { label: "PPT", color: "#ea580c", kind: "doc" },
	pptx: { label: "PPT", color: "#ea580c", kind: "doc" },
	zip: { label: "ZIP", color: "#7c3aed", kind: "doc" },
	rar: { label: "ZIP", color: "#7c3aed", kind: "doc" },
	"7z": { label: "ZIP", color: "#7c3aed", kind: "doc" },
	tar: { label: "ZIP", color: "#7c3aed", kind: "doc" },
	gz: { label: "ZIP", color: "#7c3aed", kind: "doc" },
	txt: { label: "TXT", color: "#64748b", kind: "doc" },
	md: { label: "MD", color: "#64748b", kind: "doc" },
	mp3: { label: "", color: "#db2777", kind: "audio" },
	wav: { label: "", color: "#db2777", kind: "audio" },
	ogg: { label: "", color: "#db2777", kind: "audio" },
	m4a: { label: "", color: "#db2777", kind: "audio" },
	flac: { label: "", color: "#db2777", kind: "audio" },
	mp4: { label: "", color: "#4f46e5", kind: "video" },
	webm: { label: "", color: "#4f46e5", kind: "video" },
	mov: { label: "", color: "#4f46e5", kind: "video" },
	m4v: { label: "", color: "#4f46e5", kind: "video" },
	ogv: { label: "", color: "#4f46e5", kind: "video" },
	avi: { label: "", color: "#4f46e5", kind: "video" },
};

const DEFAULT_KIND: FileKind = { label: "FILE", color: "#64748b", kind: "doc" };
const VIDEO_KIND: FileKind = { label: "", color: "#4f46e5", kind: "video" };

export function FileTypeIcon({ url, filename, assetType }: FileTypeIconProps) {
	const fileKind = useMemo<FileKind>(() => {
		const ext = extOf(filename || url || "");
		if (ext && EXTENSION_KIND[ext]) return EXTENSION_KIND[ext];
		// asset.type from the media provider is the fallback signal when the
		// extension is missing/unrecognized (e.g. a data: URI with no filename).
		if (assetType === "video") return VIDEO_KIND;
		return DEFAULT_KIND;
	}, [filename, url, assetType]);

	const style = {
		"--kiv-file-icon-color": fileKind.color,
	} as CSSProperties;

	return (
		<div
			className="kiv-file-icon"
			style={style}
			title={fileKind.label || undefined}
		>
			{fileKind.kind === "video" ? (
				<svg
					width="28"
					height="28"
					viewBox="0 0 24 24"
					fill="none"
					aria-hidden="true"
				>
					<rect
						x="1"
						y="4"
						width="16"
						height="16"
						rx="3"
						fill={fileKind.color}
						opacity="0.18"
					/>
					<rect
						x="1"
						y="4"
						width="16"
						height="16"
						rx="3"
						stroke={fileKind.color}
						strokeWidth="1.4"
					/>
					<path d="M8 9l6 3-6 3V9z" fill={fileKind.color} />
					<path
						d="M19 8l4-2.5v13L19 16"
						stroke={fileKind.color}
						strokeWidth="1.4"
						strokeLinejoin="round"
					/>
				</svg>
			) : fileKind.kind === "audio" ? (
				<svg
					width="28"
					height="28"
					viewBox="0 0 24 24"
					fill="none"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="11" fill={fileKind.color} opacity="0.16" />
					<path
						d="M7 14V9.5l6-1.5v9M13 8v8"
						stroke={fileKind.color}
						strokeWidth="1.4"
						strokeLinecap="round"
					/>
					<circle cx="6" cy="16" r="2" fill={fileKind.color} />
					<circle cx="12" cy="17.5" r="2" fill={fileKind.color} />
				</svg>
			) : (
				<svg width="30" height="34" viewBox="0 0 30 34" aria-hidden="true">
					<path d="M3 1h17l7 7v25H3V1z" fill={fileKind.color} opacity="0.14" />
					<path
						d="M3 1h17l7 7v25H3V1z"
						stroke={fileKind.color}
						strokeWidth="1.4"
						fill="none"
						strokeLinejoin="round"
					/>
					<path
						d="M20 1v7h7"
						stroke={fileKind.color}
						strokeWidth="1.4"
						fill="none"
						strokeLinejoin="round"
					/>
					{fileKind.label && (
						<text
							x="15"
							y="25"
							textAnchor="middle"
							fill={fileKind.color}
							fontSize="7"
							fontWeight="700"
							fontFamily="inherit"
						>
							{fileKind.label}
						</text>
					)}
				</svg>
			)}
		</div>
	);
}
