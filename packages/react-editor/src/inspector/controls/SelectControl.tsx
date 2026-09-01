export interface SelectControlProps {
	value?: string;
	options: string[];
	onChange: (value: string) => void;
}

export function SelectControl({
	value,
	options,
	onChange,
}: SelectControlProps) {
	return (
		<div className="kiv-select-wrap">
			<select
				className="kiv-select"
				value={value ?? ""}
				onChange={(e) => onChange(e.target.value)}
			>
				{!value && (
					<option value="" disabled>
						—
					</option>
				)}
				{options.map((opt) => (
					<option key={opt} value={opt}>
						{opt}
					</option>
				))}
			</select>
			<svg
				className="kiv-select__chevron"
				width="10"
				height="10"
				viewBox="0 0 10 10"
				fill="none"
				aria-hidden="true"
			>
				<path
					d="M2 3.5l3 3 3-3"
					stroke="currentColor"
					strokeWidth="1.4"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</div>
	);
}
