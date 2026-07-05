import { describe, expect, it } from "vitest";
import { defaultTheme, resolveTheme, themeToCssVars, tokenRef } from "./index";

describe("resolveTheme", () => {
	it("devuelve el theme por defecto sin override", () => {
		expect(resolveTheme()).toBe(defaultTheme);
	});

	it("fusiona overrides parciales sin perder tokens base", () => {
		const theme = resolveTheme({ colors: { primary: "#ff0000" } });
		expect(theme.colors.primary).toBe("#ff0000");
		// Los demás colores siguen ahí.
		expect(theme.colors.background).toBe(defaultTheme.colors.background);
	});
});

describe("themeToCssVars", () => {
	it("convierte tokens en CSS variables con prefijo --kiv-", () => {
		const vars = themeToCssVars(resolveTheme());
		expect(vars["--kiv-color-primary"]).toBe("#6366f1");
		expect(vars["--kiv-spacing-md"]).toBe("1rem");
		expect(vars["--kiv-font-family-sans"]).toContain("system-ui");
	});
});

describe("tokenRef", () => {
	it("genera una referencia var() válida", () => {
		expect(tokenRef("color", "primary")).toBe("var(--kiv-color-primary)");
	});
});
