import { type FieldDescriptor, f } from "@kiv/engine";

export interface BorderVisualFields {
	borderRadius: FieldDescriptor<string>;
	shadow: FieldDescriptor<string>;
}

export interface BorderVisualFieldOptions {
	group?: string;
	radiusOptions?: ReadonlyArray<string>;
	radiusDefault?: string;
	shadowOptions?: ReadonlyArray<string>;
	shadowDefault?: string;
}

export function borderVisualFields(
	opts: BorderVisualFieldOptions = {},
): BorderVisualFields {
	const g = opts.group ?? "Style";
	return {
		borderRadius: f.select(
			opts.radiusOptions ?? ["none", "sm", "md", "lg", "xl", "full"],
			{
				label: "Border radius",
				default: opts.radiusDefault ?? "none",
				group: g,
			},
		),
		shadow: f.select(opts.shadowOptions ?? ["none", "sm", "md", "lg", "xl"], {
			label: "Shadow",
			default: opts.shadowDefault ?? "none",
			group: g,
		}),
	};
}
