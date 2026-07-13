/**
 * Shared, framework-agnostic style scales.
 *
 * These are the single source of truth for spacing / radius / shadow / gap /
 * typography scales that every renderer (@kivcode/vue, @kivcode/react, …) must resolve
 * identically. A node definition lives here in @kivcode/nodes; each renderer imports
 * these maps so a `paddingY: "lg"` renders the SAME pixels in Vue and React.
 *
 * Values are raw CSS strings (px / unitless). They are intentionally NOT theme
 * tokens (var(--kiv-*)) so a renderer works even without an injected theme; a
 * consumer that wants themeable spacing can still override via the theme engine.
 */

/** Spacing scale — padding, margin. Superset used across Section/Stack/Container/Column. */
export const SPACING: Record<string, string> = {
	none: "0",
	xs: "4px",
	sm: "8px",
	md: "16px",
	lg: "32px",
	xl: "64px",
	"2xl": "128px",
	"3xl": "192px",
};

/**
 * Section uses a larger vertical rhythm than inner containers.
 * Kept separate so a full-width Section band breathes more than a Stack gap.
 */
export const SECTION_SPACING: Record<string, string> = {
	none: "0",
	xs: "8px",
	sm: "16px",
	md: "32px",
	lg: "64px",
	xl: "96px",
	"2xl": "128px",
};

/** Gap scale — flex/grid gaps (Stack, Grid). */
export const GAP: Record<string, string> = {
	none: "0",
	xs: "4px",
	sm: "8px",
	md: "16px",
	lg: "32px",
	xl: "48px",
};

/** Border-radius scale. */
export const RADIUS: Record<string, string> = {
	none: "0",
	sm: "4px",
	md: "8px",
	lg: "16px",
	xl: "24px",
	full: "9999px",
};

/** Button radius scale — tighter than layout radius (buttons look wrong at 16px). */
export const BUTTON_RADIUS: Record<string, string> = {
	none: "0",
	sm: "4px",
	md: "6px",
	lg: "10px",
	xl: "16px",
	full: "9999px",
};

/** Layered shadow scale (Section — richest). */
export const SHADOW: Record<string, string> = {
	none: "none",
	sm: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
	md: "0 4px 16px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)",
	lg: "0 10px 40px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.12)",
	xl: "0 20px 60px rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.15)",
};

/** Blur scale (Section backdrop). */
export const BLUR: Record<string, string> = {
	none: "0",
	sm: "4px",
	md: "8px",
	lg: "16px",
};

/**
 * Candidate pixel widths for Image's responsive `srcset`. Shared so every
 * renderer generates the SAME breakpoint set from a MediaProvider — matches
 * the resolver's mobile-first breakpoints (sm/md/lg/xl) plus a small base.
 */
export const IMAGE_SRCSET_WIDTHS: readonly number[] = [
	400, 640, 768, 1024, 1280, 1600,
];

/** Container max-width scale. */
export const MAX_WIDTH: Record<string, string> = {
	xs: "480px",
	sm: "640px",
	md: "768px",
	lg: "1024px",
	xl: "1280px",
	"2xl": "1536px",
	full: "100%",
};

/** Line-height scale (Heading, Text). */
export const LINE_HEIGHT: Record<string, string> = {
	tight: "1.1",
	snug: "1.25",
	normal: "1.4",
	relaxed: "1.6",
	loose: "2",
};

/** Letter-spacing scale (Heading, Text). */
export const LETTER_SPACING: Record<string, string> = {
	tighter: "-0.05em",
	tight: "-0.025em",
	normal: "0em",
	wide: "0.025em",
	wider: "0.05em",
	widest: "0.1em",
};

/** Stat counter font sizes. */
export const STAT_SIZE: Record<string, string> = {
	md: "32px",
	lg: "40px",
	xl: "56px",
	"2xl": "72px",
};

/** Default font-size (px) per heading level. */
export const HEADING_LEVEL_SIZE: Record<string, number> = {
	"1": 48,
	"2": 36,
	"3": 28,
	"4": 22,
	"5": 18,
	"6": 16,
};

/**
 * Button variant styles — shared so Vue and React buttons look identical.
 *
 * Colors reference theme CSS variables (var(--kiv-color-*)) with a hardcoded
 * fallback, so:
 *   - if the consumer injects the theme (engine.css()), buttons take THEIR
 *     brand color automatically — change the theme once, all buttons update;
 *   - if no theme is present, the fallback keeps buttons looking right.
 * A per-button custom color (see ButtonNode) overrides these entirely.
 */
export interface ButtonVariantStyle {
	background: string;
	color: string;
	border: string;
	textDecoration?: string;
}
export const BUTTON_VARIANT: Record<string, ButtonVariantStyle> = {
	primary: {
		background: "var(--kiv-color-primary, #6366f1)",
		color: "var(--kiv-color-primary-foreground, #ffffff)",
		border: "2px solid transparent",
	},
	secondary: {
		background: "var(--kiv-color-secondary, #334155)",
		color: "var(--kiv-color-secondary-foreground, #f1f5f9)",
		border: "2px solid transparent",
	},
	ghost: {
		background: "transparent",
		color: "var(--kiv-color-primary, #6366f1)",
		border: "2px solid transparent",
	},
	outline: {
		background: "transparent",
		color: "var(--kiv-color-primary, #6366f1)",
		border: "2px solid var(--kiv-color-primary, #6366f1)",
	},
	link: {
		background: "transparent",
		color: "var(--kiv-color-primary, #6366f1)",
		border: "2px solid transparent",
		textDecoration: "underline",
	},
};

/** Button size styles. */
export interface ButtonSizeStyle {
	padding: string;
	fontSize: string;
}
export const BUTTON_SIZE: Record<string, ButtonSizeStyle> = {
	xs: { padding: "4px 10px", fontSize: "11px" },
	sm: { padding: "6px 14px", fontSize: "13px" },
	md: { padding: "9px 20px", fontSize: "14px" },
	lg: { padding: "11px 26px", fontSize: "16px" },
	xl: { padding: "14px 32px", fontSize: "18px" },
};
