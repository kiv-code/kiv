import type { FontProvider } from "@kivcode/engine";
import type { InjectionKey } from "vue";

/**
 * Provided by KivRenderer when the consumer passes a `fonts` prop (typically
 * `engine.fonts`). Text nodes inject it to turn a stored font id into the real
 * CSS stack. When absent, a font id falls through unresolved and the text
 * inherits the page font — never a typeface the project doesn't load.
 */
export const KIV_FONTS_KEY: InjectionKey<FontProvider | null> =
	Symbol("kiv-fonts");
