import type { KivDocument, KivNode } from "../types";

export const CURRENT_SCHEMA_VERSION = 3;

export interface Migration {
	from: number;
	to: number;
	migrate(doc: KivDocument): KivDocument;
}

/** Applies `fn` to every node in the tree, depth-first, returning a new tree. */
function mapNodes(node: KivNode, fn: (n: KivNode) => KivNode): KivNode {
	const mapped = fn(node);
	if (!mapped.slots) return mapped;
	const slots: Record<string, KivNode[]> = {};
	for (const [name, children] of Object.entries(mapped.slots)) {
		slots[name] = children.map((child) => mapNodes(child, fn));
	}
	return { ...mapped, slots };
}

/**
 * Folds the old `paddingX`/`paddingY` shorthands into the per-side box that
 * replaced them. Tokens are carried over unchanged rather than converted to
 * pixels: each node resolves them through its own scale (a Section's `lg` is
 * deliberately larger than a Stack's), so converting here would bake in the
 * wrong number for exactly the nodes that matter most.
 */
function foldSpacing(
	props: Record<string, unknown>,
	axis: { x: string; y: string; box: string; out: string },
): Record<string, unknown> {
	const { x, y, box, out } = axis;
	// Card stored a single token under `padding` rather than an X/Y pair, so the
	// target key itself can hold a legacy string that must survive the fold.
	const uniform = typeof props[out] === "string" ? (props[out] as string) : "";
	const hasLegacy = x in props || y in props || box in props || uniform !== "";
	if (!hasLegacy) return props;

	const next = { ...props };
	delete next[x];
	delete next[y];
	delete next[box];

	const existing = props[box];
	const side = (v: unknown): string =>
		typeof v === "string" && v !== "none" ? v : "";
	const fromBox = (key: string): string => {
		if (!existing || typeof existing !== "object") return "";
		const v = (existing as Record<string, unknown>)[key];
		return typeof v === "string" ? v : "";
	};

	// An explicit per-side value already won over the shorthand before this
	// migration, so it keeps winning here.
	next[out] = {
		top: fromBox("top") || side(props[y]) || uniform,
		right: fromBox("right") || side(props[x]) || uniform,
		bottom: fromBox("bottom") || side(props[y]) || uniform,
		left: fromBox("left") || side(props[x]) || uniform,
	};
	return next;
}

/**
 * Normalizes the several ways a node used to describe an action into the one
 * shared `linkType` + `href` pair.
 *
 * `target` disappears because it was always derivable — only an external link
 * opens a new tab — and keeping both allowed a document to claim "external"
 * and "_self" at once. Modal's parallel `clickAction`/`actionHref` naming folds
 * into the same pair so every clickable node now speaks one vocabulary.
 */
function foldLink(props: Record<string, unknown>): Record<string, unknown> {
	const hasModalNames = "clickAction" in props || "actionHref" in props;
	const hasTarget = "target" in props;
	if (!hasModalNames && !hasTarget) return props;

	const next = { ...props };
	delete next.target;
	delete next.actionTarget;
	delete next.clickAction;
	delete next.actionHref;

	const href =
		(typeof props.href === "string" && props.href) ||
		(typeof props.actionHref === "string" && props.actionHref) ||
		"";
	// `#` was the old "no destination" placeholder; it would scroll to the top
	// of the page if it were kept as a real anchor.
	const realHref = href === "#" ? "" : href;

	let type = props.linkType ?? props.clickAction;
	if (typeof type !== "string") {
		if (props.target === "_blank" || props.actionTarget === "_blank")
			type = "external";
		else if (realHref.startsWith("#")) type = "anchor";
		else type = realHref ? "internal" : "none";
	}

	next.linkType = realHref ? type : "none";
	if (realHref) next.href = realHref;
	else delete next.href;
	return next;
}

/** The spacing tokens a Spacer's height used before it became a real length. */
const SPACER_HEIGHTS: Record<string, string> = {
	none: "0px",
	xs: "4px",
	sm: "8px",
	md: "16px",
	lg: "32px",
	xl: "64px",
	"2xl": "128px",
	"3xl": "192px",
};

/**
 * A Spacer's height is now a free length rather than a 7-step scale, so its
 * stored tokens are rewritten to the pixels they already rendered as. Doing it
 * here (instead of relying on read-side tolerance) is what lets the slider show
 * a real number instead of falling back to its raw-text mode.
 */
function foldSpacerHeight(
	type: string,
	props: Record<string, unknown>,
): Record<string, unknown> {
	if (type !== "spacer") return props;
	const h = props.height;
	if (typeof h !== "string" || !(h in SPACER_HEIGHTS)) return props;
	return { ...props, height: SPACER_HEIGHTS[h] };
}

/** Converts a stored `rem`/`px` CSS length (or a bare number) into the
 * pixel number the new typography `size` fields store. Anything unparseable
 * falls back to the field's new default rather than throwing. */
function pxFromLength(value: unknown, fallback: number): number {
	if (typeof value === "number") return Math.round(value);
	if (typeof value !== "string") return fallback;
	const trimmed = value.trim();
	const remMatch = /^(-?[\d.]+)rem$/.exec(trimmed);
	if (remMatch?.[1]) return Math.round(Number.parseFloat(remMatch[1]) * 16);
	const pxMatch = /^(-?[\d.]+)px$/.exec(trimmed);
	if (pxMatch?.[1]) return Math.round(Number.parseFloat(pxMatch[1]));
	const bare = Number.parseFloat(trimmed);
	return Number.isFinite(bare) ? Math.round(bare) : fallback;
}

/** Clamps a stored font-weight string to the nearest 100-step the new shared
 * weight select offers, so an old restricted-range value (e.g. one node's
 * "300"-"800") still lands on a value the picker recognizes. */
function clampWeight(value: unknown, fallback: string): string {
	if (typeof value !== "string") return fallback;
	const n = Number.parseInt(value, 10);
	if (!Number.isFinite(n)) return fallback;
	const clamped = Math.min(900, Math.max(100, Math.round(n / 100) * 100));
	return String(clamped);
}

/**
 * Link's inline-mode text style used to be `textColor`/`fontWeight`/a
 * `fontSize` text field (default `"inherit"`). It now shares the
 * `typographyFields()` shape (`color`/`weight`/a numeric `fontSize`), so the
 * old values are folded across rather than silently dropped.
 */
function foldLinkTypography(
	type: string,
	props: Record<string, unknown>,
): Record<string, unknown> {
	if (type !== "link") return props;
	const hasLegacy =
		"textColor" in props ||
		"fontWeight" in props ||
		typeof props.fontSize === "string";
	if (!hasLegacy) return props;

	const next = { ...props };
	if ("textColor" in next) {
		next.color = next.textColor;
		delete next.textColor;
	}
	if ("fontWeight" in next) {
		next.weight = clampWeight(next.fontWeight, "500");
		delete next.fontWeight;
	}
	if (typeof next.fontSize === "string") {
		next.fontSize =
			next.fontSize === "inherit" ? 16 : pxFromLength(next.fontSize, 16);
	}
	return next;
}

/** The `sm`/`md`/`lg` scale Countdown's `size` used before it became a free
 * pixel number, plus the `accentColor` → `color` rename. */
const COUNTDOWN_SIZE: Record<string, number> = { sm: 18, md: 28, lg: 40 };

function foldCountdownTypography(
	type: string,
	props: Record<string, unknown>,
): Record<string, unknown> {
	if (type !== "countdown") return props;
	const hasLegacy = "accentColor" in props || typeof props.size === "string";
	if (!hasLegacy) return props;

	const next = { ...props };
	if ("accentColor" in next) {
		next.color = next.accentColor;
		delete next.accentColor;
	}
	if (typeof next.size === "string") {
		next.size = COUNTDOWN_SIZE[next.size] ?? 28;
	}
	return next;
}

/** The `md`/`lg`/`xl`/`2xl` scale Stat's `size` used before it became a free
 * pixel number. */
const STAT_SIZE_PX: Record<string, number> = {
	md: 32,
	lg: 40,
	xl: 56,
	"2xl": 72,
};

function foldStatTypography(
	type: string,
	props: Record<string, unknown>,
): Record<string, unknown> {
	if (type !== "stat" || typeof props.size !== "string") return props;
	return { ...props, size: STAT_SIZE_PX[props.size] ?? 56 };
}

/** Agenda Item's seven text roles (stripe, title, description, and four
 * speaker sub-fields) each stored their font size as a `rem`/`px` string via
 * `sizeField()`; all seven now use the shared numeric `typographyFields()`
 * size. */
const AGENDA_ITEM_SIZE_DEFAULTS: Record<string, number> = {
	stripeFontSize: 14,
	titleFontSize: 15,
	descriptionFontSize: 13,
	speakerLabelFontSize: 11,
	speakerNameFontSize: 14,
	speakerTitleFontSize: 12,
	speakerCompanyFontSize: 12,
};

function foldAgendaItemTypography(
	type: string,
	props: Record<string, unknown>,
): Record<string, unknown> {
	if (type !== "agenda-item") return props;
	const keys = Object.keys(AGENDA_ITEM_SIZE_DEFAULTS);
	const hasLegacy = keys.some((k) => typeof props[k] === "string");
	if (!hasLegacy) return props;

	const next = { ...props };
	for (const key of keys) {
		if (typeof next[key] === "string") {
			next[key] = pxFromLength(next[key], AGENDA_ITEM_SIZE_DEFAULTS[key] ?? 16);
		}
	}
	return next;
}

export const migrations: Migration[] = [
	{
		from: 1,
		to: 2,
		migrate(doc) {
			return {
				...doc,
				schemaVersion: 2,
				root: mapNodes(doc.root, (node) => {
					let props = node.props;
					props = foldSpacing(props, {
						x: "paddingX",
						y: "paddingY",
						box: "paddingBox",
						out: "padding",
					});
					props = foldSpacing(props, {
						x: "marginX",
						y: "marginY",
						box: "marginBox",
						out: "margin",
					});
					props = foldLink(props);
					props = foldSpacerHeight(node.type, props);
					return props === node.props ? node : { ...node, props };
				}),
			};
		},
	},
	{
		from: 2,
		to: 3,
		migrate(doc) {
			return {
				...doc,
				schemaVersion: 3,
				root: mapNodes(doc.root, (node) => {
					let props = node.props;
					props = foldLinkTypography(node.type, props);
					props = foldCountdownTypography(node.type, props);
					props = foldStatTypography(node.type, props);
					props = foldAgendaItemTypography(node.type, props);
					return props === node.props ? node : { ...node, props };
				}),
			};
		},
	},
];

export function migrateDocument(doc: KivDocument): KivDocument {
	if (doc.schemaVersion === CURRENT_SCHEMA_VERSION) {
		return doc;
	}

	if (doc.schemaVersion > CURRENT_SCHEMA_VERSION) {
		throw new Error(
			`migrate: document schemaVersion ${doc.schemaVersion} is newer than engine version ${CURRENT_SCHEMA_VERSION}`,
		);
	}

	let current = { ...doc };

	for (let v = current.schemaVersion; v < CURRENT_SCHEMA_VERSION; v++) {
		const step = migrations.find((m) => m.from === v);
		if (!step) {
			throw new Error(
				`migrate: no migration found for schemaVersion ${v} → ${v + 1}`,
			);
		}
		current = { ...step.migrate(current), schemaVersion: step.to };
	}

	return current;
}
