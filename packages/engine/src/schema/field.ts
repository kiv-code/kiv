import type { ZodType } from "zod";

/** Which control the inspector shows for this field. */
export type FieldControl =
	| "text"
	| "textarea"
	| "number"
	| "select"
	| "boolean"
	| "color";

/** Descriptor of a node's property. */
export interface FieldDescriptor<T = unknown> {
	/** Zod validator for the base value (not wrapped in responsive/locale). */
	schema: ZodType;
	/** Control that the inspector renders. */
	control: FieldControl;
	/** Default value when creating the node. */
	default?: T;
	/** Label visible in the inspector. */
	label?: string;
	/** Group/section in the inspector (e.g. "Layout", "Typography", "Background"). */
	group?: string;
	/** If true, the value can be translated per locale. */
	localizable?: boolean;
	/** If true, the value can vary per breakpoint. */
	responsive?: boolean;
	/** Options, only for the 'select' control. */
	options?: ReadonlyArray<{ label: string; value: T }>;
	/** If true, the field can be edited inline on the canvas (click directly on the node). */
	inline?: boolean;
	/**
	 * Conditional visibility in the inspector: the field is only shown if the
	 * node's `field` prop equals one of `equals`. Enables dynamic forms
	 * (e.g. showing gradient fields only if backgroundType=gradient).
	 * Does not affect rendering or the JSON — it's purely a hint for the inspector.
	 */
	showIf?: { field: string; equals: string | string[] };
	/** Placeholder text shown in the control when empty. */
	placeholder?: string;
	/** Helper text shown below the control in the inspector. */
	hint?: string;
	/** Marks the field as required (visual hint for the inspector). */
	required?: boolean;
	/** Hides the field from the inspector (for system props). */
	hidden?: boolean;
	/**
	 * Override the control with a plugin-registered custom control name.
	 * If set, the editor checks extension points for a control with this name
	 * and renders it instead of the default control type.
	 */
	pluginControl?: string;
	/**
	 * Per-unit slider ranges for a free-form size field (e.g. `pluginControl: "size-slider"`).
	 * The value itself is still a plain CSS length string ("42px", "60%") — this
	 * only configures the slider/unit-tab UI, it does not constrain the schema.
	 */
	sliderUnits?: ReadonlyArray<{
		unit: string;
		min: number;
		max: number;
		step?: number;
	}>;
	/**
	 * Token presets for a spacing field (e.g. `pluginControl: "spacing-box"`),
	 * mapping a scale token to its CSS length. The control offers these as
	 * one-click presets while still accepting any raw CSS length, so a node
	 * stays on the design system by default without becoming a closed set.
	 * Nodes may pass their own scale — a Section's rhythm is deliberately
	 * larger than a Stack's for the same token name.
	 */
	spacingScale?: Readonly<Record<string, string>>;
	/**
	 * Lets a size field express "no value" (auto / inherit / unset) alongside
	 * its numeric range. Without it the slider has no way back to the unset
	 * state once touched, so a field whose natural default is "no declaration"
	 * (a Section's min-height, an inherited font size) silently becomes 0.
	 */
	allowAuto?: boolean;
	/** Label for the auto state. Defaults to "auto". */
	autoLabel?: string;
}
