import type { FieldDescriptor } from "@kivcode/engine";
import { useContext } from "react";
import { FileTypeIcon } from "../../components/FileTypeIcon";
import { EditorStoreContext } from "../../store/context";

export interface MediaPickerProps {
	value?: string;
	/** Part of the common plugin-control contract; unused here (same as the Vue original, which never declared it either). */
	fieldKey?: string;
	descriptor?: FieldDescriptor;
	onChange: (value: string) => void;
}

// This same control is used for image, video, AND non-visual media fields
// (e.g. a PDF/DOC attachment link) — an <img> preview of a non-image URL
// just shows a broken-image icon with no indication of what the file even
// is, so branch on the extension instead of assuming everything is an image.
const VIDEO_RE = /\.(mp4|webm|mov|m4v|ogv|avi)(\?.*)?$/i;
const OTHER_FILE_RE =
	/\.(pdf|docx?|xlsx?|csv|pptx?|zip|rar|7z|tar|gz|txt|md|mp3|wav|ogg|m4a|flac)(\?.*)?$/i;

export function MediaPicker({
	value = "",
	fieldKey: _fieldKey,
	descriptor,
	onChange,
}: MediaPickerProps) {
	const store = useContext(EditorStoreContext);
	const media = store?.media ?? null;

	const isVideo = VIDEO_RE.test(value);
	const isOtherFile = OTHER_FILE_RE.test(value);

	function clear() {
		onChange("");
	}

	function browseMedia() {
		// TODO: open KivMediaBrowser once ported
	}

	return (
		<div className="kiv-media-picker">
			{value && (
				<div className="kiv-media-picker__preview">
					{isVideo ? (
						<video src={value} muted className="kiv-media-picker__thumb">
							<track kind="captions" />
						</video>
					) : isOtherFile ? (
						<div className="kiv-media-picker__thumb kiv-media-picker__thumb--file">
							<FileTypeIcon url={value} />
						</div>
					) : (
						<img src={value} alt="" className="kiv-media-picker__thumb" />
					)}
					<button
						type="button"
						className="kiv-media-picker__clear"
						title="Clear"
						onClick={clear}
					>
						&times;
					</button>
				</div>
			)}
			<input
				type="text"
				className="kiv-media-picker__input"
				value={value}
				placeholder={descriptor?.placeholder ?? "https://…"}
				onChange={(e) => onChange(e.target.value)}
			/>
			<button
				type="button"
				className="kiv-media-picker__browse"
				disabled={!media}
				onClick={browseMedia}
			>
				Browse Media
			</button>
			{!media && (
				<p className="kiv-media-picker__hint">
					No media provider configured — paste a URL directly.
				</p>
			)}
		</div>
	);
}
