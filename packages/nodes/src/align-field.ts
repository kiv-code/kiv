import { type FieldDescriptor, f } from "@kivcode/engine";

export interface AlignFieldOptions {
	label?: string;
	group?: string;
	default?: string;
	responsive?: boolean;
	options?: ReadonlyArray<string>;
}

export function alignField(
	opts: AlignFieldOptions = {},
): FieldDescriptor<string> {
	return f.select(opts.options ?? ["left", "center", "right"], {
		label: opts.label ?? "Align",
		default: opts.default ?? "center",
		responsive: opts.responsive ?? false,
		group: opts.group ?? "Layout",
	});
}
