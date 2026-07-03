import type { KivDocument } from "@kiv/engine";

export const demoDocument: KivDocument = {
	schemaVersion: 1,
	i18n: { default: "en", supported: ["en", "es"] },
	root: {
		id: "root",
		type: "page",
		props: { lang: "en" },
		slots: {
			default: [
				// Hero section
				{
					id: "hero",
					type: "section",
					props: {
						background: "#0f172a",
						paddingY: "xl",
						paddingX: "md",
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
												direction: "vertical",
												gap: "lg",
												align: "center",
											},
											slots: {
												default: [
													{
														id: "hero-heading",
														type: "heading",
														props: {
															text: "Build visual experiences — fast.",
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
																"Kiv is a headless, JSON-driven, plugin-based visual engine for Vue, React and beyond.",
															color: "#94a3b8",
															size: "lg",
															align: "center",
														},
													},
													{
														id: "hero-buttons",
														type: "stack",
														props: {
															direction: "horizontal",
															gap: "md",
															align: "center",
														},
														slots: {
															default: [
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
																{
																	id: "hero-docs",
																	type: "button",
																	props: {
																		label: "View on GitHub",
																		href: "https://github.com",
																		linkType: "external",
																		target: "_blank",
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

				// Features section — grid collapses to 1 col on mobile
				{
					id: "features",
					type: "section",
					props: {
						background: "#ffffff",
						paddingY: "xl",
						paddingX: "md",
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
											id: "features-stack",
											type: "stack",
											props: { direction: "vertical", gap: "xl" },
											slots: {
												default: [
													{
														id: "features-heading",
														type: "heading",
														props: {
															text: "Everything you need.",
															level: "2",
															color: "#0f172a",
															align: "center",
														},
													},
													{
														id: "features-grid",
														type: "grid",
														// 1 col mobile → 3 col desktop
														props: {
															columns: "1",
															lgColumns: "3",
															gap: "lg",
														},
														slots: {
															default: [
																{
																	id: "col-1",
																	type: "column",
																	props: { span: "1" },
																	slots: {
																		default: [
																			{
																				id: "f1-stack",
																				type: "stack",
																				props: {
																					direction: "vertical",
																					gap: "sm",
																				},
																				slots: {
																					default: [
																						{
																							id: "feature-1-heading",
																							type: "heading",
																							props: {
																								text: "Headless",
																								level: "3",
																								color: "#1d4ed8",
																							},
																						},
																						{
																							id: "feature-1-text",
																							type: "text",
																							props: {
																								content:
																									"Framework-agnostic core. Use Vue, React, or any renderer.",
																								size: "base",
																								color: "#475569",
																							},
																						},
																					],
																				},
																			},
																		],
																	},
																},
																{
																	id: "col-2",
																	type: "column",
																	props: { span: "1" },
																	slots: {
																		default: [
																			{
																				id: "f2-stack",
																				type: "stack",
																				props: {
																					direction: "vertical",
																					gap: "sm",
																				},
																				slots: {
																					default: [
																						{
																							id: "feature-2-heading",
																							type: "heading",
																							props: {
																								text: "JSON-Driven",
																								level: "3",
																								color: "#1d4ed8",
																							},
																						},
																						{
																							id: "feature-2-text",
																							type: "text",
																							props: {
																								content:
																									"Your document is pure JSON. Store it anywhere, version it, migrate it.",
																								size: "base",
																								color: "#475569",
																							},
																						},
																					],
																				},
																			},
																		],
																	},
																},
																{
																	id: "col-3",
																	type: "column",
																	props: { span: "1" },
																	slots: {
																		default: [
																			{
																				id: "f3-stack",
																				type: "stack",
																				props: {
																					direction: "vertical",
																					gap: "sm",
																				},
																				slots: {
																					default: [
																						{
																							id: "feature-3-heading",
																							type: "heading",
																							props: {
																								text: "Plugin-Based",
																								level: "3",
																								color: "#1d4ed8",
																							},
																						},
																						{
																							id: "feature-3-text",
																							type: "text",
																							props: {
																								content:
																									"Extend the engine with plugins. Analytics, forms, modals — never touch the core.",
																								size: "base",
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
												],
											},
										},
									],
								},
							},
						],
					},
				},

				// Image section
				{
					id: "visual-section",
					type: "section",
					props: {
						background: "#f1f5f9",
						paddingY: "xl",
						paddingX: "md",
						fullWidth: true,
					},
					slots: {
						default: [
							{
								id: "visual-container",
								type: "container",
								props: { maxWidth: "md", centered: true },
								slots: {
									default: [
										{
											id: "visual-stack",
											type: "stack",
											props: {
												direction: "vertical",
												gap: "lg",
												align: "center",
											},
											slots: {
												default: [
													{
														id: "visual-heading",
														type: "heading",
														props: {
															text: "See it in action.",
															level: "2",
															color: "#0f172a",
															align: "center",
														},
													},
													{
														id: "demo-image",
														type: "image",
														props: {
															src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
															alt: "Kiv visual engine demo",
															fit: "cover",
															aspectRatio: "16/9",
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
