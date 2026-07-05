import type { ThemeTokens } from "./types";

export const defaultTheme: ThemeTokens = {
	colors: {
		primary: "#6366f1",
		"primary-foreground": "#ffffff",
		secondary: "#334155",
		"secondary-foreground": "#f1f5f9",
		accent: "#6366f1",
		background: "#ffffff",
		foreground: "#0f172a",
		muted: "#f1f5f9",
		border: "#e2e8f0",
	},
	spacing: {
		none: "0",
		sm: "0.5rem",
		md: "1rem",
		lg: "2rem",
		xl: "4rem",
	},
	radius: {
		none: "0",
		sm: "0.25rem",
		md: "0.5rem",
		lg: "1rem",
		full: "9999px",
	},
	fontFamily: {
		sans: "ui-sans-serif, system-ui, sans-serif",
		serif: "ui-serif, Georgia, serif",
		mono: "ui-monospace, monospace",
	},
	fontSize: {
		sm: "0.875rem",
		base: "1rem",
		lg: "1.25rem",
		xl: "1.5rem",
		"2xl": "2rem",
		"3xl": "3rem",
	},
	fontWeight: {
		normal: "400",
		medium: "500",
		bold: "700",
	},
	shadow: {
		none: "none",
		sm: "0 1px 2px rgba(0,0,0,0.05)",
		md: "0 4px 6px rgba(0,0,0,0.1)",
		lg: "0 10px 15px rgba(0,0,0,0.1)",
	},
};
