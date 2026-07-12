import { defineNode, f } from "@kiv/engine";
import { escapeHtml, GAP, RADIUS, SPACING, styleToString } from "@kiv/nodes";

export const accordionNode = defineNode({
	type: "accordion",
	category: "interactive",
	label: "Accordion",
	icon: "chevrons-down-up",
	description: "Collapsible list of titled panels.",
	slotConstraints: { default: ["accordion-item"] },
	toHtml(props, children) {
		const style = styleToString({
			display: "flex",
			flexDirection: "column",
			gap: GAP[String(props.gap ?? "sm")] ?? "8px",
		});
		return `<div data-kiv-type="accordion" style="${style}">${children.default ?? ""}</div>`;
	},
	fields: {
		allowMultiple: f.boolean({
			label: "Allow Multiple Open",
			default: false,
			group: "Behavior",
		}),
		keepOneOpen: f.boolean({
			label: "Keep One Open",
			default: true,
			group: "Behavior",
		}),
		defaultOpenIndex: f.number({
			label: "Default Open Index",
			default: 0,
			group: "Behavior",
		}),
		animation: f.select(["slide", "fade", "none"], {
			label: "Animation",
			default: "slide",
			group: "Style",
		}),
		animationDuration: f.number({
			label: "Duration (ms)",
			default: 200,
			group: "Style",
		}),
		icon: f.select(["chevron", "plus", "arrow"], {
			label: "Expand Icon",
			default: "chevron",
			group: "Style",
		}),
		iconPosition: f.select(["left", "right"], {
			label: "Icon Position",
			default: "right",
			group: "Style",
		}),
		iconSize: f.number({
			label: "Icon Size (px)",
			default: 12,
			group: "Style",
		}),
		gap: f.select(["none", "xs", "sm", "md", "lg"], {
			label: "Gap Between Items",
			default: "sm",
			group: "Layout",
		}),
		borderRadius: f.select(["none", "sm", "md", "lg"], {
			label: "Border Radius",
			default: "md",
			group: "Style",
		}),
		itemBorderRadius: f.select(["none", "sm", "md", "lg"], {
			label: "Item Border Radius",
			default: "sm",
			group: "Style",
			hint: "Border radius for each individual accordion item.",
		}),
		showSeparator: f.boolean({
			label: "Show Separator Line",
			default: false,
			group: "Style",
			hint: "Adds a border-bottom between accordion items.",
		}),
		separatorColor: f.color({
			label: "Separator Color",
			default: "#e2e8f0",
			group: "Style",
			showIf: { field: "showSeparator", equals: "true" },
		}),
	},
});

export const accordionItemNode = defineNode({
	type: "accordion-item",
	category: "interactive",
	label: "Accordion Item",
	icon: "chevron-right",
	description: "A single titled, collapsible panel inside an Accordion.",
	toHtml(props, children) {
		const background =
			props.background && props.background !== "transparent"
				? String(props.background)
				: undefined;
		const wrapStyle = styleToString({
			background,
			borderRadius: RADIUS.sm ?? "4px",
			overflow: "hidden",
		});
		const summaryStyle = styleToString({
			cursor: props.disabled ? "not-allowed" : "pointer",
			color: props.titleColor ? String(props.titleColor) : undefined,
			fontWeight: String(props.titleFontWeight ?? "600"),
			fontSize: props.titleFontSize ? `${props.titleFontSize}px` : undefined,
			padding: SPACING[String(props.padding ?? "md")] ?? "12px 16px",
			opacity: props.disabled ? "0.5" : undefined,
		});
		const bodyStyle = styleToString({
			padding: SPACING[String(props.bodyPadding ?? "md")] ?? "0 16px 16px",
		});
		const title = props.title !== undefined ? escapeHtml(props.title) : "";
		const openAttr = props.defaultOpen ? " open" : "";
		const disabledAttr = props.disabled ? ' aria-disabled="true"' : "";
		return (
			`<details data-kiv-type="accordion-item" style="${wrapStyle}"${openAttr}${disabledAttr}>` +
			`<summary style="${summaryStyle}">${title}</summary>` +
			`<div style="${bodyStyle}">${children.default ?? ""}</div>` +
			`</details>`
		);
	},
	fields: {
		title: f.text({
			label: "Title",
			localizable: true,
			inline: true,
			group: "Content",
		}),
		defaultOpen: f.boolean({
			label: "Open by Default",
			default: false,
			group: "Behavior",
		}),
		disabled: f.boolean({
			label: "Disabled",
			default: false,
			group: "Behavior",
		}),
		icon: f.text({ label: "Custom Icon", default: "", group: "Style" }),
		background: f.color({
			label: "Background",
			default: "transparent",
			group: "Style",
		}),
		titleColor: f.color({ label: "Title Color", default: "", group: "Style" }),
		titleFontSize: f.number({
			label: "Title Font Size (px)",
			default: 0,
			hint: "0 = inherit from Accordion settings.",
			group: "Style",
		}),
		titleFontWeight: f.select(["400", "500", "600", "700"], {
			label: "Title Font Weight",
			default: "600",
			group: "Style",
		}),
		padding: f.select(["none", "xs", "sm", "md", "lg"], {
			label: "Header Padding",
			default: "md",
			group: "Spacing",
		}),
		bodyPadding: f.select(["none", "xs", "sm", "md", "lg"], {
			label: "Body Padding",
			default: "md",
			group: "Spacing",
		}),
	},
});
