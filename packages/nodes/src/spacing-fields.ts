import { type FieldDescriptor, f } from "@kiv/engine";
import { type SpacingBoxValue, spacingBoxField } from "./spacing-field";

export interface SpacingFields {
	paddingX: FieldDescriptor<string>;
	paddingY: FieldDescriptor<string>;
	paddingBox: FieldDescriptor<SpacingBoxValue>;
}

export interface SpacingFieldOptions {
	group?: string;
	paddingXDefault?: string;
	paddingYDefault?: string;
	paddingScale?: ReadonlyArray<string>;
	paddingHint?: string;
	includeMargin?: false;
}

export function spacingFields(opts: SpacingFieldOptions = {}): SpacingFields {
	const g = opts.group ?? "Spacing";
	const scale = opts.paddingScale ?? ["none", "xs", "sm", "md", "lg", "xl"];
	return {
		paddingX: f.select([...scale], {
			label: "Padding X",
			default: opts.paddingXDefault ?? "none",
			responsive: true,
			group: g,
		}),
		paddingY: f.select([...scale], {
			label: "Padding Y",
			default: opts.paddingYDefault ?? "none",
			responsive: true,
			group: g,
		}),
		paddingBox: spacingBoxField({
			label: "Padding (per side)",
			group: g,
			hint:
				opts.paddingHint ??
				"Overrides Padding X/Y for individual sides. Empty side = use the shorthand above.",
		}),
	};
}
