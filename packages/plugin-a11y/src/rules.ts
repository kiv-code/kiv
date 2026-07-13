import type { KivDocument, KivNode, Localizable } from "@kivcode/engine";
import { HEADING_LEVEL_SIZE, resolveSolidColor } from "@kivcode/nodes";
import { contrastRatio, minimumContrastRatio } from "./contrast";

export type A11ySeverity = "error" | "warning";

export interface A11yIssue {
	ruleId: string;
	severity: A11ySeverity;
	nodeId: string;
	nodeType: string;
	message: string;
}

/** Depth-first, document-order walk of every node (including the root). */
export function walkDocument(
	doc: KivDocument,
	visit: (node: KivNode, ancestors: readonly KivNode[]) => void,
): void {
	function recurse(node: KivNode, ancestors: readonly KivNode[]): void {
		visit(node, ancestors);
		for (const children of Object.values(node.slots ?? {})) {
			for (const child of children) recurse(child, [...ancestors, node]);
		}
	}
	recurse(doc.root, []);
}

function isLocalizedObject(
	value: unknown,
): value is { $t: Record<string, unknown> } {
	return (
		typeof value === "object" &&
		value !== null &&
		!Array.isArray(value) &&
		"$t" in (value as Record<string, unknown>)
	);
}

/** Every per-locale value of a `Localizable<T>` — a single-element array for a plain (non-localized) value. */
function localizedValues<T>(value: Localizable<T> | undefined): T[] {
	if (value === undefined) return [];
	if (isLocalizedObject(value)) return Object.values(value.$t) as T[];
	return [value];
}

function isBlank(value: unknown): boolean {
	return typeof value !== "string" || value.trim().length === 0;
}

function hasAnyNonBlank(values: unknown[]): boolean {
	return values.some((v) => !isBlank(v));
}

function issue(
	ruleId: string,
	severity: A11ySeverity,
	node: KivNode,
	message: string,
): A11yIssue {
	return { ruleId, severity, nodeId: node.id, nodeType: node.type, message };
}

function checkImageAlt(node: KivNode): A11yIssue[] {
	if (node.type !== "image") return [];
	const values = localizedValues(
		node.props.alt as Localizable<string> | undefined,
	);
	if (values.length === 0 || !values.every((v) => !isBlank(v))) {
		return [
			issue(
				"image-alt",
				"error",
				node,
				"Image is missing alt text in one or more locales.",
			),
		];
	}
	return [];
}

function checkLinkText(node: KivNode): A11yIssue[] {
	if (node.type !== "link") return [];
	const hasSlotContent = (node.slots?.default?.length ?? 0) > 0;
	const hasText = hasAnyNonBlank(
		localizedValues(node.props.text as Localizable<string> | undefined),
	);
	if (!hasSlotContent && !hasText) {
		return [issue("link-text", "error", node, "Link has no discernible text.")];
	}
	return [];
}

function checkButtonLabel(node: KivNode): A11yIssue[] {
	if (node.type !== "button") return [];
	const hasLabel = hasAnyNonBlank(
		localizedValues(node.props.label as Localizable<string> | undefined),
	);
	if (!hasLabel) {
		return [
			issue("button-label", "error", node, "Button has no accessible label."),
		];
	}
	return [];
}

function checkVideoCaptions(node: KivNode): A11yIssue[] {
	if (node.type !== "video") return [];
	const hasCaption = hasAnyNonBlank(
		localizedValues(node.props.caption as Localizable<string> | undefined),
	);
	if (!hasCaption) {
		return [issue("video-captions", "warning", node, "Video has no captions.")];
	}
	return [];
}

/** Heading levels must not skip (h1 → h2 → h3, never h1 → h3), checked in document order. */
function checkHeadingLevels(doc: KivDocument): A11yIssue[] {
	const issues: A11yIssue[] = [];
	let lastLevel = 0;
	walkDocument(doc, (node) => {
		if (node.type !== "heading") return;
		const level = Number(node.props.level ?? 2);
		if (lastLevel > 0 && level > lastLevel + 1) {
			issues.push(
				issue(
					"heading-skip",
					"warning",
					node,
					`Heading level skips from h${lastLevel} to h${level} — use h${lastLevel + 1} instead.`,
				),
			);
		}
		lastLevel = level;
	});
	return issues;
}

/** Solid background color a "section"/"stack" node declares, or undefined for anything else/transparent/gradient. */
function ownBackground(node: KivNode): string | undefined {
	if (node.type !== "section" && node.type !== "stack") return undefined;
	const resolved = resolveSolidColor(node.props.background, "");
	return resolved || undefined;
}

function headingFontSize(node: KivNode): number {
	if (typeof node.props.size === "number") return node.props.size;
	return HEADING_LEVEL_SIZE[String(node.props.level ?? "2")] ?? 36;
}

/** Text/heading color against the nearest ancestor's solid background (default white), using the real WCAG formula. */
function checkColorContrast(doc: KivDocument): A11yIssue[] {
	const issues: A11yIssue[] = [];
	walkDocument(doc, (node, ancestors) => {
		if (node.type !== "heading" && node.type !== "text") return;

		let background = "#ffffff";
		for (let i = ancestors.length - 1; i >= 0; i--) {
			const bg = ownBackground(ancestors[i] as KivNode);
			if (bg) {
				background = bg;
				break;
			}
		}

		const foreground = resolveSolidColor(node.props.color, "");
		if (!foreground) return;

		const sizePx =
			node.type === "heading"
				? headingFontSize(node)
				: Number(node.props.size ?? 16);
		const bold =
			node.type === "heading"
				? Number(node.props.weight ?? 700) >= 700
				: Number(node.props.weight ?? 400) >= 700;

		const ratio = contrastRatio(foreground, background);
		if (ratio === null) return;

		const minimum = minimumContrastRatio(sizePx, bold);
		if (ratio < minimum) {
			issues.push(
				issue(
					"color-contrast",
					"error",
					node,
					`Contrast ratio ${ratio.toFixed(2)}:1 is below the WCAG AA minimum of ${minimum}:1 for this text size.`,
				),
			);
		}
	});
	return issues;
}

const NODE_RULES: Array<(node: KivNode) => A11yIssue[]> = [
	checkImageAlt,
	checkLinkText,
	checkButtonLabel,
	checkVideoCaptions,
];

/** Runs every accessibility rule against a document and returns all issues found, in document order. */
export function checkDocument(doc: KivDocument): A11yIssue[] {
	const issues: A11yIssue[] = [];
	walkDocument(doc, (node) => {
		for (const rule of NODE_RULES) issues.push(...rule(node));
	});
	issues.push(...checkHeadingLevels(doc));
	issues.push(...checkColorContrast(doc));
	return issues;
}
