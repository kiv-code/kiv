import { describe, expect, it } from "vitest";
import { fromScale, GAP, RADIUS } from "./scales";

describe("fromScale", () => {
	it("resolves a known token through the scale", () => {
		expect(fromScale(RADIUS, "lg", "0")).toBe("16px");
	});

	it("passes an unknown value through untouched", () => {
		// This is what makes a closed scale open at the edges: a design the
		// scale genuinely cannot express still renders, instead of silently
		// collapsing to the default.
		expect(fromScale(RADIUS, "2.5rem", "0")).toBe("2.5rem");
		expect(fromScale(GAP, "clamp(1rem, 4vw, 3rem)", "16px")).toBe(
			"clamp(1rem, 4vw, 3rem)",
		);
	});

	it("uses the fallback only when there is no value at all", () => {
		expect(fromScale(GAP, undefined, "16px")).toBe("16px");
		expect(fromScale(GAP, "", "16px")).toBe("16px");
		expect(fromScale(GAP, null, "16px")).toBe("16px");
	});

	it("does not treat 0 tokens as absent", () => {
		expect(fromScale(RADIUS, "none", "99px")).toBe("0");
	});
});
