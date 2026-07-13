import type { MediaProvider } from "@kivcode/engine";
import type { InjectionKey } from "vue";

/**
 * Provided by KivRenderer when the consumer passes a `media` prop (typically
 * `engine.media`). ImageNode injects it to resolve responsive URLs/srcset.
 * When absent, ImageNode falls back to rendering the raw `src` unchanged.
 */
export const KIV_MEDIA_KEY: InjectionKey<MediaProvider | null> =
	Symbol("kiv-media");
