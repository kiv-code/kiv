/** Converts a camelCase inline-style object into a `key: value;` CSS string, skipping empty values. */
export function styleToString(
	style: Record<string, string | number | undefined>,
): string {
	const declarations = Object.entries(style)
		.filter(
			([, value]) =>
				value !== undefined &&
				value !== null &&
				value !== "" &&
				// A non-primitive would stringify to "[object Object]" and emit
				// invalid CSS. Dropping the declaration degrades to the inherited
				// value instead of visibly corrupting the render.
				typeof value !== "object",
		)
		.map(([key, value]) => `${kebabCase(key)}: ${value}`);
	return declarations.length ? `${declarations.join("; ")};` : "";
}

const VENDOR_PREFIXES = /^(webkit|moz|ms|o)-/;

function kebabCase(key: string): string {
	const hyphenated = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
	// Vendor-prefixed CSS properties need a LEADING dash (`-webkit-...`), which
	// the regex above can't produce since there's no preceding char to match
	// against at the start of the string — add it explicitly or the property
	// is invalid CSS and gets silently dropped by the browser.
	return VENDOR_PREFIXES.test(hyphenated) ? `-${hyphenated}` : hyphenated;
}

/**
 * Forces a pasted SVG icon to a consistent size (1em, scaled by font-size),
 * mirroring the `.kiv-btn-icon :deep(svg)` rule the Vue renderer applies via
 * scoped CSS. The static HTML export has no such stylesheet, so without this
 * the icon's own `width`/`height` attributes win outright — two buttons with
 * identical `size` props can render visibly different if their pasted icons
 * came from different sources (e.g. 16x16 vs 24x24).
 */
export function normalizeSvgIconSize(svg: string): string {
	if (!svg.trim().startsWith("<svg")) return svg;
	const sizeStyle = "width:1em;height:1em;display:block";
	return svg.replace(/<svg([^>]*)>/, (_match, attrs: string) => {
		if (/\sstyle\s*=/.test(attrs)) {
			return `<svg${attrs.replace(
				/\sstyle\s*=\s*(["'])(.*?)\1/,
				(_m, q: string, existing: string) =>
					` style=${q}${existing};${sizeStyle}${q}`,
			)}>`;
		}
		return `<svg${attrs} style="${sizeStyle}">`;
	});
}

/**
 * Narrows a full `resolveTypographyStyle()` result down to size/weight/color,
 * dropping family/align/line-height/letter-spacing/transform/style/margin.
 * Used by nodes that only exposed size+weight+color per text role before
 * migrating onto the shared typography resolver, so consolidating onto it
 * doesn't newly apply properties the node never rendered.
 */
export function pickTypographyCss(
	resolved: Record<string, string | undefined>,
): Record<string, string | undefined> {
	const {
		fontFamily: _fontFamily,
		textAlign: _textAlign,
		lineHeight: _lineHeight,
		letterSpacing: _letterSpacing,
		textTransform: _textTransform,
		fontStyle: _fontStyle,
		margin: _margin,
		...rest
	} = resolved;
	return rest;
}

/** Escapes a value for safe use as HTML text content or a quoted attribute value. */
export function escapeHtml(value: unknown): string {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}
