import type { KivDocument } from "@kivcode/engine";

// Demo document with localized content (en / es / fr) using the `$t` shape.
// Any prop can be either a plain value OR { $t: { <locale>: value } }.
// The renderer resolves the active locale with a fallback chain.
export const demoDocument: KivDocument = {
	schemaVersion: 1,
	i18n: { default: "en", supported: ["en", "es", "fr"], fallback: "en" },
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
															text: {
																$t: {
																	en: "Build visual experiences — fast.",
																	es: "Crea experiencias visuales — rápido.",
																	fr: "Créez des expériences visuelles — vite.",
																},
															},
															level: "1",
															color: "#f8fafc",
															align: "center",
														},
													},
													{
														id: "hero-text",
														type: "text",
														props: {
															content: {
																$t: {
																	en: "Kiv is a headless, JSON-driven, plugin-based visual engine for Vue, React and beyond.",
																	es: "Kiv es un motor visual headless, basado en JSON y plugins, para Vue, React y más.",
																	fr: "Kiv est un moteur visuel headless, piloté par JSON et extensible, pour Vue, React et plus.",
																},
															},
															color: "#94a3b8",
															size: 18,
															align: "center",
														},
													},
													{
														id: "hero-buttons",
														type: "stack",
														props: {
															direction: "row",
															gap: "md",
															align: "center",
														},
														slots: {
															default: [
																{
																	id: "hero-cta",
																	type: "button",
																	props: {
																		label: {
																			$t: {
																				en: "Get started",
																				es: "Empezar",
																				fr: "Commencer",
																			},
																		},
																		href: "#features",
																		linkType: "anchor",
																		variant: "primary",
																	},
																},
																{
																	id: "hero-docs",
																	type: "button",
																	props: {
																		label: {
																			$t: {
																				en: "View on GitHub",
																				es: "Ver en GitHub",
																				fr: "Voir sur GitHub",
																			},
																		},
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
											props: { direction: "column", gap: "xl" },
											slots: {
												default: [
													{
														id: "features-heading",
														type: "heading",
														props: {
															text: {
																$t: {
																	en: "Everything you need.",
																	es: "Todo lo que necesitas.",
																	fr: "Tout ce qu'il vous faut.",
																},
															},
															level: "2",
															color: "#0f172a",
															align: "center",
														},
													},
													{
														id: "features-grid",
														type: "grid",
														props: {
															columns: { base: "1", lg: "3" },
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
																					direction: "column",
																					gap: "sm",
																				},
																				slots: {
																					default: [
																						{
																							id: "feature-1-heading",
																							type: "heading",
																							props: {
																								text: {
																									$t: {
																										en: "Headless",
																										es: "Headless",
																										fr: "Headless",
																									},
																								},
																								level: "3",
																								color: "#1d4ed8",
																							},
																						},
																						{
																							id: "feature-1-text",
																							type: "text",
																							props: {
																								content: {
																									$t: {
																										en: "Framework-agnostic core. Use Vue, React, or any renderer.",
																										es: "Núcleo agnóstico de framework. Usa Vue, React o cualquier renderer.",
																										fr: "Cœur indépendant du framework. Vue, React ou tout autre renderer.",
																									},
																								},
																								size: 16,
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
																					direction: "column",
																					gap: "sm",
																				},
																				slots: {
																					default: [
																						{
																							id: "feature-2-heading",
																							type: "heading",
																							props: {
																								text: {
																									$t: {
																										en: "JSON-Driven",
																										es: "Basado en JSON",
																										fr: "Piloté par JSON",
																									},
																								},
																								level: "3",
																								color: "#1d4ed8",
																							},
																						},
																						{
																							id: "feature-2-text",
																							type: "text",
																							props: {
																								content: {
																									$t: {
																										en: "Your document is pure JSON. Store it anywhere, version it, migrate it.",
																										es: "Tu documento es JSON puro. Guárdalo donde sea, versiónalo, migra.",
																										fr: "Votre document est du JSON pur. Stockez-le, versionnez-le, migrez-le.",
																									},
																								},
																								size: 16,
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
																					direction: "column",
																					gap: "sm",
																				},
																				slots: {
																					default: [
																						{
																							id: "feature-3-heading",
																							type: "heading",
																							props: {
																								text: {
																									$t: {
																										en: "Plugin-Based",
																										es: "Basado en plugins",
																										fr: "Basé sur des plugins",
																									},
																								},
																								level: "3",
																								color: "#1d4ed8",
																							},
																						},
																						{
																							id: "feature-3-text",
																							type: "text",
																							props: {
																								content: {
																									$t: {
																										en: "Extend the engine with plugins. Analytics, forms, modals — never touch the core.",
																										es: "Extiende el motor con plugins. Analytics, formularios, modales — sin tocar el núcleo.",
																										fr: "Étendez le moteur avec des plugins. Analytics, formulaires, modales — sans toucher au cœur.",
																									},
																								},
																								size: 16,
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
												direction: "column",
												gap: "lg",
												align: "center",
											},
											slots: {
												default: [
													{
														id: "visual-heading",
														type: "heading",
														props: {
															text: {
																$t: {
																	en: "See it in action.",
																	es: "Míralo en acción.",
																	fr: "Voyez-le en action.",
																},
															},
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
															alt: {
																$t: {
																	en: "Kiv visual engine demo",
																	es: "Demo del motor visual Kiv",
																	fr: "Démo du moteur visuel Kiv",
																},
															},
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
