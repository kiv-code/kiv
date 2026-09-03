import { type FieldDescriptor, f } from "@kivcode/engine";

/**
 * How a node's action behaves. One vocabulary for every clickable node, so a
 * consumer app wires navigation once instead of per node type.
 *
 * - `internal` — an in-app route. Renderers hand it to the host's router
 *   (Vue `RouterLink`, React `linkComponent`) so it navigates without a reload.
 * - `external` — another site. Always opens in a new tab with `rel=noopener`.
 * - `anchor`  — a section on this page. Scrolls smoothly instead of navigating.
 * - `none`    — not clickable at all.
 */
export type LinkType = "none" | "internal" | "external" | "anchor";

const ALL_TYPES: LinkType[] = ["none", "internal", "external", "anchor"];

export interface LinkFieldsOptions {
	group?: string;
	default?: LinkType;
	/** Drop `none` for nodes that are always clickable (a Button is never inert). */
	includeNone?: boolean;
	hrefLabel?: string;
}

export interface LinkFields {
	linkType: FieldDescriptor<LinkType>;
	href: FieldDescriptor<string>;
}

/**
 * The shared action fields. `target` is deliberately absent: it was always
 * derivable from the link type (external opens a new tab, nothing else does),
 * and having both let a document say "external" and "_self" at the same time.
 */
export function linkFields(opts: LinkFieldsOptions = {}): LinkFields {
	const group = opts.group ?? "Link";
	const types =
		opts.includeNone === false
			? ALL_TYPES.filter((t) => t !== "none")
			: ALL_TYPES;
	return {
		linkType: f.select(types, {
			label: "Link type",
			default: opts.default ?? "none",
			group,
			hint: "Anchor scrolls to a section on this page. External opens a new tab. Internal navigates in-app.",
		}),
		href: f.text({
			label: opts.hrefLabel ?? "Destination",
			default: "",
			group,
			placeholder: "/about, https://…, or #section-id",
			showIf: { field: "linkType", equals: ["internal", "external", "anchor"] },
		}),
	};
}

export interface ResolvedLink {
	type: LinkType;
	href: string;
	target?: "_self" | "_blank";
	rel?: string;
	/** Element id an anchor link points at, without the leading `#`. */
	anchorId?: string;
}

/**
 * Normalizes a node's raw props into the attributes every renderer needs.
 *
 * Also absorbs the pre-`linkType` shape: documents written when nodes only had
 * `href` + `target` still resolve correctly, so no migration is required for
 * them to keep working — `target: "_blank"` reads as external, and a `#…` href
 * reads as an anchor.
 */
export function resolveLink(props: Record<string, unknown>): ResolvedLink {
	const href = typeof props.href === "string" ? props.href : "";
	const raw = props.linkType;
	let type: LinkType;

	if (typeof raw === "string" && ALL_TYPES.includes(raw as LinkType)) {
		type = raw as LinkType;
	} else if (props.target === "_blank") {
		type = "external";
	} else if (href.startsWith("#")) {
		type = "anchor";
	} else if (href) {
		type = "internal";
	} else {
		type = "none";
	}

	// A link type without a destination is inert — rendering `href="#"` would
	// scroll to the top of the page on click, which reads as a broken link.
	if (type !== "none" && !href) return { type: "none", href: "" };

	if (type === "anchor") {
		const anchorId = href.startsWith("#") ? href.slice(1) : href;
		return { type, href: `#${anchorId}`, target: "_self", anchorId };
	}
	if (type === "external") {
		return { type, href, target: "_blank", rel: "noopener noreferrer" };
	}
	return { type, href, target: "_self" };
}

/** Renders the resolved link as HTML attributes, for `toHtml` implementations. */
export function linkAttrs(
	link: ResolvedLink,
	escapeValue: (v: unknown) => string,
) {
	if (link.type === "none") return "";
	const rel = link.rel ? ` rel="${link.rel}"` : "";
	return ` href="${escapeValue(link.href)}" target="${escapeValue(link.target)}"${rel}`;
}
