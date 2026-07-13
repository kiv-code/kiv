import type { KivPlugin, PluginContext } from "@kivcode/engine";
import { applyMetaTagsToHead, generateMetaTags } from "./meta";
import SeoInspectorTab from "./SeoInspectorTab.vue";

export interface SeoPluginOptions {
	/** Site origin used to resolve a canonical URL from `seo.slug` when `seo.canonicalUrl` is unset. */
	origin?: string;
}

/**
 * @kivcode/plugin-seo
 *
 * Registers an "SEO" inspector tab for editing page title/description/OG/robots
 * fields (stored on `document.seo`, see @kivcode/engine's `SeoMeta`), and keeps the
 * live `<head>` in sync whenever the document is saved (⌘S in the editor).
 */
export function seoPlugin(options: SeoPluginOptions = {}): KivPlugin {
	return {
		name: "seo",
		install(ctx: PluginContext): void {
			ctx.bus.on("document.save", (payload) => {
				const tags = generateMetaTags(payload.document.seo, {
					origin: options.origin,
				});
				applyMetaTagsToHead(tags);
			});
		},
		onEditorReady(ctx: PluginContext): void {
			ctx.editor?.addInspectorTab("seo", SeoInspectorTab);
		},
	};
}

export {
	applyMetaTagsToHead,
	buildSitemapEntry,
	generateMetaTags,
	generateStructuredData,
	type MetaTag,
	metaTagsToHtml,
	resolveCanonicalUrl,
	type SeoContext,
	type SitemapEntry,
} from "./meta";
export { SeoInspectorTab };
