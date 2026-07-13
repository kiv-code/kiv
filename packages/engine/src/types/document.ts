import type { KivNode } from "./node";
import type { Locale } from "./values";

export interface I18nConfig {
	default: Locale;
	supported: Locale[];
	fallback?: Locale;
}

/**
 * Page-level SEO metadata. Lives on the document (not a node's props) because
 * it describes the PAGE as a whole — one title/description/canonical URL per
 * document, independent of which nodes it contains. Consumed by @kivcode/plugin-seo.
 */
export interface SeoMeta {
	title?: string;
	description?: string;
	/** URL path this document is served at, e.g. "/pricing". No domain. */
	slug?: string;
	/** Absolute URL. Overrides the default (origin + slug) when crawlers should prefer a different canonical location. */
	canonicalUrl?: string;
	ogTitle?: string;
	ogDescription?: string;
	ogImage?: string;
	twitterCard?: "summary" | "summary_large_image";
	/** Excludes the page from search indexes when true. */
	noindex?: boolean;
	/** Tells crawlers not to follow links on this page when true. */
	nofollow?: boolean;
	/** Sitemap <priority>, 0–1. */
	sitemapPriority?: number;
}

export interface KivDocument {
	/** Schema version. Enables migrations. NEVER remove it. */
	schemaVersion: number;
	/** Root node of the tree (normally a 'page'). */
	root: KivNode;
	/** Document's language configuration. */
	i18n: I18nConfig;
	/** Document-level theme overrides (optional). */
	theme?: Record<string, unknown>;
	/** Page-level SEO metadata (optional). See @kivcode/plugin-seo. */
	seo?: SeoMeta;
}
