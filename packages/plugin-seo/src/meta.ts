import type { SeoMeta } from "@kivcode/engine";

export interface MetaTag {
	tag: "title" | "meta" | "link";
	attrs: Record<string, string>;
	content?: string;
}

export interface SeoContext {
	/** Site origin, e.g. "https://example.com". Combined with `slug` when `canonicalUrl` is unset. */
	origin?: string;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/** Resolves the canonical URL: an explicit override wins, otherwise origin + slug. */
export function resolveCanonicalUrl(
	seo: SeoMeta = {},
	ctx: SeoContext = {},
): string | undefined {
	if (seo.canonicalUrl) return seo.canonicalUrl;
	if (ctx.origin && seo.slug) {
		const base = ctx.origin.replace(/\/$/, "");
		const path = seo.slug.startsWith("/") ? seo.slug : `/${seo.slug}`;
		return `${base}${path}`;
	}
	return undefined;
}

/** Builds the list of <title>/<meta>/<link> tags this page should render — title/description, robots, canonical, Open Graph, Twitter card. */
export function generateMetaTags(
	seo: SeoMeta = {},
	ctx: SeoContext = {},
): MetaTag[] {
	const tags: MetaTag[] = [];

	if (seo.title) tags.push({ tag: "title", attrs: {}, content: seo.title });
	if (seo.description) {
		tags.push({
			tag: "meta",
			attrs: { name: "description", content: seo.description },
		});
	}

	const robots = [
		seo.noindex ? "noindex" : "index",
		seo.nofollow ? "nofollow" : "follow",
	];
	tags.push({
		tag: "meta",
		attrs: { name: "robots", content: robots.join(", ") },
	});

	const canonical = resolveCanonicalUrl(seo, ctx);
	if (canonical) {
		tags.push({ tag: "link", attrs: { rel: "canonical", href: canonical } });
		tags.push({
			tag: "meta",
			attrs: { property: "og:url", content: canonical },
		});
	}

	const ogTitle = seo.ogTitle || seo.title;
	if (ogTitle)
		tags.push({
			tag: "meta",
			attrs: { property: "og:title", content: ogTitle },
		});

	const ogDescription = seo.ogDescription || seo.description;
	if (ogDescription) {
		tags.push({
			tag: "meta",
			attrs: { property: "og:description", content: ogDescription },
		});
	}

	if (seo.ogImage) {
		tags.push({
			tag: "meta",
			attrs: { property: "og:image", content: seo.ogImage },
		});
		tags.push({
			tag: "meta",
			attrs: {
				name: "twitter:card",
				content: seo.twitterCard ?? "summary_large_image",
			},
		});
	} else {
		tags.push({
			tag: "meta",
			attrs: { name: "twitter:card", content: seo.twitterCard ?? "summary" },
		});
	}

	return tags;
}

/** Renders the tags from {@link generateMetaTags} as an HTML string, for a static export's <head>. */
export function metaTagsToHtml(tags: MetaTag[]): string {
	return tags
		.map((t) => {
			if (t.tag === "title")
				return `<title>${escapeHtml(t.content ?? "")}</title>`;
			const attrs = Object.entries(t.attrs)
				.map(([k, v]) => `${k}="${escapeHtml(v)}"`)
				.join(" ");
			return `<${t.tag} ${attrs} />`;
		})
		.join("\n");
}

/** Minimal schema.org WebPage JSON-LD, for the inspector's structured-data preview. */
export function generateStructuredData(
	seo: SeoMeta = {},
	ctx: SeoContext = {},
): Record<string, unknown> {
	const canonical = resolveCanonicalUrl(seo, ctx);
	const data: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "WebPage",
	};
	if (seo.title) data.name = seo.title;
	if (seo.description) data.description = seo.description;
	if (canonical) data.url = canonical;
	if (seo.ogImage) data.image = seo.ogImage;
	return data;
}

export interface SitemapEntry {
	url: string;
	priority?: number;
}

/** A sitemap.xml <url> entry for this page, or null when there's no resolvable URL. */
export function buildSitemapEntry(
	seo: SeoMeta = {},
	ctx: SeoContext = {},
): SitemapEntry | null {
	const url = resolveCanonicalUrl(seo, ctx);
	if (!url) return null;
	return { url, priority: seo.sitemapPriority };
}

/** Applies the resolved tags to the real document <head> — title + upserted <meta>/<link> elements. Client-only; no-ops outside a DOM. */
export function applyMetaTagsToHead(tags: MetaTag[]): void {
	if (typeof document === "undefined") return;
	for (const tag of tags) {
		if (tag.tag === "title") {
			document.title = tag.content ?? "";
			continue;
		}
		const selectorAttr = tag.attrs.name
			? "name"
			: "property" in tag.attrs
				? "property"
				: "rel";
		const selectorValue = tag.attrs[selectorAttr];
		if (!selectorValue) continue;
		const selector = `${tag.tag}[${selectorAttr}="${selectorValue}"]`;
		let el = document.head.querySelector<HTMLElement>(selector);
		if (!el) {
			el = document.createElement(tag.tag);
			document.head.appendChild(el);
		}
		for (const [k, v] of Object.entries(tag.attrs)) el.setAttribute(k, v);
	}
}
