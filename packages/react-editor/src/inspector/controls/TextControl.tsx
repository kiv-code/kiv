export interface TextControlProps {
	value?: string;
	onChange: (value: string) => void;
}

export function TextControl({ value, onChange }: TextControlProps) {
	return (
		<input
			type="text"
			className="kiv-input"
			value={value ?? ""}
			onChange={(e) => onChange(e.target.value)}
		/>
	);
}
