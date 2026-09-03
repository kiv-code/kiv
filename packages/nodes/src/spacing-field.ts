import type { FieldDescriptor } from "@kivcode/engine";
import { z } from "zod";
import { SPACING } from "./scales";

/** Shared shape for any field that controls the 4 sides of a box (padding, margin, gap...) independently. */
export interface SpacingBoxValue {
	top: string;
	right: string;
	bottom: string;
	left: string;
}

/** Empty string on a side means "inherit from the node's own fallback". */
export const DEFAULT_SPACING_BOX: SpacingBoxValue = {
	top: "",
	right: "",
	bottom: "",
	left: "",
};

export const spacingBoxSchema = z.object({
	top: z.string(),
	right: z.string(),
	bottom: z.string(),
	left: z.string(),
});

/**
 * A side holds EITHER a scale token (`"md"`) or a raw CSS length (`"2.5rem"`).
 * Tokens keep documents on the design system and stay correct when a node uses
 * its own scale (a Section's `lg` is deliberately larger than a Stack's);
 * raw lengths are the escape hatch for the cases a closed scale can't express.
 */
export type SpacingScale = Record<string, string>;

interface SpacingFieldOptions {
	label?: string;
	group?: string;
	hint?: string;
	default?: Partial<SpacingBoxValue>;
	showIf?: { field: string; equals: string | string[] };
	/** Token presets offered by the control. Defaults to the shared SPACING scale. */
	scale?: SpacingScale;
	responsive?: boolean;
}

/**
 * The single spacing field. Its control covers both the "same on every side"
 * and the "per side" cases, which is why nodes no longer declare a separate
 * `paddingX`/`paddingY` shorthand alongside it — one field, one source of truth.
 */
export function spacingField(
	opts: SpacingFieldOptions = {},
): FieldDescriptor<SpacingBoxValue> {
	return {
		schema: spacingBoxSchema,
		control: "text",
		pluginControl: "spacing-box",
		label: opts.label,
		group: opts.group,
		hint: opts.hint,
		showIf: opts.showIf,
		responsive: opts.responsive ?? true,
		spacingScale: opts.scale ?? SPACING,
		default: { ...DEFAULT_SPACING_BOX, ...opts.default },
	};
}

/** @deprecated Use `spacingField`. Kept as an alias so external node packages keep compiling. */
export const spacingBoxField = spacingField;

/**
 * Normalizes any stored value (a full per-side object, a single CSS length
 * applied to all 4 sides from before this field type existed, or nothing)
 * into a complete `SpacingBoxValue`. Exported so the Inspector control can
 * reuse this instead of naively spreading `modelValue` — see
 * normalizeColorOrGradient's identical concern in color-gradient.ts.
 */
export function normalizeSpacingBox(value: unknown): SpacingBoxValue {
	if (value && typeof value === "object") {
		return { ...DEFAULT_SPACING_BOX, ...(value as Partial<SpacingBoxValue>) };
	}
	if (typeof value === "string" && value) {
		return { top: value, right: value, bottom: value, left: value };
	}
	return DEFAULT_SPACING_BOX;
}

/**
 * Turns one side's stored value into CSS. A scale token resolves through the
 * node's own scale; anything else is already a CSS length and passes through,
 * which is what makes arbitrary values (`"2.5rem"`, `"clamp(1rem,4vw,3rem)"`)
 * work without a separate field.
 */
export function resolveSpacingValue(
	value: string,
	scale: SpacingScale = SPACING,
): string | undefined {
	if (!value) return undefined;
	return scale[value] ?? value;
}

/** Per-side fallback for `resolveSpacingStyle` — `undefined` means "no CSS declaration for this side" (browser default), distinct from an explicit "0". */
export type SpacingBoxFallback = Partial<
	Record<keyof SpacingBoxValue, string | undefined>
>;

/**
 * Resolves a spacing box to a ready-to-spread style object for `padding` or
 * `margin`. `fallback` can be a single CSS length (applied to every empty
 * side) or a per-side object for asymmetric defaults (e.g. tighter vertical
 * than horizontal padding, or no declaration at all on a given side).
 */
export function resolveSpacingStyle(
	property: "padding" | "margin",
	value: unknown,
	fallback: string | SpacingBoxFallback = "0",
	scale: SpacingScale = SPACING,
): Record<string, string | undefined> {
	const v = normalizeSpacingBox(value);
	const fb: SpacingBoxFallback =
		typeof fallback === "string"
			? { top: fallback, right: fallback, bottom: fallback, left: fallback }
			: fallback;
	return {
		[`${property}Top`]: resolveSpacingValue(v.top, scale) ?? fb.top,
		[`${property}Right`]: resolveSpacingValue(v.right, scale) ?? fb.right,
		[`${property}Bottom`]: resolveSpacingValue(v.bottom, scale) ?? fb.bottom,
		[`${property}Left`]: resolveSpacingValue(v.left, scale) ?? fb.left,
	};
}
