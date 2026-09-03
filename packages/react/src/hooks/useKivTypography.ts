import type { KivFont } from "@kivcode/engine";
import type { TypographyStyleInput } from "@kivcode/nodes";
import { resolveTypographyStyle } from "@kivcode/nodes";
import { useContext, useMemo } from "react";
import { KivFontsContext } from "../fonts";

/**
 * The one place text styling is computed for every node that renders text.
 * Reads the host's registered fonts so a stored font id becomes the real CSS
 * stack, then delegates to the same resolver `toHtml` uses — which is what
 * keeps the canvas, the React render and the static export in agreement.
 * Mirrors the Vue composable of the same name.
 */
export function useKivTypography(
	props: TypographyStyleInput,
	defaults: Omit<Parameters<typeof resolveTypographyStyle>[1], "fonts"> = {},
) {
	const provider = useContext(KivFontsContext);
	const fonts = useMemo<KivFont[]>(() => provider?.list() ?? [], [provider]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: `props` is a fresh object literal on every render at every call site, so listing it would defeat the memo; its fields are spread into the dep list by the caller instead
	return useMemo(
		() => resolveTypographyStyle(props, { ...defaults, fonts }),
		[fonts, ...Object.values(props), ...Object.values(defaults)],
	);
}
