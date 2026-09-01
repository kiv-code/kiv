export interface BooleanControlProps {
	label: string;
	value?: boolean;
	bpBadge?: string;
	onChange: (value: boolean) => void;
}

export function BooleanControl({
	label,
	value,
	bpBadge,
	onChange,
}: BooleanControlProps) {
	return (
		<button type="button" className="kiv-bool" onClick={() => onChange(!value)}>
			<div className="kiv-bool__left">
				<span className="kiv-bool__label">{label}</span>
				{bpBadge && <span className="kiv-bool__badge">{bpBadge}</span>}
			</div>
			<div className={`kiv-bool__track${value ? " kiv-bool__track--on" : ""}`}>
				<div className="kiv-bool__thumb" />
			</div>
		</button>
	);
}
