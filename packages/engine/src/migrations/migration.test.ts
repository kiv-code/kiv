import { describe, expect, it } from "vitest";
import type { KivDocument } from "../types";
import {
	CURRENT_SCHEMA_VERSION,
	type Migration,
	migrateDocument,
	migrations,
} from "./migration";

const baseDoc: KivDocument = {
	schemaVersion: CURRENT_SCHEMA_VERSION,
	root: { id: "root", type: "page", props: {} },
	i18n: { default: "en", supported: ["en"] },
};

describe("CURRENT_SCHEMA_VERSION", () => {
	it("is 3", () => {
		expect(CURRENT_SCHEMA_VERSION).toBe(3);
	});
});

describe("migrations registry", () => {
	it("covers every step up to the current version", () => {
		for (let v = 1; v < CURRENT_SCHEMA_VERSION; v++) {
			expect(migrations.find((m) => m.from === v)).toBeDefined();
		}
	});
});

describe("migrateDocument", () => {
	it("returns the same document when already at current version", () => {
		const result = migrateDocument(baseDoc);
		expect(result).toBe(baseDoc);
	});

	it("does not mutate the input document", () => {
		const frozen = Object.freeze({ ...baseDoc });
		expect(() => migrateDocument(frozen as KivDocument)).not.toThrow();
	});

	it("throws when document is newer than engine", () => {
		const futureDoc = { ...baseDoc, schemaVersion: 99 };
		expect(() => migrateDocument(futureDoc)).toThrow(/newer than engine/);
	});

	it("throws when a migration step is missing", () => {
		// A doc at v0 with no 0→1 migration in the registry.
		const oldDoc = { ...baseDoc, schemaVersion: 0 };
		expect(() => migrateDocument(oldDoc)).toThrow(/no migration found/);
	});
});

describe("v1 → v2: spacing shorthands fold into the per-side box", () => {
	function v1(props: Record<string, unknown>): KivDocument {
		return {
			schemaVersion: 1,
			root: { id: "root", type: "section", props },
			i18n: { default: "en", supported: ["en"] },
		};
	}

	it("maps paddingY/paddingX onto the matching sides", () => {
		const out = migrateDocument(v1({ paddingY: "xl", paddingX: "md" }));
		expect(out.root.props.padding).toEqual({
			top: "xl",
			right: "md",
			bottom: "xl",
			left: "md",
		});
	});

	it("drops the legacy props", () => {
		const out = migrateDocument(v1({ paddingY: "lg", paddingX: "sm" }));
		expect(out.root.props).not.toHaveProperty("paddingY");
		expect(out.root.props).not.toHaveProperty("paddingX");
		expect(out.root.props).not.toHaveProperty("paddingBox");
	});

	it("keeps tokens instead of converting to pixels, so each node keeps its own scale", () => {
		const out = migrateDocument(v1({ paddingY: "lg" }));
		expect((out.root.props.padding as Record<string, string>).top).toBe("lg");
	});

	it("treats `none` as unset rather than a literal zero", () => {
		const out = migrateDocument(v1({ paddingY: "none", paddingX: "md" }));
		expect(out.root.props.padding).toEqual({
			top: "",
			right: "md",
			bottom: "",
			left: "md",
		});
	});

	it("lets an existing per-side value win over the shorthand", () => {
		const out = migrateDocument(
			v1({
				paddingY: "lg",
				paddingBox: { top: "3rem", right: "", bottom: "", left: "" },
			}),
		);
		expect(out.root.props.padding).toEqual({
			top: "3rem",
			right: "",
			bottom: "lg",
			left: "",
		});
	});

	it("folds margins the same way", () => {
		const out = migrateDocument(v1({ marginY: "sm", marginX: "lg" }));
		expect(out.root.props.margin).toEqual({
			top: "sm",
			right: "lg",
			bottom: "sm",
			left: "lg",
		});
	});

	it("migrates nested nodes, not just the root", () => {
		const doc: KivDocument = {
			schemaVersion: 1,
			root: {
				id: "root",
				type: "page",
				props: {},
				slots: {
					default: [{ id: "a", type: "section", props: { paddingY: "xl" } }],
				},
			},
			i18n: { default: "en", supported: ["en"] },
		};
		const child = migrateDocument(doc).root.slots?.default?.[0];
		expect(child?.props.padding).toEqual({
			top: "xl",
			right: "",
			bottom: "xl",
			left: "",
		});
	});

	it("leaves nodes without spacing props untouched", () => {
		const out = migrateDocument(v1({ background: "#fff" }));
		expect(out.root.props).toEqual({ background: "#fff" });
	});
});

describe("Migration pipeline logic (isolated)", () => {
	// Test the step-walking logic without touching CURRENT_SCHEMA_VERSION.
	// We build a minimal inline runner that mirrors migrateDocument.
	function runMigrations(
		doc: KivDocument,
		steps: Migration[],
		target: number,
	): KivDocument {
		if (doc.schemaVersion === target) return doc;
		if (doc.schemaVersion > target) throw new Error("newer than engine");
		let current = { ...doc };
		for (let v = current.schemaVersion; v < target; v++) {
			const step = steps.find((m) => m.from === v);
			if (!step) throw new Error(`no migration found for ${v}`);
			current = { ...step.migrate(current), schemaVersion: step.to };
		}
		return current;
	}

	it("applies a single migration step", () => {
		const steps: Migration[] = [
			{ from: 1, to: 2, migrate: (doc) => ({ ...doc, schemaVersion: 2 }) },
		];
		const doc = { ...baseDoc, schemaVersion: 1 };
		const result = runMigrations(doc, steps, 2);
		expect(result.schemaVersion).toBe(2);
	});

	it("applies chained migrations in order", () => {
		const order: number[] = [];
		const steps: Migration[] = [
			{
				from: 1,
				to: 2,
				migrate: (doc) => {
					order.push(1);
					return { ...doc, schemaVersion: 2 };
				},
			},
			{
				from: 2,
				to: 3,
				migrate: (doc) => {
					order.push(2);
					return { ...doc, schemaVersion: 3 };
				},
			},
		];
		const doc = { ...baseDoc, schemaVersion: 1 };
		const result = runMigrations(doc, steps, 3);
		expect(result.schemaVersion).toBe(3);
		expect(order).toEqual([1, 2]);
	});

	it("throws when a gap exists in the chain", () => {
		// Steps jump from 1→2 but skip 2→3.
		const steps: Migration[] = [
			{ from: 1, to: 2, migrate: (doc) => ({ ...doc, schemaVersion: 2 }) },
		];
		const doc = { ...baseDoc, schemaVersion: 1 };
		expect(() => runMigrations(doc, steps, 3)).toThrow(/no migration found/);
	});
});

describe("v1 → v2: action fields fold into linkType + href", () => {
	function v1(props: Record<string, unknown>): KivDocument {
		return {
			schemaVersion: 1,
			root: { id: "root", type: "button", props },
			i18n: { default: "en", supported: ["en"] },
		};
	}

	it("reads target=_blank as an external link", () => {
		const out = migrateDocument(
			v1({ href: "https://x.com", target: "_blank" }),
		);
		expect(out.root.props.linkType).toBe("external");
		expect(out.root.props).not.toHaveProperty("target");
	});

	it("keeps an explicit linkType over the inferred one", () => {
		const out = migrateDocument(
			v1({ href: "/about", linkType: "internal", target: "_self" }),
		);
		expect(out.root.props.linkType).toBe("internal");
	});

	it("infers anchor from a hash href", () => {
		const out = migrateDocument(v1({ href: "#faq", target: "_self" }));
		expect(out.root.props.linkType).toBe("anchor");
		expect(out.root.props.href).toBe("#faq");
	});

	it('treats the old "#" placeholder as no link at all', () => {
		const out = migrateDocument(v1({ href: "#", target: "_self" }));
		expect(out.root.props.linkType).toBe("none");
		expect(out.root.props).not.toHaveProperty("href");
	});

	it("folds modal's parallel naming into the shared pair", () => {
		const out = migrateDocument(
			v1({
				clickAction: "external",
				actionHref: "https://x.com",
				actionTarget: "_blank",
			}),
		);
		expect(out.root.props.linkType).toBe("external");
		expect(out.root.props.href).toBe("https://x.com");
		expect(out.root.props).not.toHaveProperty("clickAction");
		expect(out.root.props).not.toHaveProperty("actionHref");
		expect(out.root.props).not.toHaveProperty("actionTarget");
	});

	it("leaves nodes with no action fields untouched", () => {
		const out = migrateDocument(v1({ label: "Hi" }));
		expect(out.root.props).toEqual({ label: "Hi" });
	});
});

describe("v1 → v2: spacer height becomes a real length", () => {
	function spacer(height: unknown): KivDocument {
		return {
			schemaVersion: 1,
			root: { id: "root", type: "spacer", props: { height } },
			i18n: { default: "en", supported: ["en"] },
		};
	}

	it("rewrites a scale token to the pixels it already rendered as", () => {
		expect(migrateDocument(spacer("lg")).root.props.height).toBe("32px");
	});

	it("leaves a value that is already a length alone", () => {
		expect(migrateDocument(spacer("48px")).root.props.height).toBe("48px");
	});

	it("only touches spacer nodes", () => {
		const doc: KivDocument = {
			schemaVersion: 1,
			root: { id: "root", type: "embed", props: { height: "lg" } },
			i18n: { default: "en", supported: ["en"] },
		};
		expect(migrateDocument(doc).root.props.height).toBe("lg");
	});
});

describe("v2 → v3: hand-rolled typography folds into typographyFields()", () => {
	function docOf(type: string, props: Record<string, unknown>): KivDocument {
		return {
			schemaVersion: 2,
			root: { id: "root", type, props },
			i18n: { default: "en", supported: ["en"] },
		};
	}

	describe("link", () => {
		it("renames textColor to color and fontWeight to weight", () => {
			const out = migrateDocument(
				docOf("link", { textColor: "#ff0000", fontWeight: "600" }),
			);
			expect(out.root.props.color).toBe("#ff0000");
			expect(out.root.props.weight).toBe("600");
			expect(out.root.props).not.toHaveProperty("textColor");
			expect(out.root.props).not.toHaveProperty("fontWeight");
		});

		it('converts the "inherit" font size sentinel to the numeric default', () => {
			const out = migrateDocument(docOf("link", { fontSize: "inherit" }));
			expect(out.root.props.fontSize).toBe(16);
		});

		it("parses a stored px font size into a number", () => {
			const out = migrateDocument(docOf("link", { fontSize: "18px" }));
			expect(out.root.props.fontSize).toBe(18);
		});

		it("leaves a link with none of the legacy fields untouched", () => {
			const out = migrateDocument(docOf("link", { text: "Hi" }));
			expect(out.root.props).toEqual({ text: "Hi" });
		});
	});

	describe("countdown", () => {
		it("renames accentColor to color", () => {
			const out = migrateDocument(
				docOf("countdown", { accentColor: "#123456" }),
			);
			expect(out.root.props.color).toBe("#123456");
			expect(out.root.props).not.toHaveProperty("accentColor");
		});

		it("converts the sm/md/lg size scale to pixels", () => {
			expect(
				migrateDocument(docOf("countdown", { size: "sm" })).root.props.size,
			).toBe(18);
			expect(
				migrateDocument(docOf("countdown", { size: "lg" })).root.props.size,
			).toBe(40);
		});
	});

	describe("stat", () => {
		it("converts the md/lg/xl/2xl size scale to pixels", () => {
			expect(
				migrateDocument(docOf("stat", { size: "2xl" })).root.props.size,
			).toBe(72);
		});

		it("leaves an already-numeric size untouched", () => {
			const out = migrateDocument(docOf("stat", { size: 40 }));
			expect(out.root.props.size).toBe(40);
		});
	});

	describe("agenda-item", () => {
		it("converts rem font sizes across all seven text roles to pixels", () => {
			const out = migrateDocument(
				docOf("agenda-item", {
					stripeFontSize: "0.85rem",
					titleFontSize: "0.95rem",
					descriptionFontSize: "0.82rem",
					speakerLabelFontSize: "0.68rem",
					speakerNameFontSize: "0.88rem",
					speakerTitleFontSize: "0.76rem",
					speakerCompanyFontSize: "0.76rem",
				}),
			);
			expect(out.root.props.stripeFontSize).toBe(14);
			expect(out.root.props.titleFontSize).toBe(15);
			expect(out.root.props.descriptionFontSize).toBe(13);
			expect(out.root.props.speakerLabelFontSize).toBe(11);
			expect(out.root.props.speakerNameFontSize).toBe(14);
			expect(out.root.props.speakerTitleFontSize).toBe(12);
			expect(out.root.props.speakerCompanyFontSize).toBe(12);
		});

		it("only touches agenda-item nodes", () => {
			const out = migrateDocument(
				docOf("agenda", { stripeFontSize: "0.85rem" }),
			);
			expect(out.root.props.stripeFontSize).toBe("0.85rem");
		});
	});

	it("bumps schemaVersion to 3 even with no legacy typography fields present", () => {
		const out = migrateDocument(docOf("text", { content: "Hi" }));
		expect(out.schemaVersion).toBe(3);
	});
});
