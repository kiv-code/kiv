import type { I18nConfig, KivDocument } from "../types";
import type { PageTemplate } from "./types";

const I18N: I18nConfig = { default: "en", supported: ["en"] };

const blankDocument: KivDocument = {
	schemaVersion: 3,
	i18n: I18N,
	root: {
		id: "root",
		type: "page",
		props: { lang: "en" },
		slots: { default: [] },
	},
};

const landingDocument: KivDocument = {
	schemaVersion: 3,
	i18n: I18N,
	root: {
		id: "root",
		type: "page",
		props: { lang: "en" },
		slots: {
			default: [
				{
					id: "hero",
					type: "section",
					props: {
						background: "#0f172a",
						padding: { top: "xl", right: "md", bottom: "xl", left: "md" },
						fullWidth: true,
					},
					slots: {
						default: [
							{
								id: "hero-container",
								type: "container",
								props: { maxWidth: "lg", centered: true },
								slots: {
									default: [
										{
											id: "hero-stack",
											type: "stack",
											props: {
												direction: "column",
												gap: "lg",
												align: "center",
											},
											slots: {
												default: [
													{
														id: "hero-heading",
														type: "heading",
														props: {
															text: "Launch faster.",
															level: "1",
															color: "#f8fafc",
															align: "center",
														},
													},
													{
														id: "hero-text",
														type: "text",
														props: {
															content:
																"A landing page starter — hero, features, and a call to action.",
															color: "#94a3b8",
															size: 18,
															align: "center",
														},
													},
													{
														id: "hero-cta",
														type: "button",
														props: {
															label: "Get started",
															href: "#features",
															linkType: "anchor",
															variant: "primary",
														},
													},
												],
											},
										},
									],
								},
							},
						],
					},
				},
				{
					id: "features",
					type: "section",
					props: {
						background: "#ffffff",
						padding: { top: "xl", right: "md", bottom: "xl", left: "md" },
						fullWidth: true,
					},
					slots: {
						default: [
							{
								id: "features-container",
								type: "container",
								props: { maxWidth: "lg", centered: true },
								slots: {
									default: [
										{
											id: "features-grid",
											type: "grid",
											props: { columns: { base: "1", lg: "3" }, gap: "lg" },
											slots: {
												default: [
													{
														id: "feature-1",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "feature-1-heading",
																	type: "heading",
																	props: { text: "Fast", level: "3" },
																},
																{
																	id: "feature-1-text",
																	type: "text",
																	props: {
																		content: "Ship in minutes, not weeks.",
																	},
																},
															],
														},
													},
													{
														id: "feature-2",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "feature-2-heading",
																	type: "heading",
																	props: { text: "Flexible", level: "3" },
																},
																{
																	id: "feature-2-text",
																	type: "text",
																	props: {
																		content:
																			"Every block is a JSON node you can theme.",
																	},
																},
															],
														},
													},
													{
														id: "feature-3",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "feature-3-heading",
																	type: "heading",
																	props: { text: "Extensible", level: "3" },
																},
																{
																	id: "feature-3-text",
																	type: "text",
																	props: {
																		content:
																			"Add plugins without touching the core.",
																	},
																},
															],
														},
													},
												],
											},
										},
									],
								},
							},
						],
					},
				},
				{
					id: "cta",
					type: "section",
					props: {
						background: "#4338ca",
						padding: { top: "xl", right: "md", bottom: "xl", left: "md" },
						fullWidth: true,
					},
					slots: {
						default: [
							{
								id: "cta-container",
								type: "container",
								props: { maxWidth: "md", centered: true },
								slots: {
									default: [
										{
											id: "cta-stack",
											type: "stack",
											props: {
												direction: "column",
												gap: "md",
												align: "center",
											},
											slots: {
												default: [
													{
														id: "cta-heading",
														type: "heading",
														props: {
															text: "Ready to start?",
															level: "2",
															color: "#ffffff",
															align: "center",
														},
													},
													{
														id: "cta-button",
														type: "button",
														props: {
															label: "Sign up free",
															href: "#",
															variant: "secondary",
														},
													},
												],
											},
										},
									],
								},
							},
						],
					},
				},
			],
		},
	},
};

const aboutDocument: KivDocument = {
	schemaVersion: 3,
	i18n: I18N,
	root: {
		id: "root",
		type: "page",
		props: { lang: "en" },
		slots: {
			default: [
				{
					id: "about-hero",
					type: "section",
					props: {
						background: "#f8fafc",
						padding: { top: "xl", right: "md", bottom: "xl", left: "md" },
						fullWidth: true,
					},
					slots: {
						default: [
							{
								id: "about-hero-container",
								type: "container",
								props: { maxWidth: "md", centered: true },
								slots: {
									default: [
										{
											id: "about-hero-stack",
											type: "stack",
											props: {
												direction: "column",
												gap: "md",
												align: "center",
											},
											slots: {
												default: [
													{
														id: "about-heading",
														type: "heading",
														props: {
															text: "About us",
															level: "1",
															align: "center",
														},
													},
													{
														id: "about-text",
														type: "text",
														props: {
															content:
																"We're a small team building tools we'd want to use ourselves.",
															align: "center",
															size: 18,
															color: "#475569",
														},
													},
												],
											},
										},
									],
								},
							},
						],
					},
				},
				{
					id: "team",
					type: "section",
					props: {
						background: "#ffffff",
						padding: { top: "xl", right: "md", bottom: "xl", left: "md" },
						fullWidth: true,
					},
					slots: {
						default: [
							{
								id: "team-container",
								type: "container",
								props: { maxWidth: "lg", centered: true },
								slots: {
									default: [
										{
											id: "team-heading",
											type: "heading",
											props: { text: "Our team", level: "2", align: "center" },
										},
										{
											id: "team-grid",
											type: "grid",
											props: { columns: { base: "1", lg: "3" }, gap: "lg" },
											slots: {
												default: [
													{
														id: "team-1",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "team-1-image",
																	type: "image",
																	props: {
																		src: "",
																		alt: "Team member portrait",
																		aspectRatio: "1/1",
																		borderRadius: "full",
																	},
																},
																{
																	id: "team-1-heading",
																	type: "heading",
																	props: {
																		text: "Jane Doe",
																		level: "4",
																		align: "center",
																	},
																},
																{
																	id: "team-1-text",
																	type: "text",
																	props: {
																		content: "Co-founder",
																		align: "center",
																	},
																},
															],
														},
													},
													{
														id: "team-2",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "team-2-image",
																	type: "image",
																	props: {
																		src: "",
																		alt: "Team member portrait",
																		aspectRatio: "1/1",
																		borderRadius: "full",
																	},
																},
																{
																	id: "team-2-heading",
																	type: "heading",
																	props: {
																		text: "John Smith",
																		level: "4",
																		align: "center",
																	},
																},
																{
																	id: "team-2-text",
																	type: "text",
																	props: {
																		content: "Co-founder",
																		align: "center",
																	},
																},
															],
														},
													},
													{
														id: "team-3",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "team-3-image",
																	type: "image",
																	props: {
																		src: "",
																		alt: "Team member portrait",
																		aspectRatio: "1/1",
																		borderRadius: "full",
																	},
																},
																{
																	id: "team-3-heading",
																	type: "heading",
																	props: {
																		text: "Alex Lee",
																		level: "4",
																		align: "center",
																	},
																},
																{
																	id: "team-3-text",
																	type: "text",
																	props: {
																		content: "Engineering",
																		align: "center",
																	},
																},
															],
														},
													},
												],
											},
										},
									],
								},
							},
						],
					},
				},
			],
		},
	},
};

const contactDocument: KivDocument = {
	schemaVersion: 3,
	i18n: I18N,
	root: {
		id: "root",
		type: "page",
		props: { lang: "en" },
		slots: {
			default: [
				{
					id: "contact",
					type: "section",
					props: {
						background: "#ffffff",
						padding: { top: "xl", right: "md", bottom: "xl", left: "md" },
						fullWidth: true,
					},
					slots: {
						default: [
							{
								id: "contact-container",
								type: "container",
								props: { maxWidth: "sm", centered: true },
								slots: {
									default: [
										{
											id: "contact-stack",
											type: "stack",
											props: { direction: "column", gap: "md" },
											slots: {
												default: [
													{
														id: "contact-heading",
														type: "heading",
														props: { text: "Get in touch", level: "1" },
													},
													{
														id: "contact-text",
														type: "text",
														props: {
															content:
																"Add your form fields here once a form node type is available — for now, here's how to reach us directly.",
															color: "#475569",
														},
													},
													{
														id: "contact-details",
														type: "stack",
														props: { direction: "column", gap: "xs" },
														slots: {
															default: [
																{
																	id: "contact-email",
																	type: "text",
																	props: { content: "hello@example.com" },
																},
																{
																	id: "contact-phone",
																	type: "text",
																	props: { content: "+1 (555) 010-0000" },
																},
															],
														},
													},
													{
														id: "contact-button",
														type: "button",
														props: {
															label: "Email us",
															href: "mailto:hello@example.com",
															linkType: "external",
															variant: "primary",
														},
													},
												],
											},
										},
									],
								},
							},
						],
					},
				},
			],
		},
	},
};

const blogPostDocument: KivDocument = {
	schemaVersion: 3,
	i18n: I18N,
	root: {
		id: "root",
		type: "page",
		props: { lang: "en" },
		slots: {
			default: [
				{
					id: "post-header",
					type: "section",
					props: {
						background: "#ffffff",
						padding: { top: "lg", right: "md", bottom: "lg", left: "md" },
						fullWidth: true,
					},
					slots: {
						default: [
							{
								id: "post-header-container",
								type: "container",
								props: { maxWidth: "md", centered: true },
								slots: {
									default: [
										{
											id: "post-title",
											type: "heading",
											props: { text: "Blog post title", level: "1" },
										},
										{
											id: "post-meta",
											type: "text",
											props: {
												content: "By Jane Doe · January 1, 2026",
												color: "#64748b",
												size: 14,
											},
										},
										{
											id: "post-cover",
											type: "image",
											props: {
												src: "",
												alt: "Cover image",
												aspectRatio: "16/9",
												borderRadius: "md",
											},
										},
									],
								},
							},
						],
					},
				},
				{
					id: "post-body",
					type: "section",
					props: {
						background: "#ffffff",
						padding: { top: "lg", right: "md", bottom: "lg", left: "md" },
						fullWidth: true,
					},
					slots: {
						default: [
							{
								id: "post-body-container",
								type: "container",
								props: { maxWidth: "lg", centered: true },
								slots: {
									default: [
										{
											id: "post-grid",
											type: "grid",
											props: { columns: { base: "1", lg: "3" }, gap: "lg" },
											slots: {
												default: [
													{
														id: "post-content-col",
														type: "column",
														props: { span: { base: "1", lg: "2" } },
														slots: {
															default: [
																{
																	id: "post-paragraph-1",
																	type: "text",
																	props: {
																		content:
																			"Start writing your post here. This column holds the main content.",
																		size: 16,
																	},
																},
																{
																	id: "post-paragraph-2",
																	type: "text",
																	props: {
																		content:
																			"Add as many paragraphs, headings, and images as you need.",
																		size: 16,
																	},
																},
															],
														},
													},
													{
														id: "post-sidebar-col",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "sidebar-heading",
																	type: "heading",
																	props: { text: "Related", level: "4" },
																},
																{
																	id: "sidebar-text",
																	type: "text",
																	props: {
																		content: "Link to related posts here.",
																		size: 14,
																		color: "#64748b",
																	},
																},
															],
														},
													},
												],
											},
										},
									],
								},
							},
						],
					},
				},
			],
		},
	},
};

export const BUILT_IN_TEMPLATES: PageTemplate[] = [
	{
		id: "blank",
		name: "Blank page",
		description: "An empty page — start from scratch.",
		category: "General",
		document: blankDocument,
	},
	{
		id: "landing",
		name: "Landing page",
		description: "Hero, features grid, and a call to action.",
		category: "Marketing",
		document: landingDocument,
	},
	{
		id: "about",
		name: "About page",
		description: "Hero intro and a team grid.",
		category: "Marketing",
		document: aboutDocument,
	},
	{
		id: "contact",
		name: "Contact page",
		description: "Intro text and contact details.",
		category: "Marketing",
		document: contactDocument,
	},
	{
		id: "blog-post",
		name: "Blog post",
		description: "Header with cover image, content column, and a sidebar.",
		category: "Content",
		document: blogPostDocument,
	},
];
