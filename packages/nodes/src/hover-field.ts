import { type FieldDescriptor, f } from "@kivcode/engine";

export interface HoverFields {
	hoverEffect: FieldDescriptor<string>;
	hoverGlowColor: FieldDescriptor<string>;
}

export interface HoverFieldOptions {
	group?: string;
	effects?: ReadonlyArray<string>;
	defaultEffect?: string;
}

export function hoverFields(opts: HoverFieldOptions = {}): HoverFields {
	const g = opts.group ?? "Effects";
	return {
		hoverEffect: f.select(opts.effects ?? ["none", "lift", "grow", "glow"], {
			label: "Hover Effect",
			default: opts.defaultEffect ?? "none",
			group: g,
		}),
		hoverGlowColor: f.color({
			label: "Glow color",
			default: "",
			hint: "Empty uses the default indigo glow.",
			showIf: { field: "hoverEffect", equals: "glow" },
			group: g,
		}),
	};
}
