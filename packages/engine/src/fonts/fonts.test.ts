import { describe, expect, it } from "vitest";
import type { KivFont } from "./types";
import {
	DEFAULT_FONT_WEIGHTS,
	fontWeights,
	resolveFontStack,
	SYSTEM_FONTS,
	systemFontProvider,
} from "./types";

const FONTS: KivFont[] = [
	{
		id: "montserrat",
		label: "Montserrat",
		stack: '"Montserrat", sans-serif',
		weights: [400, 700, 900],
	},
	{
		id: "mono",
		label: "Mono",
		stack: "ui-monospace, monospace",
		weights: [400, 700],
	},
];

describe("resolveFontStack", () => {
	it("resolves a registered id to its real stack", () => {
		expect(resolveFontStack("montserrat", FONTS)).toBe(
			'"Montserrat", sans-serif',
		);
	});

	it("inherits when nothing is set, rather than forcing a default face", () => {
		expect(resolveFontStack("", FONTS)).toBe("inherit");
		expect(resolveFontStack(undefined, FONTS)).toBe("inherit");
	});

	it("honours an explicit fallback", () => {
		expect(resolveFontStack(undefined, FONTS, "")).toBe("");
	});

	it("passes an unregistered value through as a raw stack", () => {
		// Same open-at-the-edges rule as `fromScale`: a design that genuinely
		// needs a face the project doesn't register still renders.
		expect(resolveFontStack("Impact, sans-serif", FONTS)).toBe(
			"Impact, sans-serif",
		);
	});

	it("inherits when the host registered no fonts at all", () => {
		expect(resolveFontStack("montserrat", [])).toBe("montserrat");
	});
});

describe("fontWeights", () => {
	it("returns only the cuts the family actually ships", () => {
		// Offering a weight the font lacks makes the browser synthesise a fake
		// bold — it renders, so nothing looks broken, it just looks wrong.
		expect(fontWeights("montserrat", FONTS)).toEqual([400, 700, 900]);
		expect(fontWeights("mono", FONTS)).toEqual([400, 700]);
	});

	it("falls back to the full range for an unregistered family", () => {
		expect(fontWeights("something-else", FONTS)).toEqual(DEFAULT_FONT_WEIGHTS);
		expect(fontWeights(undefined, FONTS)).toEqual(DEFAULT_FONT_WEIGHTS);
	});
});

describe("systemFontProvider", () => {
	it("offers only generic families, never an invented typeface", () => {
		expect(systemFontProvider.list()).toBe(SYSTEM_FONTS);
		for (const font of SYSTEM_FONTS) {
			expect(font.stack).toMatch(
				/system-ui|Georgia|monospace|serif|sans-serif/,
			);
		}
	});

	it("ships no stylesheet, because system families need no loading", () => {
		expect(systemFontProvider.stylesheet).toBeUndefined();
	});
});
