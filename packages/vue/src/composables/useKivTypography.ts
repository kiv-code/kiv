import type { KivFont } from "@kivcode/engine";
import type { TypographyStyleInput } from "@kivcode/nodes";
import { resolveTypographyStyle } from "@kivcode/nodes";
import { computed, inject, type Ref } from "vue";
import { KIV_FONTS_KEY } from "../fonts";

/**
 * The one place text styling is computed for every node that renders text.
 * Injects the host's registered fonts so a stored font id becomes the real CSS
 * stack, then delegates to the same resolver `toHtml` uses — which is what
 * keeps the canvas, the Vue render and the static export in agreement.
 */
export function useKivTypography(
	props: Ref<TypographyStyleInput>,
	defaults: Omit<Parameters<typeof resolveTypographyStyle>[1], "fonts"> = {},
) {
	const provider = inject(KIV_FONTS_KEY, null);
	const fonts = computed<KivFont[]>(() => provider?.list() ?? []);
	return computed(() =>
		resolveTypographyStyle(props.value, { ...defaults, fonts: fonts.value }),
	);
}
