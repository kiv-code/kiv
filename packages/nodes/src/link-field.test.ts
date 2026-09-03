import { describe, expect, it } from "vitest";
import { linkAttrs, linkFields, resolveLink } from "./link-field";

const esc = (v: unknown) => String(v ?? "");

describe("resolveLink", () => {
	it("opens external links in a new tab with a safe rel", () => {
		const l = resolveLink({ linkType: "external", href: "https://x.com" });
		expect(l).toMatchObject({
			type: "external",
			target: "_blank",
			rel: "noopener noreferrer",
		});
	});

	it("keeps internal links in the same tab", () => {
		const l = resolveLink({ linkType: "internal", href: "/about" });
		expect(l).toMatchObject({ type: "internal", target: "_self" });
		expect(l.rel).toBeUndefined();
	});

	it("normalizes an anchor to a single leading hash", () => {
		expect(resolveLink({ linkType: "anchor", href: "faq" })).toMatchObject({
			href: "#faq",
			anchorId: "faq",
		});
		expect(resolveLink({ linkType: "anchor", href: "#faq" })).toMatchObject({
			href: "#faq",
			anchorId: "faq",
		});
	});

	it("treats a link type with no destination as inert", () => {
		// Rendering href="#" here would jump to the top of the page on click,
		// which reads as a broken link rather than an unset one.
		expect(resolveLink({ linkType: "external", href: "" }).type).toBe("none");
	});

	describe("documents written before linkType existed", () => {
		it("reads target=_blank as external", () => {
			expect(
				resolveLink({ href: "https://x.com", target: "_blank" }),
			).toMatchObject({ type: "external", target: "_blank" });
		});

		it("reads a hash href as an anchor", () => {
			expect(resolveLink({ href: "#hero" }).type).toBe("anchor");
		});

		it("reads any other href as internal", () => {
			expect(resolveLink({ href: "/pricing" }).type).toBe("internal");
		});

		it("reads a missing href as no link", () => {
			expect(resolveLink({}).type).toBe("none");
		});
	});
});

describe("linkAttrs", () => {
	it("emits nothing for an inert link, so no anchor tag is produced", () => {
		expect(linkAttrs(resolveLink({}), esc)).toBe("");
	});

	it("emits rel only for external links", () => {
		expect(
			linkAttrs(
				resolveLink({ linkType: "external", href: "https://x.com" }),
				esc,
			),
		).toContain('rel="noopener noreferrer"');
		expect(
			linkAttrs(resolveLink({ linkType: "internal", href: "/a" }), esc),
		).not.toContain("rel=");
	});
});

describe("linkFields", () => {
	it("hides the destination until a link type is chosen", () => {
		expect(linkFields().href.showIf).toEqual({
			field: "linkType",
			equals: ["internal", "external", "anchor"],
		});
	});

	it("can drop `none` for nodes that are always clickable", () => {
		const values = linkFields({ includeNone: false }).linkType.options?.map(
			(o) => o.value,
		);
		expect(values).not.toContain("none");
	});

	it("does not expose a target field — it is derived from the link type", () => {
		expect(Object.keys(linkFields())).toEqual(["linkType", "href"]);
	});
});
