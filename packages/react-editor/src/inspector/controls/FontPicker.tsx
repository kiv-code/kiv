import type { KivFont } from "@kivcode/engine";
import { useContext, useMemo } from "react";
import { EditorStoreContext } from "../../store/context";

export interface FontPickerProps {
	value?: string;
	fieldKey?: string;
	onChange: (value: string) => void;
}

export function FontPicker({ value, onChange }: FontPickerProps) {
	const store = useContext(EditorStoreContext);
	// Only the typefaces the host project registered. A project that configures
	// no provider gets the generic system families rather than an invented list,
	// so a document can never name a font the page will not load.
	const fonts = useMemo<KivFont[]>(
		() => store?.fonts?.list() ?? [],
		[store?.fonts],
	);
	const selected = fonts.find((f) => f.id === value);

	return (
		<div className="kiv-font-picker">
			<select
				className="kiv-input"
				value={value ?? ""}
				onChange={(e) => onChange(e.target.value)}
			>
				<option value="">Inherit</option>
				{fonts.map((font) => (
					<option key={font.id} value={font.id}>
						{font.label}
					</option>
				))}
			</select>
			{/* Rendered in the family itself, so the choice is legible at a glance. */}
			{selected ? (
				<p
					className="kiv-font-picker__preview"
					style={{ fontFamily: selected.stack }}
				>
					Ag — the quick brown fox
				</p>
			) : fonts.length === 0 ? (
				<p className="kiv-font-picker__empty">
					This project registers no fonts. Pass <code>fonts</code> to
					createEngine.
				</p>
			) : null}
		</div>
	);
}
