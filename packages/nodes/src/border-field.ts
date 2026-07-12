import { type FieldDescriptor, f } from "@kiv/engine";

export interface BorderVisualFields {
	borderRadius: FieldDescriptor<string>;
	shadow: FieldDescriptor<string>;
}

export interface BorderVisualFieldOptions {
	group?: string;
	radiusLabel?: string;
	radiusHint?: string;
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
				label: opts.radiusLabel ?? "Border radius",
				default: opts.radiusDefault ?? "none",
				hint: opts.radiusHint,
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

export interface BorderColorFieldOptions {
	label?: string;
	group?: string;
	default?: string;
}

/** The one border sub-field every node agrees on: a flat color. Width and
 * style diverge by design per node (free number vs. a curated select, single
 * value vs. independent per-side) — see `uniformBorderFields`/`borderSidesFields`. */
export function borderColorField(
	opts: BorderColorFieldOptions = {},
): FieldDescriptor<string> {
	return f.color({
		label: opts.label ?? "Border color",
		default: opts.default ?? "#e2e8f0",
		group: opts.group ?? "Style",
	});
}

export interface UniformBorderFields {
	borderWidth: FieldDescriptor<number>;
	borderColor: FieldDescriptor<string>;
}

export interface UniformBorderFieldOptions {
	group?: string;
	widthLabel?: string;
	widthDefault?: number;
	colorLabel?: string;
	colorDefault?: string;
}

/** A single-value border: one width (px, free number) + one color, applied
 * uniformly to all 4 sides with an implicit solid style. */
export function uniformBorderFields(
	opts: UniformBorderFieldOptions = {},
): UniformBorderFields {
	const g = opts.group ?? "Style";
	return {
		borderWidth: f.number({
			label: opts.widthLabel ?? "Border width",
			default: opts.widthDefault ?? 0,
			group: g,
		}),
		borderColor: borderColorField({
			label: opts.colorLabel,
			default: opts.colorDefault,
			group: g,
		}),
	};
}

export interface BorderSidesFields {
	borderTopWidth: FieldDescriptor<number>;
	borderRightWidth: FieldDescriptor<number>;
	borderBottomWidth: FieldDescriptor<number>;
	borderLeftWidth: FieldDescriptor<number>;
	borderStyle: FieldDescriptor<string>;
	borderColor: FieldDescriptor<string>;
}

export interface BorderSidesFieldOptions {
	group?: string;
	styleOptions?: ReadonlyArray<string>;
	colorDefault?: string;
}

/** Independent per-side border widths + one shared style + one shared color —
 * for nodes that let each edge have its own thickness (e.g. Group/Stack). */
export function borderSidesFields(
	opts: BorderSidesFieldOptions = {},
): BorderSidesFields {
	const g = opts.group ?? "Border";
	const side = (label: string) => f.number({ label, default: 0, group: g });
	return {
		borderTopWidth: side("Border top (px)"),
		borderRightWidth: side("Border right (px)"),
		borderBottomWidth: side("Border bottom (px)"),
		borderLeftWidth: side("Border left (px)"),
		borderStyle: f.select(
			opts.styleOptions ?? ["solid", "dashed", "dotted", "double"],
			{
				label: "Border style",
				default: "solid",
				group: g,
			},
		),
		borderColor: borderColorField({
			label: "Border color",
			default: opts.colorDefault,
			group: g,
		}),
	};
}
