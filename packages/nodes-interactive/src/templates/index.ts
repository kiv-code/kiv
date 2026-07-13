export type { KivNode } from "@kivcode/engine";

export {
	agendaScheduleTemplate,
	bannerTemplate,
	calloutTemplate,
	cardsTemplate,
	comparisonTemplate,
	contactTemplate,
	ctaBannerTemplate,
	faqTemplate,
	featureGridTemplate,
	footerTemplate,
	galleryTemplate,
	headerTemplate,
	heroTemplate,
	logoCloudTemplate,
	newsletterTemplate,
	pricingTemplate,
	statsTemplate,
	teamGridTemplate,
	testimonialTemplate,
	timelineTemplate,
} from "./content-templates";

export interface ContentTemplate {
	id: string;
	label: string;
	description: string;
	category:
		| "hero"
		| "section"
		| "grid"
		| "list"
		| "page-block"
		| "form"
		| "comparison";
	icon: string;
	create: () => import("@kivcode/engine").KivNode;
}

import {
	agendaScheduleTemplate,
	bannerTemplate,
	calloutTemplate,
	cardsTemplate,
	comparisonTemplate,
	contactTemplate,
	ctaBannerTemplate,
	faqTemplate,
	featureGridTemplate,
	footerTemplate,
	galleryTemplate,
	headerTemplate,
	heroTemplate,
	logoCloudTemplate,
	newsletterTemplate,
	pricingTemplate,
	statsTemplate,
	teamGridTemplate,
	testimonialTemplate,
	timelineTemplate,
} from "./content-templates";

export const CONTENT_TEMPLATES: ContentTemplate[] = [
	{
		id: "hero",
		label: "Hero Section",
		description: "Full-width heading, subheading, and CTA button.",
		category: "hero",
		icon: "layout",
		create: heroTemplate,
	},
	{
		id: "header",
		label: "Header",
		description: "Logo, nav links, and a CTA button in one row.",
		category: "page-block",
		icon: "layout",
		create: headerTemplate,
	},
	{
		id: "feature-grid",
		label: "Feature Grid",
		description: "3-column grid with icon cards for features.",
		category: "grid",
		icon: "grid",
		create: featureGridTemplate,
	},
	{
		id: "cta-banner",
		label: "CTA Banner",
		description: "Colored banner with heading and action button.",
		category: "section",
		icon: "megaphone",
		create: ctaBannerTemplate,
	},
	{
		id: "banner",
		label: "Banner",
		description: "Slim announcement strip with icon, text, and a link.",
		category: "section",
		icon: "megaphone",
		create: bannerTemplate,
	},
	{
		id: "testimonials",
		label: "Testimonials",
		description: "3-column grid of user quotes with attribution.",
		category: "grid",
		icon: "message-circle",
		create: testimonialTemplate,
	},
	{
		id: "logo-cloud",
		label: "Logo Cloud",
		description: "Row of customer/partner logos.",
		category: "grid",
		icon: "grid",
		create: logoCloudTemplate,
	},
	{
		id: "faq",
		label: "FAQ Accordion",
		description: "Expandable Q&A list with accordion.",
		category: "list",
		icon: "help-circle",
		create: faqTemplate,
	},
	{
		id: "pricing",
		label: "Pricing Table",
		description: "3-column pricing cards with features.",
		category: "grid",
		icon: "credit-card",
		create: pricingTemplate,
	},
	{
		id: "comparison",
		label: "Comparison Table",
		description: "Feature-by-feature plan comparison table.",
		category: "comparison",
		icon: "table",
		create: comparisonTemplate,
	},
	{
		id: "stats",
		label: "Stats",
		description: "Row of animated counters — users, uptime, and more.",
		category: "grid",
		icon: "grid",
		create: statsTemplate,
	},
	{
		id: "cards",
		label: "Cards",
		description: "3-column grid of titled content cards.",
		category: "grid",
		icon: "card",
		create: cardsTemplate,
	},
	{
		id: "callout",
		label: "Callout",
		description: "Highlighted note or tip with an icon.",
		category: "section",
		icon: "info",
		create: calloutTemplate,
	},
	{
		id: "gallery",
		label: "Gallery",
		description: "Responsive grid of images.",
		category: "grid",
		icon: "grid",
		create: galleryTemplate,
	},
	{
		id: "timeline",
		label: "Timeline",
		description: "Chronological milestones — reuses the Agenda layout.",
		category: "list",
		icon: "calendar",
		create: timelineTemplate,
	},
	{
		id: "contact",
		label: "Contact",
		description: "Name, email, and message form.",
		category: "form",
		icon: "clipboard-list",
		create: contactTemplate,
	},
	{
		id: "newsletter",
		label: "Newsletter",
		description: "Single-field email signup form.",
		category: "form",
		icon: "clipboard-list",
		create: newsletterTemplate,
	},
	{
		id: "footer",
		label: "Footer",
		description: "Multi-column footer with navigation links.",
		category: "page-block",
		icon: "layout",
		create: footerTemplate,
	},
	{
		id: "agenda-schedule",
		label: "Agenda / Schedule",
		description: "Time-blocked event schedule with stripe layout.",
		category: "list",
		icon: "calendar",
		create: agendaScheduleTemplate,
	},
	{
		id: "team-grid",
		label: "Team Grid",
		description: "4-column grid of team member cards.",
		category: "grid",
		icon: "users",
		create: teamGridTemplate,
	},
];
