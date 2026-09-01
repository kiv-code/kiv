export interface NumberControlProps {
	value?: number;
	onChange: (value: number) => void;
}

export function NumberControl({ value, onChange }: NumberControlProps) {
	return (
		<input
			type="number"
			className="kiv-input"
			value={value ?? ""}
			step={1}
			onChange={(e) => onChange(Number(e.target.value))}
		/>
	);
}
