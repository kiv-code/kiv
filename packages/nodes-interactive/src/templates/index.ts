export type { KivNode } from "@kiv/engine";

export {
	agendaScheduleTemplate,
	ctaBannerTemplate,
	faqTemplate,
	featureGridTemplate,
	footerTemplate,
	heroTemplate,
	pricingTemplate,
	teamGridTemplate,
	testimonialTemplate,
} from "./content-templates";

export interface ContentTemplate {
	id: string;
	label: string;
	description: string;
	category: "hero" | "section" | "grid" | "list" | "page-block";
	icon: string;
	create: () => import("@kiv/engine").KivNode;
}

import {
	agendaScheduleTemplate,
	ctaBannerTemplate,
	faqTemplate,
	featureGridTemplate,
	footerTemplate,
	heroTemplate,
	pricingTemplate,
	teamGridTemplate,
	testimonialTemplate,
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
		id: "testimonials",
		label: "Testimonials",
		description: "3-column grid of user quotes with attribution.",
		category: "grid",
		icon: "message-circle",
		create: testimonialTemplate,
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
