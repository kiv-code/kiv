/**
 * A typeface the host project actually ships.
 *
 * The point of enumerating them is that the editor can only offer fonts that
 * really exist in the consuming app — picking a family the project never loads
 * produces a document that renders in a fallback face, which is the classic
 * "I chose a font and nothing changed" bug.
 */
export interface KivFont {
	/**
	 * Stable identifier stored in the document, e.g. `"montserrat"` — or a
	 * semantic role like `"heading"` / `"body"`.
	 *
	 * Documents reference this, never the raw stack, so changing the brand
	 * typeface in one place re-renders every node that uses the role.
	 */
	id: string;
	/** Name shown in the picker. */
	label: string;
	/** The CSS value, e.g. `'"Montserrat", sans-serif'`. */
	stack: string;
	/**
	 * The weights this family actually ships. The weight control offers only
	 * these, so a document can't ask for a 900 the font doesn't have (browsers
	 * silently synthesise a fake bold, which looks subtly wrong).
	 */
	weights: number[];
	/** Whether a real italic cut exists. */
	italic?: boolean;
	category?: "sans" | "serif" | "mono" | "display" | "handwriting";
}

/**
 * Implemented by the consumer app and injected via `createEngine({ fonts })`,
 * mirroring `MediaProvider`.
 *
 * `list()` is synchronous on purpose: the set of fonts a project ships is a
 * build-time design decision, not user content, and the picker needs it to
 * filter available weights as the user types.
 */
export interface FontProvider {
	list(): KivFont[];
	/**
	 * CSS the page needs for these fonts to load — `@import`, `@font-face`, or
	 * nothing when the host already loads them itself. `KivRenderer` injects it
	 * once so a published page carries its own typography instead of depending
	 * on the consumer remembering to add a stylesheet.
	 */
	stylesheet?(): string;
}

/** Weights offered when a font doesn't declare its own. */
export const DEFAULT_FONT_WEIGHTS = [300, 400, 500, 600, 700, 800, 900];

/**
 * The fallback used when the host injects no provider: the three generic
 * families every browser has. Never invents a typeface.
 */
export const SYSTEM_FONTS: KivFont[] = [
	{
		id: "sans",
		label: "Sans",
		stack: "ui-sans-serif, system-ui, sans-serif",
		weights: DEFAULT_FONT_WEIGHTS,
		italic: true,
		category: "sans",
	},
	{
		id: "serif",
		label: "Serif",
		stack: "ui-serif, Georgia, serif",
		weights: DEFAULT_FONT_WEIGHTS,
		italic: true,
		category: "serif",
	},
	{
		id: "mono",
		label: "Mono",
		stack: "ui-monospace, monospace",
		weights: [400, 500, 600, 700],
		italic: false,
		category: "mono",
	},
];

/** The provider used when none is configured. */
export const systemFontProvider: FontProvider = {
	list: () => SYSTEM_FONTS,
};

/**
 * Turns a stored `fontFamily` value into a CSS font stack.
 *
 * A known font id resolves through the provider; anything else passes through
 * untouched, so a raw stack still works when the design genuinely needs one the
 * project doesn't register. Same open-at-the-edges rule as `fromScale`.
 */
export function resolveFontStack(
	value: unknown,
	fonts: KivFont[],
	fallback = "inherit",
): string {
	if (value === undefined || value === null || value === "") return fallback;
	const key = String(value);
	return fonts.find((fnt) => fnt.id === key)?.stack ?? key;
}

/** The weights a family ships, or the full range when it isn't registered. */
export function fontWeights(value: unknown, fonts: KivFont[]): number[] {
	const key = String(value ?? "");
	return fonts.find((fnt) => fnt.id === key)?.weights ?? DEFAULT_FONT_WEIGHTS;
}
