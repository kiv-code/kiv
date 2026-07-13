import type { FieldDescriptor } from "@kivcode/engine";
import { z } from "zod";

/** Shared shape for any field that can be a solid color OR a linear gradient. */
export interface ColorOrGradientValue {
	type: "solid" | "gradient";
	/** Used when type === "solid". Empty string means "inherit from theme/variant". */
	solid: string;
	/** Opacity of the solid color, 0–1. Ignored in gradient mode. */
	alpha: number;
	from: string;
	/** Opacity of the "from" stop, 0–1. */
	fromAlpha: number;
	/** Optional middle stop. Empty string means no middle stop. */
	middle: string;
	/** Opacity of the "middle" stop, 0–1. Ignored when middle is empty. */
	middleAlpha: number;
	to: string;
	/** Opacity of the "to" stop, 0–1. */
	toAlpha: number;
	angle: number;
}

export const DEFAULT_COLOR_OR_GRADIENT: ColorOrGradientValue = {
	type: "solid",
	solid: "",
	alpha: 1,
	from: "#6366f1",
	fromAlpha: 1,
	middle: "",
	middleAlpha: 1,
	to: "#a855f7",
	toAlpha: 1,
	angle: 135,
};

export const colorOrGradientSchema = z.object({
	type: z.enum(["solid", "gradient"]),
	solid: z.string(),
	alpha: z.number(),
	from: z.string(),
	fromAlpha: z.number(),
	middle: z.string(),
	middleAlpha: z.number(),
	to: z.string(),
	toAlpha: z.number(),
	angle: z.number(),
});

interface ColorOrGradientFieldOptions {
	label?: string;
	group?: string;
	hint?: string;
	default?: Partial<ColorOrGradientValue>;
	showIf?: { field: string; equals: string | string[] };
}

/** Field descriptor for a solid-or-gradient color, rendered by the shared ColorGradientControl. */
export function colorOrGradientField(
	opts: ColorOrGradientFieldOptions = {},
): FieldDescriptor<ColorOrGradientValue> {
	return {
		schema: colorOrGradientSchema,
		control: "text",
		pluginControl: "color-gradient",
		label: opts.label,
		group: opts.group,
		hint: opts.hint,
		showIf: opts.showIf,
		default: { ...DEFAULT_COLOR_OR_GRADIENT, ...opts.default },
	};
}

/**
 * Normalizes any stored value (a full composite object, a legacy plain hex
 * string from before this field type existed, or nothing) into a complete
 * `ColorOrGradientValue`. Exported so the Inspector control can reuse this
 * instead of naively spreading `modelValue` — spreading a plain STRING via
 * `{...value}` iterates its characters as if it were array-like, producing
 * `{0: "#", 1: "0", ...}` numeric keys corrupting the object. That exact bug
 * showed up on a pre-migration document's `background: "#0f172a"` prop.
 */
export function normalizeColorOrGradient(value: unknown): ColorOrGradientValue {
	return normalize(value);
}

function normalize(value: unknown): ColorOrGradientValue {
	if (value && typeof value === "object") {
		return {
			...DEFAULT_COLOR_OR_GRADIENT,
			...(value as Partial<ColorOrGradientValue>),
		};
	}
	if (typeof value === "string" && value) {
		return { ...DEFAULT_COLOR_OR_GRADIENT, type: "solid", solid: value };
	}
	return DEFAULT_COLOR_OR_GRADIENT;
}

/** Converts `#rgb`/`#rrggbb` + an alpha (0–1) into an `rgba(...)` string. Returns the hex unchanged if it can't be parsed or alpha is effectively opaque. */
function withAlpha(hex: string, alpha: number): string {
	if (alpha >= 1) return hex;
	const clean = hex.trim().replace(/^#/, "");
	const isShort = clean.length === 3;
	if (!isShort && clean.length !== 6) return hex;
	const full = isShort
		? clean
				.split("")
				.map((c) => c + c)
				.join("")
		: clean;
	const num = Number.parseInt(full, 16);
	if (Number.isNaN(num)) return hex;
	const r = (num >> 16) & 255;
	const g = (num >> 8) & 255;
	const b = num & 255;
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function gradientCss(v: ColorOrGradientValue): string {
	const stops = [
		withAlpha(v.from, v.fromAlpha ?? 1),
		...(v.middle ? [withAlpha(v.middle, v.middleAlpha ?? 1)] : []),
		withAlpha(v.to, v.toAlpha ?? 1),
	];
	return `linear-gradient(${v.angle ?? 135}deg, ${stops.join(", ")})`;
}

/** Resolves the solid branch to a CSS color string, honoring the alpha slider. */
function solidPaint(v: ColorOrGradientValue, fallback: string): string {
	if (!v.solid) return fallback;
	return withAlpha(v.solid, v.alpha ?? 1);
}

/** Resolves to a `background` CSS value — valid whether solid or gradient. */
export function resolveBackgroundPaint(
	value: unknown,
	fallback = "transparent",
): string {
	const v = normalize(value);
	return v.type === "gradient" ? gradientCss(v) : solidPaint(v, fallback);
}

/**
 * Resolves to a plain solid color, ignoring gradient state. Used for contexts
 * that can't render a gradient (icon inheritance, borders) — falls back to
 * the theme/variant default when the value is a gradient or empty.
 */
export function resolveSolidColor(value: unknown, fallback: string): string {
	const v = normalize(value);
	return v.type === "solid" ? solidPaint(v, fallback) : fallback;
}

/**
 * Resolves TEXT color/gradient to a style object. A gradient can't be
 * assigned to `color` directly — it needs the background-clip trick, which
 * claims the element's own `background`, so apply this to a dedicated text
 * element (e.g. a label `<span>`), never to an element that also has its own
 * background fill.
 */
export function resolveTextPaintStyle(
	value: unknown,
	fallback = "currentColor",
): Record<string, string | undefined> {
	const v = normalize(value);
	if (v.type === "gradient") {
		return {
			background: gradientCss(v),
			backgroundClip: "text",
			webkitBackgroundClip: "text",
			color: "transparent",
			webkitTextFillColor: "transparent",
		};
	}
	return { color: solidPaint(v, fallback) };
}
