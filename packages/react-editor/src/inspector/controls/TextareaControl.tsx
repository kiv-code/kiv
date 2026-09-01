export interface TextareaControlProps {
	value?: string;
	placeholder?: string;
	onChange: (value: string) => void;
}

export function TextareaControl({
	value,
	placeholder,
	onChange,
}: TextareaControlProps) {
	return (
		<textarea
			rows={3}
			className="kiv-input"
			style={{ resize: "vertical" }}
			value={value ?? ""}
			placeholder={placeholder ?? ""}
			onChange={(e) => onChange(e.target.value)}
		/>
	);
}
