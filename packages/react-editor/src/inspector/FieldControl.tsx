import type { Breakpoint, FieldDescriptor } from "@kivcode/engine";
import type { ComponentType } from "react";
import { useContext } from "react";
import { EditorExtensions, useEditorExtensionsVersion } from "../extensions";
import { EditorExtensionsContext } from "../store/context";
import { BooleanControl } from "./controls/BooleanControl";
import { ColorControl } from "./controls/ColorControl";
import { NumberControl } from "./controls/NumberControl";
import { SelectControl } from "./controls/SelectControl";
import { TextareaControl } from "./controls/TextareaControl";
import { TextControl } from "./controls/TextControl";

export interface FieldControlProps {
	fieldKey: string;
	descriptor: FieldDescriptor;
	value: unknown;
	breakpoint?: Breakpoint;
	locale?: string;
	/** The whole node's props — lets a control depend on a sibling field, e.g.
	 * the weight control narrowing its options to the chosen font's real cuts. */
	nodeProps?: Record<string, unknown>;
	onChange: (value: unknown) => void;
}

/**
 * Props every plugin-registered custom field control receives — see
 * KivEditor's `extensions.addFieldControl(...)` calls for the built-in ones
 * (color-gradient, icon-picker, media-picker, size-slider, spacing-box,
 * table-editor, pricing-editor, social-links-editor). Matches the Vue
 * customControl's `:model-value`/`:field-key`/`:descriptor`/
 * `@update:model-value` bindings, renamed to this package's `value`/
 * `onChange` two-way-binding convention.
 */
export interface PluginFieldControlProps {
	value: unknown;
	fieldKey: string;
	descriptor: FieldDescriptor;
	nodeProps?: Record<string, unknown>;
	onChange: (value: unknown) => void;
}

const BP_SHORT: Record<string, string> = {
	base: "",
	sm: "SM",
	md: "MD",
	lg: "LG",
	xl: "XL",
};

// Stable fallback so the extensions-version hook below can always be called
// unconditionally (Rules of Hooks) even when this control renders outside an
// EditorExtensionsContext.Provider (e.g. isolated tests) — mirrors the Vue
// version's `inject(EDITOR_EXTENSIONS_KEY, null)` graceful-null handling.
const FALLBACK_EXTENSIONS = new EditorExtensions();

export function FieldControl({
	fieldKey,
	descriptor,
	value,
	breakpoint,
	locale,
	nodeProps,
	onChange,
}: FieldControlProps) {
	const extensions = useContext(EditorExtensionsContext);
	// Re-renders whenever a plugin registers/replaces a field control, same as
	// the Vue version reactively reading off `shallowReactive` extension maps.
	useEditorExtensionsVersion(extensions ?? FALLBACK_EXTENSIONS);

	// Check if a plugin has registered a custom control for this field type
	const pluginControlKey = descriptor.pluginControl ?? descriptor.control;
	const customControl = pluginControlKey
		? extensions?.getFieldControl(pluginControlKey)
		: undefined;
	const CustomControl = customControl as
		| ComponentType<PluginFieldControlProps>
		| undefined;

	const label = descriptor.label ?? fieldKey;

	const selectOptions = descriptor.options?.map((o) => String(o.value)) ?? [];

	const bpBadge =
		descriptor.responsive && breakpoint && breakpoint !== "base"
			? (BP_SHORT[breakpoint] ?? "")
			: "";
	const localeBadge = locale ? locale.toUpperCase() : "";

	return (
		<div className="kiv-field">
			{/* Label row: label on left, badges on right (never overlaps the control) */}
			{descriptor.control !== "boolean" && (
				<div className="kiv-field__label-row">
					<span className="kiv-field__label">{label}</span>
					<span className="kiv-field__badges">
						{localeBadge && (
							<span className="kiv-field__locale-badge">{localeBadge}</span>
						)}
						{bpBadge && <span className="kiv-field__bp-badge">{bpBadge}</span>}
					</span>
				</div>
			)}

			{/* Custom plugin control (if registered for this field type) */}
			{CustomControl ? (
				<CustomControl
					value={value}
					fieldKey={fieldKey}
					descriptor={descriptor}
					nodeProps={nodeProps}
					onChange={onChange}
				/>
			) : descriptor.control === "boolean" ? (
				// For boolean we pass the badge separately so BooleanControl can show it inline
				<BooleanControl
					label={label}
					bpBadge={bpBadge}
					value={value as boolean | undefined}
					onChange={onChange as (value: boolean) => void}
				/>
			) : descriptor.control === "color" ? (
				<ColorControl
					value={value as string | undefined}
					onChange={onChange as (value: string) => void}
				/>
			) : descriptor.control === "select" ? (
				<SelectControl
					value={value as string | undefined}
					options={selectOptions}
					onChange={onChange as (value: string) => void}
				/>
			) : descriptor.control === "number" ? (
				<NumberControl
					value={value as number | undefined}
					onChange={onChange as (value: number) => void}
				/>
			) : descriptor.control === "textarea" ? (
				<TextareaControl
					value={value as string | undefined}
					placeholder={descriptor.placeholder}
					onChange={onChange as (value: string) => void}
				/>
			) : (
				<TextControl
					value={value as string | undefined}
					onChange={onChange as (value: string) => void}
				/>
			)}
			{/* Node authors write these to disambiguate overlapping fields (e.g. how
			    `paddingBox` interacts with the `paddingX/Y` shorthand). */}
			{descriptor.hint && <p className="kiv-field__hint">{descriptor.hint}</p>}
		</div>
	);
}
