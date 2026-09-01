export interface ColorControlProps {
	value?: string;
	onChange: (value: string) => void;
}

function safeColor(v: string | undefined): string {
	if (!v || !/^#[0-9a-fA-F]{6}$/.test(v)) return "#000000";
	return v;
}

export function ColorControl({ value, onChange }: ColorControlProps) {
	const safe = safeColor(value);

	return (
		<div className="kiv-color">
			<div className="kiv-color__swatch">
				<input
					type="color"
					className="kiv-color__input"
					value={safe}
					onChange={(e) => onChange(e.target.value)}
				/>
				<span className="kiv-color__preview" style={{ background: safe }} />
			</div>
			<input
				type="text"
				className="kiv-input kiv-color__text"
				value={value ?? ""}
				onChange={(e) => onChange(e.target.value)}
			/>
		</div>
	);
}
