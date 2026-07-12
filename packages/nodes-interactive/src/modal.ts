import { defineNode, f } from "@kiv/engine";
import {
	colorOrGradientField,
	escapeHtml,
	spacingBoxField,
	styleToString,
} from "@kiv/nodes";

export const modalNode = defineNode({
	type: "modal",
	category: "interactive",
	label: "Modal",
	icon: "window",
	description: "A trigger that opens content in an overlay dialog.",
	toHtml(props, children) {
		const triggerLabel =
			props.triggerLabel !== undefined
				? escapeHtml(props.triggerLabel)
				: "Open";
		const trigger = `<button type="button" disabled data-kiv-modal-trigger style="${styleToString(
			{ cursor: "default" },
		)}">${triggerLabel}</button>`;
		const contentStyle = styleToString(
			resolveSpacingStyle("padding", props.contentPadding, "24px"),
		);
		const content = `<div data-kiv-modal-content style="${contentStyle}">${children.default ?? ""}</div>`;
		return `<div data-kiv-type="modal">${trigger}${content}</div>`;
	},
	fields: {
		size: f.select(["sm", "md", "lg", "xl", "full", "auto"], {
			label: "Size",
			default: "md",
			group: "Layout",
		}),
		contentPadding: spacingBoxField({
			label: "Content Padding",
			group: "Layout",
			hint: "Padding inside the modal panel around your content.",
		}),
		panelBackground: f.color({
			label: "Panel Background",
			default: "#ffffff",
			group: "Style",
		}),
		panelRadius: f.select(["sm", "md", "lg", "xl"], {
			label: "Panel Radius",
			default: "md",
			group: "Style",
		}),
		panelShadow: f.select(["none", "sm", "md", "lg", "xl"], {
			label: "Panel Shadow",
			default: "lg",
			group: "Style",
		}),
		closeOnOverlay: f.boolean({
			label: "Close on Overlay Click",
			default: true,
			group: "Behavior",
		}),
		closeOnEscape: f.boolean({
			label: "Close on Escape",
			default: true,
			group: "Behavior",
		}),
		showCloseButton: f.boolean({
			label: "Show Close Button",
			default: true,
			group: "Controls",
		}),
		preventScroll: f.boolean({
			label: "Prevent Background Scroll",
			default: true,
			group: "Behavior",
		}),
		animation: f.select(["fade", "slide-up", "slide-down", "zoom", "none"], {
			label: "Animation",
			default: "fade",
			group: "Style",
		}),
		overlayColor: f.color({
			label: "Overlay Color",
			default: "#000000",
			hint: "The overlay/backdrop color (opacity is fixed at 55%).",
			group: "Style",
		}),
		overlayBlur: f.select(["none", "sm", "md", "lg"], {
			label: "Overlay Blur",
			default: "none",
			hint: "Backdrop blur behind the modal.",
			group: "Style",
		}),

		// ── Auto-open ──
		autoOpen: f.boolean({
			label: "Auto Open",
			default: false,
			group: "Auto Open",
			hint: "Opens automatically without user clicking the trigger.",
		}),
		openDelay: f.number({
			label: "Open Delay (ms)",
			default: 1000,
			group: "Auto Open",
			showIf: { field: "autoOpen", equals: "true" },
			hint: "Milliseconds to wait before showing the modal.",
		}),
		openFrequency: f.select(["always", "once-session", "once-ever"], {
			label: "Show Frequency",
			default: "always",
			group: "Auto Open",
			showIf: { field: "autoOpen", equals: "true" },
			hint: "How often the auto-open modal reappears.",
		}),
		openTrigger: f.select(["load", "scroll", "exit-intent", "time"], {
			label: "Trigger On",
			default: "load",
			group: "Auto Open",
			showIf: { field: "autoOpen", equals: "true" },
		}),
		scrollPercent: f.number({
			label: "Scroll %",
			default: 50,
			group: "Auto Open",
			showIf: { field: "autoOpen", equals: "true" },
			hint: "Percentage of page scrolled before opening (only when Trigger On = scroll).",
		}),
		timeOnPage: f.number({
			label: "Time on Page (s)",
			default: 10,
			group: "Auto Open",
			showIf: { field: "autoOpen", equals: "true" },
			hint: "Seconds on page before opening (only when Trigger On = time).",
		}),

		// ── Trigger button customization ──
		showTrigger: f.boolean({
			label: "Show Trigger Button",
			default: true,
			group: "Trigger",
			hint: "Hide when using auto-open — the modal opens without a visible trigger.",
		}),
		triggerLabel: f.text({
			label: "Trigger Label",
			localizable: true,
			default: "Open",
			group: "Trigger",
			showIf: { field: "showTrigger", equals: "true" },
		}),
		triggerTag: f.select(["button", "a", "span"], {
			label: "Trigger Element",
			default: "button",
			group: "Trigger",
			showIf: { field: "showTrigger", equals: "true" },
		}),
		triggerVariant: f.select(
			["primary", "secondary", "outline", "ghost", "link", "custom"],
			{
				label: "Trigger Variant",
				default: "primary",
				group: "Trigger",
				showIf: { field: "showTrigger", equals: "true" },
			},
		),
		triggerIcon: f.text({
			label: "Trigger Icon",
			default: "",
			group: "Trigger",
			pluginControl: "icon-picker",
			showIf: { field: "showTrigger", equals: "true" },
		}),
		triggerIconPosition: f.select(["left", "right"], {
			label: "Icon Position",
			default: "left",
			group: "Trigger",
			showIf: { field: "showTrigger", equals: "true" },
		}),
		triggerSize: f.select(["xs", "sm", "md", "lg", "xl"], {
			label: "Trigger Size",
			default: "md",
			group: "Trigger",
			showIf: { field: "showTrigger", equals: "true" },
		}),
		triggerRadius: f.select(["none", "sm", "md", "lg", "xl", "full"], {
			label: "Trigger Radius",
			default: "md",
			group: "Trigger",
			showIf: { field: "showTrigger", equals: "true" },
		}),
		triggerPadding: spacingBoxField({
			label: "Trigger Padding",
			group: "Trigger",
			hint: "Override the per-side padding of the trigger button.",
			showIf: { field: "showTrigger", equals: "true" },
		}),
		triggerMargin: spacingBoxField({
			label: "Trigger Margin",
			group: "Trigger",
			showIf: { field: "showTrigger", equals: "true" },
		}),
		triggerBackground: colorOrGradientField({
			label: "Trigger Background",
			group: "Trigger",
			hint: "Custom background when variant = custom.",
			showIf: { field: "showTrigger", equals: "true" },
		}),
		triggerTextColor: f.color({
			label: "Trigger Text Color",
			default: "",
			group: "Trigger",
			hint: "Override text color. Empty = use variant default.",
			showIf: { field: "showTrigger", equals: "true" },
		}),
		triggerBorderColor: f.color({
			label: "Trigger Border Color",
			default: "",
			group: "Trigger",
			showIf: { field: "showTrigger", equals: "true" },
		}),
		triggerBorderWidth: f.number({
			label: "Trigger Border Width (px)",
			default: 0,
			group: "Trigger",
			showIf: { field: "showTrigger", equals: "true" },
		}),
		triggerShadow: f.select(["none", "sm", "md", "lg"], {
			label: "Trigger Shadow",
			default: "none",
			group: "Trigger",
			showIf: { field: "showTrigger", equals: "true" },
		}),
		triggerFullWidth: f.boolean({
			label: "Trigger Full Width",
			default: false,
			group: "Trigger",
			showIf: { field: "showTrigger", equals: "true" },
		}),

		// ── Click action (when trigger acts as a link) ──
		clickAction: f.select(["none", "internal", "external", "anchor"], {
			label: "Click Action",
			default: "none",
			group: "Action",
			hint: "What happens on click. none = open modal. Others navigate AND open.",
			showIf: { field: "showTrigger", equals: "true" },
		}),
		actionHref: f.text({
			label: "URL / Anchor",
			default: "#",
			group: "Action",
			showIf: { field: "showTrigger", equals: "true" },
			hint: "Internal path, external URL, or anchor (#section-id).",
		}),
		actionTarget: f.select(["_self", "_blank"], {
			label: "Open In",
			default: "_self",
			group: "Action",
			showIf: { field: "showTrigger", equals: "true" },
		}),
	},
});

function resolveSpacingStyle(
	prop: string,
	value: unknown,
	fallback: string,
): Record<string, string> {
	const resolved: Record<string, string> = {};
	if (value && typeof value === "object" && !Array.isArray(value)) {
		const box = value as Record<string, string>;
		const sides = ["top", "right", "bottom", "left"];
		const hasAny = sides.some((s) => box[s] && box[s] !== "");
		if (hasAny) {
			resolved[prop] = sides.map((s) => box[s] || fallback).join(" ");
			return resolved;
		}
	}
	resolved[prop] = fallback;
	return resolved;
}
