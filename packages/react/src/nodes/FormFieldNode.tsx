import {
	parseSelectOptions,
	resolveFormFieldTypographyStyle,
} from "@kivcode/nodes";
import { type ReactNode, useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface FormFieldNodeProps extends KivNodeComponentProps {
	fieldType?: string;
	name?: string;
	label?: string;
	placeholder?: string;
	required?: boolean;
	options?: string;
	fontFamily?: string;
	size?: number;
	weight?: string;
	color?: string;
}

export function FormFieldNode({
	fieldType,
	name,
	label,
	placeholder,
	required,
	options,
	fontFamily,
	size,
	weight,
	color,
	id,
	style,
	...rest
}: FormFieldNodeProps) {
	const labelStyle = useMemo(
		() => resolveFormFieldTypographyStyle({ fontFamily, size, weight, color }),
		[fontFamily, size, weight, color],
	);
	const selectOptions = useMemo(() => parseSelectOptions(options), [options]);
	const fieldName = name ?? "field";

	let control: ReactNode;
	if (fieldType === "textarea") {
		control = (
			<textarea
				id={fieldName}
				name={fieldName}
				placeholder={placeholder}
				required={required}
			/>
		);
	} else if (fieldType === "select") {
		control = (
			<select id={fieldName} name={fieldName} required={required}>
				{selectOptions.map((opt) => (
					<option key={opt} value={opt}>
						{opt}
					</option>
				))}
			</select>
		);
	} else if (fieldType === "checkbox") {
		control = (
			<input
				id={fieldName}
				type="checkbox"
				name={fieldName}
				required={required}
			/>
		);
	} else {
		control = (
			<input
				id={fieldName}
				type={fieldType ?? "text"}
				name={fieldName}
				placeholder={placeholder}
				required={required}
			/>
		);
	}

	return (
		<div
			id={id}
			className="kiv-form-field"
			style={style}
			data-kiv-type="form-field"
			{...rest}
		>
			{label && (
				<label htmlFor={fieldName} style={labelStyle}>
					{label}
				</label>
			)}
			{control}
		</div>
	);
}
