import type { KivDocument, KivNode } from "@kivcode/engine";
import { describe, expect, it } from "vitest";
import { checkDocument } from "./rules";

function node(
	id: string,
	type: string,
	props: Record<string, unknown> = {},
	slots?: Record<string, KivNode[]>,
): KivNode {
	return { id, type, props, slots };
}

function doc(root: KivNode): KivDocument {
	return { schemaVersion: 1, i18n: { default: "en", supported: ["en"] }, root };
}

function ruleIds(issues: ReturnType<typeof checkDocument>): string[] {
	return issues.map((i) => i.ruleId);
}

describe("image-alt", () => {
	it("flags an image with no alt text", () => {
		const d = doc(
			node(
				"root",
				"page",
				{},
				{ default: [node("img1", "image", { src: "/a.png" })] },
			),
		);
		expect(ruleIds(checkDocument(d))).toContain("image-alt");
	});

	it("flags an image whose alt is blank in one locale", () => {
		const d = doc(
			node(
				"root",
				"page",
				{},
				{
					default: [
						node("img1", "image", { alt: { $t: { en: "A cat", es: "" } } }),
					],
				},
			),
		);
		expect(ruleIds(checkDocument(d))).toContain("image-alt");
	});

	it("does not flag an image with alt text in every locale", () => {
		const d = doc(
			node(
				"root",
				"page",
				{},
				{
					default: [
						node("img1", "image", {
							alt: { $t: { en: "A cat", es: "Un gato" } },
						}),
					],
				},
			),
		);
		expect(ruleIds(checkDocument(d))).not.toContain("image-alt");
	});
});

describe("heading-skip", () => {
	it("flags h1 followed directly by h3", () => {
		const d = doc(
			node(
				"root",
				"page",
				{},
				{
					default: [
						node("h1", "heading", { level: "1" }),
						node("h3", "heading", { level: "3" }),
					],
				},
			),
		);
		expect(ruleIds(checkDocument(d))).toContain("heading-skip");
	});

	it("does not flag h1 -> h2 -> h3", () => {
		const d = doc(
			node(
				"root",
				"page",
				{},
				{
					default: [
						node("h1", "heading", { level: "1" }),
						node("h2", "heading", { level: "2" }),
						node("h3", "heading", { level: "3" }),
					],
				},
			),
		);
		expect(ruleIds(checkDocument(d))).not.toContain("heading-skip");
	});
});

describe("link-text", () => {
	it("flags a link with no text and no slot content", () => {
		const d = doc(
			node(
				"root",
				"page",
				{},
				{ default: [node("l1", "link", { href: "/x" })] },
			),
		);
		expect(ruleIds(checkDocument(d))).toContain("link-text");
	});

	it("does not flag a link with text", () => {
		const d = doc(
			node(
				"root",
				"page",
				{},
				{ default: [node("l1", "link", { href: "/x", text: "Click here" })] },
			),
		);
		expect(ruleIds(checkDocument(d))).not.toContain("link-text");
	});

	it("does not flag a link with slot content", () => {
		const d = doc(
			node(
				"root",
				"page",
				{},
				{
					default: [
						node(
							"l1",
							"link",
							{ href: "/x" },
							{ default: [node("i1", "icon", { icon: "star" })] },
						),
					],
				},
			),
		);
		expect(ruleIds(checkDocument(d))).not.toContain("link-text");
	});
});

describe("button-label", () => {
	it("flags a button with no label", () => {
		const d = doc(
			node("root", "page", {}, { default: [node("b1", "button", {})] }),
		);
		expect(ruleIds(checkDocument(d))).toContain("button-label");
	});

	it("does not flag a button with a label", () => {
		const d = doc(
			node(
				"root",
				"page",
				{},
				{ default: [node("b1", "button", { label: "Submit" })] },
			),
		);
		expect(ruleIds(checkDocument(d))).not.toContain("button-label");
	});
});

describe("video-captions", () => {
	it("flags a video with no captions", () => {
		const d = doc(
			node(
				"root",
				"page",
				{},
				{
					default: [node("v1", "video", { provider: "youtube", videoId: "x" })],
				},
			),
		);
		expect(ruleIds(checkDocument(d))).toContain("video-captions");
	});

	it("does not flag a video with captions", () => {
		const d = doc(
			node(
				"root",
				"page",
				{},
				{
					default: [
						node("v1", "video", {
							provider: "youtube",
							videoId: "x",
							caption: "A transcript",
						}),
					],
				},
			),
		);
		expect(ruleIds(checkDocument(d))).not.toContain("video-captions");
	});
});

describe("color-contrast", () => {
	it("flags light gray text on a white background", () => {
		const d = doc(
			node(
				"root",
				"page",
				{},
				{ default: [node("h1", "heading", { level: "1", color: "#eeeeee" })] },
			),
		);
		expect(ruleIds(checkDocument(d))).toContain("color-contrast");
	});

	it("does not flag black text on a white background", () => {
		const d = doc(
			node(
				"root",
				"page",
				{},
				{ default: [node("h1", "heading", { level: "1", color: "#000000" })] },
			),
		);
		expect(ruleIds(checkDocument(d))).not.toContain("color-contrast");
	});

	it("checks against the nearest ancestor section's background, not always white", () => {
		const d = doc(
			node(
				"root",
				"page",
				{},
				{
					default: [
						node(
							"sec1",
							"section",
							{ background: "#000000" },
							{
								default: [
									node("h1", "heading", { level: "1", color: "#111111" }),
								],
							},
						),
					],
				},
			),
		);
		expect(ruleIds(checkDocument(d))).toContain("color-contrast");
	});

	it("skips nodes with no resolvable solid color (gradient/empty)", () => {
		const d = doc(
			node(
				"root",
				"page",
				{},
				{ default: [node("h1", "heading", { level: "1" })] },
			),
		);
		expect(ruleIds(checkDocument(d))).not.toContain("color-contrast");
	});
});

describe("checkDocument", () => {
	it("returns no issues for a clean document", () => {
		const d = doc(
			node(
				"root",
				"page",
				{},
				{
					default: [
						node("h1", "heading", { level: "1", color: "#000000" }),
						node("img1", "image", { alt: "A cat" }),
						node("b1", "button", { label: "Go" }),
					],
				},
			),
		);
		expect(checkDocument(d)).toEqual([]);
	});
});
