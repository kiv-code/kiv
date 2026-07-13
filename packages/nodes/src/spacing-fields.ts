import { type FieldDescriptor, f } from "@kivcode/engine";
import { type SpacingBoxValue, spacingBoxField } from "./spacing-field";

export interface SpacingFields {
	paddingX: FieldDescriptor<string>;
	paddingY: FieldDescriptor<string>;
	paddingBox: FieldDescriptor<SpacingBoxValue>;
	marginY?: FieldDescriptor<string>;
	marginX?: FieldDescriptor<string>;
	marginBox?: FieldDescriptor<SpacingBoxValue>;
}

export interface SpacingFieldOptions {
	group?: string;
	paddingXDefault?: string;
	paddingYDefault?: string;
	paddingScale?: ReadonlyArray<string>;
	paddingHint?: string;
	/** Also emit marginX/marginY/marginBox, same scale and group as padding. */
	includeMargin?: boolean;
	marginHint?: string;
}

export function spacingFields(
	opts: SpacingFieldOptions & { includeMargin: true },
): Required<SpacingFields>;
export function spacingFields(opts?: SpacingFieldOptions): SpacingFields;
export function spacingFields(opts: SpacingFieldOptions = {}): SpacingFields {
	const g = opts.group ?? "Spacing";
	const scale = opts.paddingScale ?? ["none", "xs", "sm", "md", "lg", "xl"];
	const base: SpacingFields = {
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
	if (!opts.includeMargin) return base;
	return {
		...base,
		marginY: f.select([...scale], {
			label: "Margin Y",
			default: "none",
			responsive: true,
			group: g,
		}),
		marginX: f.select([...scale], {
			label: "Margin X",
			default: "none",
			responsive: true,
			group: g,
		}),
		marginBox: spacingBoxField({
			label: "Margin (per side)",
			group: g,
			hint: opts.marginHint ?? "Overrides Margin X/Y for individual sides.",
		}),
	};
}
