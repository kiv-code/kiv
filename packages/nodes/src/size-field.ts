import type { FieldDescriptor } from "@kivcode/engine";
import { z } from "zod";

export interface SizeUnitConfig {
	unit: string;
	min: number;
	max: number;
	step?: number;
}

const DEFAULT_UNITS: SizeUnitConfig[] = [
	{ unit: "%", min: 0, max: 100, step: 1 },
	{ unit: "px", min: 0, max: 1200, step: 1 },
];

export interface SizeFieldOptions {
	label?: string;
	group?: string;
	default?: string;
	responsive?: boolean;
	hint?: string;
	units?: SizeUnitConfig[];
}

/**
 * A free-form CSS length field ("42px", "60%", ...) rendered as a slider +
 * exact number + unit tabs, instead of a fixed list of preset values — the
 * value is still a plain string, so nodes consume it exactly like any other
 * text-based size prop.
 */
export function sizeField(
	opts: SizeFieldOptions = {},
): FieldDescriptor<string> {
	return {
		schema: z.string(),
		control: "text",
		pluginControl: "size-slider",
		default: opts.default ?? "",
		label: opts.label,
		group: opts.group,
		responsive: opts.responsive ?? true,
		hint: opts.hint,
		sliderUnits: opts.units ?? DEFAULT_UNITS,
	};
}
