import { type FieldDescriptor, f } from "@kivcode/engine";
import { resolveTextPaintStyle } from "./color-gradient";
import { LETTER_SPACING, LINE_HEIGHT } from "./scales";

export interface TypographyFields {
	size: FieldDescriptor<number>;
	weight: FieldDescriptor<string>;
	color: FieldDescriptor<string>;
	align: FieldDescriptor<string>;
	lineHeight: FieldDescriptor<string>;
	letterSpacing: FieldDescriptor<string>;
}

export interface TypographyFieldOptions {
	group?: string;
	defaultSize?: number;
	weightOptions?: ReadonlyArray<string>;
	weightDefault?: string;
	letterSpacingOptions?: ReadonlyArray<string>;
	letterSpacingDefault?: string;
	lineHeightDefault?: string;
	alignDefault?: string;
}

export function typographyFields(
	opts: TypographyFieldOptions = {},
): TypographyFields {
	const g = opts.group ?? "Typography";
	return {
		size: f.number({
			label: "Size (px)",
			default: opts.defaultSize ?? 16,
			responsive: true,
			group: g,
		}),
		weight: f.select(
			opts.weightOptions ?? ["300", "400", "500", "600", "700"],
			{
				label: "Weight",
				default: opts.weightDefault ?? "400",
				responsive: true,
				group: g,
			},
		),
		color: f.color({ label: "Color", default: "#000000", group: g }),
		align: f.select(["left", "center", "right", "justify"], {
			label: "Align",
			default: opts.alignDefault ?? "left",
			responsive: true,
			group: g,
		}),
		lineHeight: f.select(["tight", "snug", "normal", "relaxed", "loose"], {
			label: "Line height",
			default: opts.lineHeightDefault ?? "relaxed",
			group: g,
		}),
		letterSpacing: f.select(
			opts.letterSpacingOptions ?? [
				"tighter",
				"tight",
				"normal",
				"wide",
				"wider",
			],
			{
				label: "Letter spacing",
				default: opts.letterSpacingDefault ?? "normal",
				group: g,
			},
		),
	};
}

export interface TypographyStyleInput {
	size?: number;
	weight?: string;
	color?: unknown;
	align?: string;
	lineHeight?: string;
	letterSpacing?: string;
}

export function resolveTypographyStyle(
	props: TypographyStyleInput,
	defaults: {
		size?: number;
		weight?: string;
		colorFallback?: string;
		alignFallback?: string;
		lineHeightFallback?: string;
		letterSpacingFallback?: string;
	} = {},
): Record<string, string | undefined> {
	const size = props.size ?? defaults.size ?? 16;
	const weight = props.weight ?? defaults.weight ?? "400";
	const align = props.align ?? defaults.alignFallback ?? "left";
	const lh =
		LINE_HEIGHT[props.lineHeight ?? defaults.lineHeightFallback ?? "relaxed"] ??
		"1.6";
	const ls =
		LETTER_SPACING[
			props.letterSpacing ?? defaults.letterSpacingFallback ?? "normal"
		] ?? "0em";

	return {
		fontSize: `${size}px`,
		fontWeight: String(weight),
		...resolveTextPaintStyle(props.color, defaults.colorFallback ?? "inherit"),
		textAlign: align as "left" | "center" | "right" | "justify",
		lineHeight: lh,
		letterSpacing: ls,
		margin: "0",
	};
}
