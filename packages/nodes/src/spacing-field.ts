import type { FieldDescriptor } from "@kiv/engine";
import { z } from "zod";

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

interface SpacingBoxFieldOptions {
	label?: string;
	group?: string;
	hint?: string;
	default?: Partial<SpacingBoxValue>;
	showIf?: { field: string; equals: string | string[] };
}

/** Field descriptor for independent per-side spacing, rendered by the shared SpacingBoxControl. */
export function spacingBoxField(
	opts: SpacingBoxFieldOptions = {},
): FieldDescriptor<SpacingBoxValue> {
	return {
		schema: spacingBoxSchema,
		control: "text",
		pluginControl: "spacing-box",
		label: opts.label,
		group: opts.group,
		hint: opts.hint,
		showIf: opts.showIf,
		default: { ...DEFAULT_SPACING_BOX, ...opts.default },
	};
}

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
): Record<string, string | undefined> {
	const v = normalizeSpacingBox(value);
	const fb: SpacingBoxFallback =
		typeof fallback === "string"
			? { top: fallback, right: fallback, bottom: fallback, left: fallback }
			: fallback;
	return {
		[`${property}Top`]: v.top || fb.top,
		[`${property}Right`]: v.right || fb.right,
		[`${property}Bottom`]: v.bottom || fb.bottom,
		[`${property}Left`]: v.left || fb.left,
	};
}
