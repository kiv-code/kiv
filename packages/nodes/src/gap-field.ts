import { type FieldDescriptor, f } from "@kiv/engine";

export interface GapFieldOptions {
	label?: string;
	group?: string;
	default?: string;
	responsive?: boolean;
	scale?: ReadonlyArray<string>;
}

export function gapField(opts: GapFieldOptions = {}): FieldDescriptor<string> {
	return f.select(opts.scale ?? ["none", "xs", "sm", "md", "lg", "xl"], {
		label: opts.label ?? "Gap",
		default: opts.default ?? "md",
		responsive: opts.responsive ?? true,
		group: opts.group ?? "Layout",
	});
}
