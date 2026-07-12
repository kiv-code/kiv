import { createRegistry } from "@kiv/engine";
import { describe, expect, it } from "vitest";
import {
	ALL_NODES,
	agendaItemNode,
	agendaNode,
	buttonNode,
	cardNode,
	columnNode,
	computeCountdownParts,
	containerNode,
	countdownNode,
	DEFAULT_COLOR_OR_GRADIENT,
	embedNode,
	formatStatValue,
	formFieldNode,
	formNode,
	gridNode,
	headingNode,
	imageNode,
	pageNode,
	parsePricingData,
	parseSelectOptions,
	parseSocialLinks,
	parseTableData,
	pricingNode,
	renderStars,
	sectionNode,
	socialIconsNode,
	spacerNode,
	stackNode,
	statNode,
	tableNode,
	testimonialNode,
	textNode,
} from "./index";

const ctx = { locale: "en", breakpoint: "base" as const };

describe("ALL_NODES", () => {
	it("contains 28 nodes", () => {
		expect(ALL_NODES).toHaveLength(28);
	});

	it("all nodes have unique types", () => {
		const types = ALL_NODES.map((n) => n.type);
		expect(new Set(types).size).toBe(28);
	});

	it("registers without errors into a Registry", () => {
		const registry = createRegistry();
		expect(() => registry.registerMany([...ALL_NODES])).not.toThrow();
	});

	it("all nodes have a category", () => {
		for (const node of ALL_NODES) {
			expect(node.category).toBeDefined();
		}
	});

	it("every node's defaults satisfy its own compiled schema", () => {
		for (const node of ALL_NODES) {
			const result = node.schema.safeParse(node.defaults);
			expect(
				result.success,
				`${node.type}: ${JSON.stringify(result.error?.issues)}`,
			).toBe(true);
		}
	});
});

describe("layout nodes", () => {
	it("page: type and default lang", () => {
		expect(pageNode.type).toBe("page");
		expect(pageNode.defaults.lang).toBe("en");
	});

	it("section: type and key defaults", () => {
		expect(sectionNode.type).toBe("section");
		expect(sectionNode.defaults.fullWidth).toBe(true);
		expect(sectionNode.defaults.overlay).toBe(false);
		expect(sectionNode.defaults.opacity).toBe(1);
	});

	it("container: type and default maxWidth", () => {
		expect(containerNode.type).toBe("container");
		expect(containerNode.defaults.maxWidth).toBe("lg");
		expect(containerNode.defaults.centered).toBe(true);
	});

	it("stack: type and default direction", () => {
		expect(stackNode.type).toBe("stack");
		expect(stackNode.defaults.direction).toBe("column");
		expect(stackNode.defaults.wrap).toBe(false);
	});

	it("grid: type and default columns", () => {
		expect(gridNode.type).toBe("grid");
		expect(gridNode.defaults.columns).toBe("12");
	});

	it("column: type and default span", () => {
		expect(columnNode.type).toBe("column");
		expect(columnNode.defaults.span).toBe("auto");
		expect(columnNode.defaults.offset).toBe("0");
	});
});

describe("content nodes", () => {
	it("heading: type and default level", () => {
		expect(headingNode.type).toBe("heading");
		expect(headingNode.defaults.level).toBe("2");
		expect(headingNode.defaults.align).toBe("left");
	});

	it("text: type and default size", () => {
		expect(textNode.type).toBe("text");
		expect(textNode.defaults.size).toBe(16);
	});

	it("button: type and navigation defaults", () => {
		expect(buttonNode.type).toBe("button");
		expect(buttonNode.defaults.href).toBe("#");
		expect(buttonNode.defaults.target).toBe("_self");
		expect(buttonNode.defaults.linkType).toBe("internal");
		expect(buttonNode.defaults.variant).toBe("primary");
	});
});

describe("media nodes", () => {
	it("image: type and default fit", () => {
		expect(imageNode.type).toBe("image");
		expect(imageNode.defaults.fit).toBe("cover");
		expect(imageNode.defaults.aspectRatio).toBe("auto");
	});
});

describe("node schemas", () => {
	it("section schema accepts valid props", () => {
		const result = sectionNode.schema.safeParse({
			background: { ...DEFAULT_COLOR_OR_GRADIENT, solid: "#fff" },
			paddingY: "lg",
			overlay: true,
			overlayColor: { ...DEFAULT_COLOR_OR_GRADIENT, solid: "#000", alpha: 0.5 },
		});
		expect(result.success).toBe(true);
	});

	it("button schema accepts valid props", () => {
		const result = buttonNode.schema.safeParse({
			label: "Get started",
			href: "/pricing",
			linkType: "internal",
			variant: "primary",
		});
		expect(result.success).toBe(true);
	});

	it("heading schema accepts a plain string for text", () => {
		const result = headingNode.schema.safeParse({
			text: "Hello world",
			level: "1",
		});
		expect(result.success).toBe(true);
	});
});

describe("toHtml", () => {
	it("every node renders non-empty HTML from its own defaults", () => {
		for (const node of ALL_NODES) {
			const html = node.toHtml?.(node.defaults, {}, ctx);
			expect(html, `${node.type} has no toHtml`).toBeDefined();
			expect(html?.trim().length ?? 0, node.type).toBeGreaterThan(0);
			expect(html, node.type).toContain(`data-kiv-type="${node.type}"`);
		}
	});

	it("heading renders the requested tag and escapes text", () => {
		const html = headingNode.toHtml?.(
			{ text: "<script>alert(1)</script>", level: "3" },
			{},
			ctx,
		);
		expect(html).toContain("<h3");
		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
	});

	it("container centers by default and stops centering when centered is false", () => {
		const centered = containerNode.toHtml?.({}, {}, ctx);
		expect(centered).toContain("margin-left: auto");

		const uncentered = containerNode.toHtml?.({ centered: false }, {}, ctx);
		expect(uncentered).not.toContain("margin-left");
	});

	it("section renders the overlay div only when enabled", () => {
		const withOverlay = sectionNode.toHtml?.(
			{ overlay: true, overlayColor: "rgba(1,2,3,0.5)" },
			{},
			ctx,
		);
		expect(withOverlay).toContain("kiv-section__overlay");

		const withoutOverlay = sectionNode.toHtml?.({}, {}, ctx);
		expect(withoutOverlay).not.toContain("kiv-section__overlay");
	});

	it("button renders an anchor with the variant background", () => {
		const html = buttonNode.toHtml?.(
			{ label: "Go", href: "/pricing", variant: "secondary" },
			{},
			ctx,
		);
		expect(html).toContain('<a href="/pricing"');
		expect(html).toContain("Go");
		expect(html).toContain("--kiv-color-secondary");
	});

	it("container nests its children inside the wrapper div", () => {
		const html = containerNode.toHtml?.({}, { default: "<p>Hi</p>" }, ctx);
		expect(html).toContain("<p>Hi</p>");
	});

	it("button applies the hover effect class when set", () => {
		const html = buttonNode.toHtml?.(
			{ label: "Go", hoverEffect: "lift" },
			{},
			ctx,
		);
		expect(html).toContain('class="kiv-hover-lift"');
	});

	it("button omits the class attribute when hoverEffect is none", () => {
		const html = buttonNode.toHtml?.({ label: "Go" }, {}, ctx);
		expect(html).not.toContain("kiv-hover-");
	});

	it("button's glow color sets the --kiv-glow-rgb custom property", () => {
		const html = buttonNode.toHtml?.(
			{ label: "Go", hoverEffect: "glow", hoverGlowColor: "#ff0000" },
			{},
			ctx,
		);
		expect(html).toContain("--kiv-glow-rgb: 255, 0, 0");
	});

	it("button omits --kiv-glow-rgb when no glow color is set", () => {
		const html = buttonNode.toHtml?.(
			{ label: "Go", hoverEffect: "glow" },
			{},
			ctx,
		);
		expect(html).not.toContain("--kiv-glow-rgb");
	});

	it("image applies the hover effect class when set", () => {
		const html = imageNode.toHtml?.(
			{ src: "/a.png", hoverEffect: "grayscale" },
			{},
			ctx,
		);
		expect(html).toContain('class="kiv-hover-grayscale"');
	});
});

describe("form + form-field", () => {
	it("form renders an action/method and the submit label", () => {
		const html = formNode.toHtml?.(
			{ submitUrl: "/api/contact", method: "post", submitLabel: "Send" },
			{ default: '<div data-kiv-type="form-field"></div>' },
			ctx,
		);
		expect(html).toContain('action="/api/contact"');
		expect(html).toContain('method="post"');
		expect(html).toContain("Send");
		expect(html).toContain('data-kiv-type="form-field"');
	});

	it("form-field renders a labeled text input by default", () => {
		const html = formFieldNode.toHtml?.(
			{ fieldType: "text", name: "email", label: "Email", required: true },
			{},
			ctx,
		);
		expect(html).toContain('type="text"');
		expect(html).toContain('name="email"');
		expect(html).toContain("required");
		expect(html).toContain("Email");
	});

	it("form-field renders select options from the comma-separated field", () => {
		const html = formFieldNode.toHtml?.(
			{ fieldType: "select", name: "plan", options: "Basic, Pro, Enterprise" },
			{},
			ctx,
		);
		expect(html).toContain("<select");
		expect(html).toContain(">Basic<");
		expect(html).toContain(">Pro<");
		expect(html).toContain(">Enterprise<");
	});

	it("parseSelectOptions trims and drops empty entries", () => {
		expect(parseSelectOptions("a, , b ,")).toEqual(["a", "b"]);
		expect(parseSelectOptions(undefined)).toEqual([]);
	});
});

describe("testimonial", () => {
	it("renders quote, author, and rating stars", () => {
		const html = testimonialNode.toHtml?.(
			{
				quote: "Great product",
				authorName: "Jane Doe",
				authorRole: "CEO",
				rating: 4,
			},
			{},
			ctx,
		);
		expect(html).toContain("Great product");
		expect(html).toContain("Jane Doe");
		expect(html).toContain("CEO");
		expect(html).toContain('data-kiv-type="testimonial"');
	});

	it("omits the rating stars when rating is 0", () => {
		const html = testimonialNode.toHtml?.(
			{ quote: "Hi", rating: 0, quoteMarkStyle: "none" },
			{},
			ctx,
		);
		expect(html).not.toContain("<svg");
	});

	it("renderStars clamps to 0-5", () => {
		expect(renderStars(-1)).not.toContain("undefined");
		expect(renderStars(10)).toBeTruthy();
	});
});

describe("card", () => {
	it("wraps slot children in a styled container", () => {
		const html = cardNode.toHtml?.({}, { default: "<p>Body</p>" }, ctx);
		expect(html).toContain("<p>Body</p>");
		expect(html).toContain('data-kiv-type="card"');
	});

	it("adds an outline when highlighted", () => {
		const html = cardNode.toHtml?.({ highlighted: true }, {}, ctx);
		expect(html).toContain("outline");
	});
});

describe("countdown", () => {
	it("computeCountdownParts marks the past as expired", () => {
		const parts = computeCountdownParts("2000-01-01T00:00:00Z");
		expect(parts.expired).toBe(true);
	});

	it("computeCountdownParts computes remaining units for a future date", () => {
		const future = new Date(Date.now() + 90_000).toISOString();
		const parts = computeCountdownParts(future);
		expect(parts.expired).toBe(false);
		expect(parts.minutes).toBeGreaterThanOrEqual(1);
	});

	it("toHtml renders the expired message once the target has passed", () => {
		const html = countdownNode.toHtml?.(
			{ targetDate: "2000-01-01T00:00:00Z", expiredMessage: "Done!" },
			{},
			ctx,
		);
		expect(html).toContain("Done!");
	});

	it("toHtml renders a static day/hour/min/sec snapshot for a future date", () => {
		const future = new Date(Date.now() + 2 * 86400_000).toISOString();
		const html = countdownNode.toHtml?.({ targetDate: future }, {}, ctx);
		expect(html).toContain("<time");
		expect(html).toContain(future);
	});
});

describe("stat", () => {
	it("formatStatValue applies prefix/suffix/decimals", () => {
		expect(formatStatValue(99.5, 1, "$", "k")).toBe("$99.5k");
		expect(formatStatValue(100, 0, "", "%")).toBe("100%");
	});

	it("toHtml renders the final formatted value and label", () => {
		const html = statNode.toHtml?.(
			{ value: 250, suffix: "+", label: "Customers" },
			{},
			ctx,
		);
		expect(html).toContain("250+");
		expect(html).toContain("Customers");
	});
});

describe("social-icons", () => {
	it("parseSocialLinks returns [] for invalid JSON without throwing", () => {
		expect(() => parseSocialLinks("not json")).not.toThrow();
		expect(parseSocialLinks("not json")).toEqual([]);
		expect(parseSocialLinks("")).toEqual([]);
		expect(parseSocialLinks('{"not":"an array"}')).toEqual([]);
	});

	it("renders a link per known platform", () => {
		const html = socialIconsNode.toHtml?.(
			{
				links: JSON.stringify([
					{ platform: "twitter", url: "https://x.com/kiv" },
					{ platform: "github", url: "https://github.com/kiv" },
				]),
			},
			{},
			ctx,
		);
		expect(html).toContain("https://x.com/kiv");
		expect(html).toContain("https://github.com/kiv");
	});

	it("renders an empty container (never throws) for an empty links array", () => {
		const html = socialIconsNode.toHtml?.({ links: "[]" }, {}, ctx);
		expect(html).toContain('data-kiv-type="social-icons"');
	});
});

describe("spacer", () => {
	it("renders an empty height-only block from the scale", () => {
		const html = spacerNode.toHtml?.({ height: "lg" }, {}, ctx);
		expect(html).toContain("height: 32px");
		expect(html).toContain('data-kiv-type="spacer"');
	});
});

describe("embed", () => {
	it("html mode renders a sandboxed srcdoc iframe without allow-same-origin", () => {
		const html = embedNode.toHtml?.(
			{ embedType: "html", html: "<b>hi</b>", sandboxed: true },
			{},
			ctx,
		);
		expect(html).toContain("<iframe");
		expect(html).toContain("srcdoc=");
		expect(html).toContain('sandbox="allow-scripts"');
		expect(html).not.toContain("allow-same-origin");
	});

	it("iframe mode renders a sandboxed src iframe", () => {
		const html = embedNode.toHtml?.(
			{
				embedType: "iframe",
				iframeUrl: "https://example.com",
				sandboxed: true,
			},
			{},
			ctx,
		);
		expect(html).toContain('src="https://example.com"');
		expect(html).toContain("allow-same-origin");
	});

	it("omits the sandbox attribute entirely when sandboxed is false", () => {
		const html = embedNode.toHtml?.(
			{
				embedType: "iframe",
				iframeUrl: "https://example.com",
				sandboxed: false,
			},
			{},
			ctx,
		);
		expect(html).not.toContain("sandbox=");
	});

	it("never renders raw HTML outside an iframe", () => {
		const html = embedNode.toHtml?.(
			{ embedType: "html", html: "<script>alert(1)</script>" },
			{},
			ctx,
		);
		expect(html).not.toContain("<script>alert(1)</script>");
	});
});

describe("table", () => {
	it("parseTableData returns empty arrays for malformed JSON without throwing", () => {
		expect(() => parseTableData("{not valid")).not.toThrow();
		expect(parseTableData("{not valid")).toEqual({ headers: [], rows: [] });
	});

	it("renders a real semantic table with headers and rows", () => {
		const html = tableNode.toHtml?.(
			{
				data: JSON.stringify({
					headers: ["Name", "Role"],
					rows: [["Ada", "Engineer"]],
				}),
			},
			{},
			ctx,
		);
		expect(html).toContain("<table");
		expect(html).toContain("<thead>");
		expect(html).toContain("<tbody>");
		expect(html).toContain("Name");
		expect(html).toContain("Ada");
	});
});

describe("agenda", () => {
	it("agenda: type and slot constraint", () => {
		expect(agendaNode.type).toBe("agenda");
		expect(agendaNode.slotConstraints?.default).toEqual(["agenda-item"]);
	});

	it("passes stripe width and item radius down via CSS custom properties", () => {
		const html = agendaNode.toHtml?.(
			{ stripeWidth: "180px", itemRadius: "lg" },
			{ default: "" },
			ctx,
		);
		expect(html).toContain("--kiv-agenda-stripe-width: 180px");
		expect(html).toContain("--kiv-agenda-item-radius: 16px");
	});

	it("agenda-item renders time, title, and location", () => {
		const html = agendaItemNode.toHtml?.(
			{ time: "8h às 8h30", title: "Abertura", location: "Palco Principal" },
			{},
			ctx,
		);
		expect(html).toContain("8h às 8h30");
		expect(html).toContain("Abertura");
		expect(html).toContain("Palco Principal");
	});

	it("agenda-item only renders the speaker card when hasSpeaker is true", () => {
		const withoutSpeaker = agendaItemNode.toHtml?.(
			{ title: "Coffee" },
			{},
			ctx,
		);
		expect(withoutSpeaker).not.toContain("kiv-agenda-item__speaker");

		const withSpeaker = agendaItemNode.toHtml?.(
			{
				title: "Palestra",
				hasSpeaker: true,
				speakerName: "Alice Altissimo",
				speakerRole: "VP",
			},
			{},
			ctx,
		);
		expect(withSpeaker).toContain("Alice Altissimo");
		expect(withSpeaker).toContain("VP");
	});
});

describe("pricing", () => {
	it("parsePricingData returns empty arrays for malformed JSON without throwing", () => {
		expect(() => parsePricingData("{not valid")).not.toThrow();
		expect(parsePricingData("{not valid")).toEqual({ tiers: [], rows: [] });
	});

	const sampleData = JSON.stringify({
		tiers: [
			{ period: "Julio", tier: "Regular", highlighted: true },
			{ period: "Agosto", tier: "Late", highlighted: false },
		],
		rows: [{ label: "PMI Members", values: ["S/ 1,700", "S/ 2,100"] }],
	});

	it("renders the table variant with a highlighted tier column", () => {
		const html = pricingNode.toHtml?.(
			{ data: sampleData, variant: "table" },
			{},
			ctx,
		);
		expect(html).toContain("<table");
		expect(html).toContain("PMI Members");
		expect(html).toContain("S/ 1,700");
		expect(html).toContain("Regular");
	});

	it("renders the cards variant as a grid, not a table", () => {
		const html = pricingNode.toHtml?.(
			{ data: sampleData, variant: "cards" },
			{},
			ctx,
		);
		expect(html).not.toContain("<table");
		expect(html).toContain("S/ 2,100");
	});

	it("renders a Featured badge only for the highlighted tier in cards-featured", () => {
		const html = pricingNode.toHtml?.(
			{ data: sampleData, variant: "cards-featured" },
			{},
			ctx,
		);
		expect(html).toContain("Featured");
	});
});
