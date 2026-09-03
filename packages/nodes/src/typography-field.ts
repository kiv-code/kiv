import {
	type FieldDescriptor,
	f,
	type KivFont,
	resolveFontStack,
} from "@kivcode/engine";
import { resolveTextPaintStyle } from "./color-gradient";
import { LETTER_SPACING, LINE_HEIGHT } from "./scales";

export interface TypographyFields {
	fontFamily: FieldDescriptor<string>;
	size: FieldDescriptor<number>;
	weight: FieldDescriptor<string>;
	color: FieldDescriptor<string>;
	align: FieldDescriptor<string>;
	lineHeight: FieldDescriptor<string>;
	letterSpacing: FieldDescriptor<string>;
	transform: FieldDescriptor<string>;
	fontStyle: FieldDescriptor<string>;
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
	transformDefault?: string;
}

export function typographyFields(
	opts: TypographyFieldOptions = {},
): TypographyFields {
	const g = opts.group ?? "Typography";
	return {
		// The picker offers only fonts the host project registered, so a
		// document can never reference a typeface the page will not load.
		fontFamily: f.text({
			label: "Font",
			default: "",
			group: g,
			pluginControl: "font-picker",
			hint: "Comes from the fonts this project ships. Empty = inherit from the page.",
		}),
		size: f.number({
			label: "Size (px)",
			default: opts.defaultSize ?? 16,
			responsive: true,
			group: g,
		}),
		// Rendered by a control that narrows the list to the weights the
		// selected family actually ships — asking for a 900 a font lacks makes
		// the browser synthesise a fake bold, which looks subtly wrong.
		weight: f.select(
			opts.weightOptions ?? [
				"100",
				"200",
				"300",
				"400",
				"500",
				"600",
				"700",
				"800",
				"900",
			],
			{
				label: "Weight",
				default: opts.weightDefault ?? "400",
				responsive: true,
				group: g,
				pluginControl: "font-weight",
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
				// `widest` existed in the scale but no default option list
				// reached it, so only Heading could ever use it.
				"widest",
			],
			{
				label: "Letter spacing",
				default: opts.letterSpacingDefault ?? "normal",
				responsive: true,
				group: g,
			},
		),
		transform: f.select(["none", "uppercase", "lowercase", "capitalize"], {
			label: "Transform",
			default: opts.transformDefault ?? "none",
			responsive: true,
			group: g,
		}),
		fontStyle: f.select(["normal", "italic"], {
			label: "Style",
			default: "normal",
			group: g,
		}),
	};
}

export interface TypographyStyleInput {
	fontFamily?: string;
	size?: number;
	weight?: string;
	color?: unknown;
	align?: string;
	lineHeight?: string;
	letterSpacing?: string;
	transform?: string;
	fontStyle?: string;
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
		/** Registered fonts, so a stored font id resolves to its real stack. */
		fonts?: KivFont[];
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
		// Falls back to `inherit` so an unset font follows the page, rather than
		// snapping every node to a default the design never asked for.
		fontFamily: resolveFontStack(props.fontFamily, defaults.fonts ?? [], ""),
		fontSize: `${size}px`,
		fontWeight: String(weight),
		...resolveTextPaintStyle(props.color, defaults.colorFallback ?? "inherit"),
		textAlign: align as "left" | "center" | "right" | "justify",
		lineHeight: lh,
		letterSpacing: ls,
		textTransform: props.transform === "none" ? undefined : props.transform,
		fontStyle: props.fontStyle === "normal" ? undefined : props.fontStyle,
		margin: "0",
	};
}
