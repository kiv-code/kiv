import { defineNode, f } from "@kivcode/engine";
import {
	colorOrGradientField,
	escapeHtml,
	GAP,
	sizeField,
	spacingBoxField,
	styleToString,
} from "@kivcode/nodes";

export const TAB_HOVER_OPTIONS = ["none", "lift", "grow"] as const;

export const tabsNode = defineNode({
	type: "tabs",
	category: "interactive",
	label: "Tabs",
	icon: "folder-tab",
	description: "Switchable set of titled panels.",
	slotConstraints: { default: ["tab-panel"] },
	toHtml(props, children) {
		const style = styleToString({
			display: "flex",
			flexDirection: props.orientation === "vertical" ? "row" : "column",
			gap: (props.contentGap as string) || GAP.md || "16px",
		});
		return `<div data-kiv-type="tabs" style="${style}">${children.default ?? ""}</div>`;
	},
	fields: {
		defaultTab: f.number({
			label: "Default Tab Index",
			default: 0,
			group: "Behavior",
		}),
		orientation: f.select(["horizontal", "vertical"], {
			label: "Orientation",
			default: "horizontal",
			group: "Layout",
		}),
		position: f.select(["top", "left", "right"], {
			label: "Tab Position",
			default: "top",
			group: "Layout",
		}),
		columns: f.select(["1", "2", "3", "4"], {
			label: "Columns (vertical mode)",
			default: "1",
			group: "Layout",
			hint: "Split vertical tabs into multiple columns.",
			showIf: { field: "orientation", equals: "vertical" },
		}),
		tabVariant: f.select(["underline", "pills", "buttons"], {
			label: "Tab Style",
			default: "underline",
			group: "Style",
		}),
		activeColor: colorOrGradientField({
			label: "Active Color",
			group: "Style",
			hint: "Background paint for the active tab (pills/buttons), or its accent color (underline).",
		}),
		inactiveColor: f.color({
			label: "Inactive Color",
			default: "#334155",
			group: "Style",
		}),
		activeTextColor: f.color({
			label: "Active Text Color",
			default: "",
			hint: "Override text color on the active tab. Empty = use variant default.",
			group: "Style",
		}),
		inactiveTextColor: f.color({
			label: "Inactive Text Color",
			default: "",
			hint: "Override text color on inactive tabs. Empty = use the Inactive Color above.",
			group: "Style",
		}),
		tabRadius: f.select(["none", "sm", "md", "lg", "xl", "full"], {
			label: "Tab Radius",
			default: "full",
			group: "Style",
		}),
		tabFontSize: f.select(["xs", "sm", "md", "lg"], {
			label: "Tab Font Size",
			default: "sm",
			group: "Style",
		}),
		tabFontWeight: f.select(["400", "500", "600", "700"], {
			label: "Tab Font Weight",
			default: "500",
			group: "Style",
		}),
		activeTabFontWeight: f.select(["400", "500", "600", "700"], {
			label: "Active Tab Font Weight",
			default: "700",
			group: "Style",
		}),
		hoverEffect: f.select([...TAB_HOVER_OPTIONS], {
			label: "Hover Effect",
			default: "lift",
			group: "Style",
			hint: "Applies to pills and buttons style — a subtle lift or grow on hover.",
		}),
		tabShadow: f.select(["none", "sm", "md", "lg"], {
			label: "Tab Shadow",
			default: "none",
			group: "Style",
			hint: "Drop shadow on every tab (pills/buttons), independent of hover.",
		}),
		activeShadow: f.select(["none", "sm", "md", "lg"], {
			label: "Active Tab Shadow",
			default: "none",
			group: "Style",
			hint: "Extra drop shadow on just the active tab.",
		}),
		tabBorder: f.boolean({
			label: "Show Tab Border",
			default: false,
			group: "Style",
			hint: "Adds a border around each tab button.",
		}),
		tabBorderColor: f.color({
			label: "Tab Border Color",
			default: "#e2e8f0",
			group: "Style",
			showIf: { field: "tabBorder", equals: "true" },
		}),
		contentBackground: f.color({
			label: "Content Background",
			default: "",
			hint: "Background color for the panel content area. Empty = transparent.",
			group: "Content",
		}),
		contentPadding: spacingBoxField({
			label: "Content Padding",
			group: "Content",
			hint: "Padding inside the panel content area.",
		}),
		contentBorderRadius: f.select(["none", "sm", "md", "lg", "xl"], {
			label: "Content Border Radius",
			default: "none",
			group: "Content",
		}),
		tabPadding: spacingBoxField({
			label: "Tab Padding",
			group: "Spacing",
			hint: "Padding inside each tab button. Empty side = default (8px vertical, 14px horizontal).",
		}),
		tabGap: sizeField({
			label: "Tab Gap",
			group: "Spacing",
			hint: "Gap between the tab buttons themselves.",
			units: [{ unit: "px", min: 0, max: 64, step: 1 }],
		}),
		contentGap: sizeField({
			label: "Content Gap",
			group: "Spacing",
			hint: "Gap between the tab list and the visible panel content.",
			units: [{ unit: "px", min: 0, max: 64, step: 1 }],
		}),
		animation: f.select(["fade", "slide", "none"], {
			label: "Animation",
			default: "fade",
			group: "Style",
		}),
		stretch: f.boolean({
			label: "Stretch Tabs",
			default: false,
			group: "Layout",
		}),
		fullWidth: f.boolean({
			label: "Full Width",
			default: false,
			responsive: true,
			group: "Layout",
		}),
	},
});

export const tabPanelNode = defineNode({
	type: "tab-panel",
	category: "interactive",
	label: "Tab Panel",
	icon: "file-text",
	description: "A single panel of content inside Tabs.",
	toHtml(props, children) {
		const title = props.title !== undefined ? escapeHtml(props.title) : "";
		const badgeStyle = styleToString({
			marginLeft: "8px",
			fontSize: "12px",
			color: props.badgeColor ? String(props.badgeColor) : undefined,
		});
		const badge =
			props.badge !== undefined && props.badge !== ""
				? `<span style="${badgeStyle}">${escapeHtml(props.badge)}</span>`
				: "";
		const header = title
			? `<div style="${styleToString({ fontWeight: "600", marginBottom: "8px" })}">${title}${badge}</div>`
			: "";
		return `<section data-kiv-type="tab-panel">${header}${children.default ?? ""}</section>`;
	},
	fields: {
		title: f.text({
			label: "Tab Title",
			localizable: true,
			inline: true,
			group: "Content",
		}),
		icon: f.text({
			label: "Tab Icon",
			default: "",
			group: "Style",
			pluginControl: "icon-picker",
		}),
		iconSize: f.number({
			label: "Icon Size (px)",
			default: 16,
			group: "Style",
		}),
		iconColor: f.color({
			label: "Icon Color",
			default: "",
			group: "Style",
		}),
		badge: f.text({
			label: "Badge",
			default: "",
			localizable: true,
			group: "Content",
		}),
		badgeColor: f.color({
			label: "Badge Color",
			default: "",
			group: "Content",
		}),
		titleColor: f.color({
			label: "Title Color",
			default: "",
			hint: "Override the tab title color for this specific panel.",
			group: "Style",
		}),
		titleFontSize: f.text({
			label: "Title Font Size",
			default: "",
			hint: "Override the tab title size for this panel (xs/sm/md/lg). Empty = inherit from Tabs.",
			group: "Style",
		}),
		disabled: f.boolean({
			label: "Disabled",
			default: false,
			group: "Behavior",
		}),
	},
});
