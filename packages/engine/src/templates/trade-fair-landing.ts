import type { I18nConfig, KivDocument } from "../types";

/**
 * A full trade-fair / event landing page — modeled after a real client
 * delivery (USAPEEC's "Feria de Pollo Americano") so users start from an
 * advanced, real-world composition instead of a blank canvas. Uses:
 * - `image.src` as a `Responsive<string>` (base = mobile, lg = desktop) for
 *   real art-direction on the hero banner — a different image per breakpoint,
 *   not just a scaled one.
 * - `accordion`/`accordion-item` (ships in `@kivcode/nodes-interactive`) for
 *   the FAQ — register that package alongside `@kivcode/nodes` to see it.
 * - `card` for every boxed/bordered panel (steps, allies, gallery, "who it's
 *   for"), including as a fixed-size circular badge (`width`/`height` +
 *   `borderRadius: "full"` + centered `alignItems`/`justifyContent`) for the
 *   numbered step indicator — so the whole page reuses one shared
 *   background/border/shadow/size field set instead of hand-rolled styles.
 * - Each step's numbered circle badge sits as plain content at the top of
 *   its own card (no overlap, no connecting line) — simplest option and the
 *   one that holds up identically across every breakpoint. Everything else
 *   on this page is plain real text/image nodes in normal flow — no clipped
 *   shapes, no z-stack/layer — since that is what actually renders
 *   identically across every breakpoint without needing hand-tuned geometry.
 * - The hero's date/time/location panel is a `card` with a responsive
 *   `width` (100% on mobile, 85% on desktop) — adjust per breakpoint from
 *   the inspector like any other field, no separate component needed.
 *
 * All photography is a generic placeholder (picsum.photos) — replace every
 * `image` node's Source URL via the media picker with the client's real
 * assets. The header isn't sticky (no `position` field on Section) — an
 * easy manual tweak once the template is applied.
 */
export const TRADE_FAIR_I18N: I18nConfig = { default: "es", supported: ["es"] };

const NAVY = "#003b7b";
const RED = "#ff0037";
const SLATE_50 = "#f8fafc";
const SLATE_600 = "#475569";
const SLATE_500 = "#64748b";

/**
 * A step card with its numbered circle badge as regular content at the top
 * of the card — no overlap, no connecting line. Simpler and more robust
 * across breakpoints than trying to hang the circle off the card's corner.
 */
function stepCard(opts: {
	key: string;
	circleColor: string;
	number: string;
	title: string;
	text: string;
}) {
	const { key, circleColor, number, title, text } = opts;
	return {
		id: `tf-step-${key}`,
		type: "column",
		props: { span: "1" },
		slots: {
			default: [
				{
					id: `tf-step-${key}-card`,
					type: "card",
					props: { borderRadius: "xl", shadow: "sm", padding: "lg" },
					slots: {
						default: [
							{
								id: `tf-step-${key}-stack`,
								type: "stack",
								props: { direction: "column", gap: "sm" },
								slots: {
									default: [
										{
											id: `tf-step-${key}-circle`,
											type: "card",
											props: {
												background: circleColor,
												width: "40px",
												height: "40px",
												borderRadius: "full",
												padding: "none",
												alignItems: "center",
												justifyContent: "center",
											},
											slots: {
												default: [
													{
														id: `tf-step-${key}-circle-text`,
														type: "text",
														props: {
															content: number,
															color: "#ffffff",
															weight: "900",
															align: "center",
															size: 16,
														},
													},
												],
											},
										},
										{
											id: `tf-step-${key}-title`,
											type: "heading",
											props: {
												text: title,
												level: "3",
												color: NAVY,
												size: 18,
											},
										},
										{
											id: `tf-step-${key}-text`,
											type: "text",
											props: {
												content: text,
												color: SLATE_600,
												size: 13,
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
	};
}

export const tradeFairLandingDocument: KivDocument = {
	schemaVersion: 3,
	i18n: TRADE_FAIR_I18N,
	root: {
		id: "root",
		type: "page",
		props: { lang: "es" },
		slots: {
			default: [
				// ── Hero: real text nodes over a responsive art-direction
				// background photo (base = mobile crop, lg = desktop crop) —
				// only the photo is an image; everything else is editable text.
				{
					id: "tf-hero",
					type: "section",
					props: {
						background: "#ffffff",
						fullWidth: true,
						padding: { top: "2xl", right: "md", bottom: "2xl", left: "md" },
					},
					slots: {
						default: [
							{
								id: "tf-hero-container",
								type: "container",
								props: { maxWidth: "2xl", centered: true },
								slots: {
									default: [
										{
											id: "tf-hero-grid",
											type: "grid",
											props: {
												columns: { base: "1", lg: "12" },
												gap: "lg",
												alignItems: "center",
											},
											slots: {
												default: [
													// ── Left: real text nodes, each with its own real
													// typography fields (no HTML hacks) ────────────────
													{
														id: "tf-hero-text-col",
														type: "column",
														props: { span: "6" },
														slots: {
															default: [
																{
																	id: "tf-hero-stack",
																	type: "stack",
																	props: {
																		direction: "column",
																		align: "flex-start",
																		gap: "md",
																	},
																	slots: {
																		default: [
																			{
																				id: "tf-hero-stars",
																				type: "stack",
																				props: { direction: "row", gap: "xs" },
																				slots: {
																					default: [
																						{
																							id: "tf-hero-star-1",
																							type: "icon",
																							props: {
																								icon: "lucide:star",
																								iconSize: "18px",
																								iconColor: RED,
																							},
																						},
																						{
																							id: "tf-hero-star-2",
																							type: "icon",
																							props: {
																								icon: "lucide:star",
																								iconSize: "18px",
																								iconColor: RED,
																							},
																						},
																						{
																							id: "tf-hero-star-3",
																							type: "icon",
																							props: {
																								icon: "lucide:star",
																								iconSize: "18px",
																								iconColor: RED,
																							},
																						},
																					],
																				},
																			},
																			{
																				id: "tf-hero-title-stack",
																				type: "stack",
																				props: {
																					direction: "column",
																					gap: "none",
																				},
																				slots: {
																					default: [
																						{
																							id: "tf-hero-title-1",
																							type: "heading",
																							props: {
																								text: "Feria de",
																								level: "3",
																								color: NAVY,
																								weight: "800",
																								fontStyle: "italic",
																								size: 32,
																							},
																						},
																						{
																							id: "tf-hero-title-2",
																							type: "heading",
																							props: {
																								text: "POLLO",
																								level: "1",
																								color: RED,
																								weight: "900",
																								size: 56,
																							},
																						},
																						{
																							id: "tf-hero-title-3",
																							type: "heading",
																							props: {
																								text: "AMERICANO",
																								level: "1",
																								color: NAVY,
																								weight: "900",
																								size: 48,
																							},
																						},
																						{
																							id: "tf-hero-title-4",
																							type: "heading",
																							props: {
																								text: "2026",
																								level: "1",
																								color: NAVY,
																								weight: "900",
																								size: 44,
																							},
																						},
																					],
																				},
																			},
																			{
																				id: "tf-hero-tagline-stack",
																				type: "stack",
																				props: {
																					direction: "column",
																					gap: "none",
																				},
																				slots: {
																					default: [
																						{
																							id: "tf-hero-tagline-1",
																							type: "text",
																							props: {
																								content:
																									"Descubre, aprende y conecta",
																								color: NAVY,
																								weight: "800",
																								size: 19,
																							},
																						},
																						{
																							id: "tf-hero-tagline-2",
																							type: "text",
																							props: {
																								content:
																									"con los líderes del sector",
																								color: RED,
																								weight: "800",
																								size: 19,
																							},
																						},
																					],
																				},
																			},
																			{
																				id: "tf-hero-cta",
																				type: "button",
																				props: {
																					label: "Regístrate",
																					icon: "lucide:chevron-right",
																					iconPosition: "right",
																					href: "#tf-faq",
																					linkType: "anchor",
																					variant: "outline",
																					customBorderColor: RED,
																					textColor: {
																						type: "solid",
																						solid: RED,
																						alpha: 1,
																						from: "#6366f1",
																						fromAlpha: 1,
																						middle: "",
																						middleAlpha: 1,
																						to: "#a855f7",
																						toAlpha: 1,
																						angle: 135,
																					},
																					borderRadius: "full",
																					size: "lg",
																				},
																			},
																		],
																	},
																},
															],
														},
													},
													// ── Right: layered red/navy shapes with the event photo
													// bleeding through, matching the real client banner ──
													{
														id: "tf-hero-visual-col",
														type: "column",
														props: { span: "6" },
														slots: {
															default: [
																{
																	id: "tf-hero-visual-stack",
																	type: "stack",
																	props: {
																		direction: "column",
																		align: "flex-end",
																		gap: "md",
																	},
																	slots: {
																		default: [
																			{
																				id: "tf-hero-photo",
																				type: "image",
																				props: {
																					src: {
																						base: "https://picsum.photos/seed/tf-hero-mobile/1080/1350",
																						lg: "https://picsum.photos/seed/tf-hero-desktop/1920/840",
																					},
																					alt: "Feria de Pollo Americano 2026",
																					fit: "cover",
																					aspectRatio: {
																						base: "4/3",
																						lg: "16/9",
																					},
																					borderRadius: "xl",
																					shadow: "lg",
																				},
																			},
																			{
																				id: "tf-hero-info-card",
																				type: "card",
																				props: {
																					background: NAVY,
																					borderRadius: "xl",
																					padding: "lg",
																					width: { base: "100%", lg: "85%" },
																				},
																				slots: {
																					default: [
																						{
																							id: "tf-hero-info-stack",
																							type: "stack",
																							props: {
																								direction: "column",
																								gap: "sm",
																							},
																							slots: {
																								default: [
																									{
																										id: "tf-hero-info-date",
																										type: "stack",
																										props: {
																											direction: "row",
																											align: "center",
																											gap: "sm",
																										},
																										slots: {
																											default: [
																												{
																													id: "tf-hero-info-date-icon",
																													type: "icon",
																													props: {
																														icon: "lucide:calendar",
																														iconSize: "22px",
																														iconColor:
																															"#ffffff",
																													},
																												},
																												{
																													id: "tf-hero-info-date-text",
																													type: "text",
																													props: {
																														content:
																															"Miércoles 11 de noviembre",
																														color: "#ffffff",
																														weight: "700",
																														size: 15,
																													},
																												},
																											],
																										},
																									},
																									{
																										id: "tf-hero-info-time",
																										type: "stack",
																										props: {
																											direction: "row",
																											align: "center",
																											gap: "sm",
																										},
																										slots: {
																											default: [
																												{
																													id: "tf-hero-info-time-icon",
																													type: "icon",
																													props: {
																														icon: "lucide:clock",
																														iconSize: "22px",
																														iconColor:
																															"#ffffff",
																													},
																												},
																												{
																													id: "tf-hero-info-time-text",
																													type: "text",
																													props: {
																														content:
																															"de 11:00 a.m. a 05:00 p.m.",
																														color: "#ffffff",
																														weight: "700",
																														size: 15,
																													},
																												},
																											],
																										},
																									},
																									{
																										id: "tf-hero-info-place",
																										type: "stack",
																										props: {
																											direction: "row",
																											align: "flex-start",
																											gap: "sm",
																										},
																										slots: {
																											default: [
																												{
																													id: "tf-hero-info-place-icon",
																													type: "icon",
																													props: {
																														icon: "lucide:map-pin",
																														iconSize: "22px",
																														iconColor:
																															"#ffffff",
																													},
																												},
																												{
																													id: "tf-hero-info-place-text",
																													type: "text",
																													props: {
																														content:
																															"Centro Español del Perú — Av. Gral. Felipe Salaverry 1910, Jesús María",
																														color: "#ffffff",
																														weight: "700",
																														size: 14,
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
									],
								},
							},
						],
					},
				},
				// ── La Ruta del Crecimiento (3 steps) ──────────────────────
				{
					id: "tf-steps",
					type: "section",
					props: {
						background: SLATE_50,
						fullWidth: true,
						padding: { top: "xl", right: "md", bottom: "xl", left: "md" },
					},
					slots: {
						default: [
							{
								id: "tf-steps-container",
								type: "container",
								props: { maxWidth: "xl", centered: true, gap: "lg" },
								slots: {
									default: [
										{
											id: "tf-steps-intro",
											type: "stack",
											props: {
												direction: "column",
												gap: "sm",
												align: "center",
											},
											slots: {
												default: [
													{
														id: "tf-steps-heading",
														type: "heading",
														props: {
															text: "La Ruta del Crecimiento",
															level: "2",
															color: NAVY,
															align: "center",
														},
													},
													{
														id: "tf-steps-text",
														type: "text",
														props: {
															content:
																"La Feria de Pollo Americano es un evento exclusivo para explorar nuevas oportunidades de abastecer tu negocio.",
															color: SLATE_600,
															align: "center",
															size: 15,
														},
													},
												],
											},
										},
										{
											id: "tf-steps-grid",
											type: "grid",
											props: { columns: { base: "1", md: "3" }, gap: "lg" },
											slots: {
												default: [
													stepCard({
														key: "1",
														circleColor: RED,
														number: "1",
														title: "Conexión comercial",
														text: "Conoce a los principales importadores de la industria. Cierra acuerdos comerciales y asegura el abastecimiento de tu establecimiento.",
													}),
													stepCard({
														key: "2",
														circleColor: NAVY,
														number: "2",
														title: "Máximo rendimiento e inocuidad garantizada",
														text: "Participa en un seminario técnico exclusivo. Aprende técnicas avanzadas de descongelamiento, inocuidad alimentaria y manejo operativo de tu negocio.",
													}),
													stepCard({
														key: "3",
														circleColor: RED,
														number: "3",
														title: "Experiencia gastronómica y versatilidad",
														text: "Descubre todo el potencial del pollo americano en vivo con degustaciones diseñadas para el canal HORECA.",
													}),
												],
											},
										},
									],
								},
							},
						],
					},
				},
				// ── ¿Quiénes somos? ─────────────────────────────────────────
				{
					id: "tf-about",
					type: "section",
					props: {
						background: "#ffffff",
						fullWidth: true,
						padding: { top: "xl", right: "md", bottom: "xl", left: "md" },
					},
					slots: {
						default: [
							{
								id: "tf-about-container",
								type: "container",
								props: { maxWidth: "xl", centered: true },
								slots: {
									default: [
										{
											id: "tf-about-heading",
											type: "heading",
											props: {
												text: "¿Quiénes somos?",
												level: "2",
												color: NAVY,
												align: "center",
											},
										},
										{
											id: "tf-about-card",
											type: "card",
											props: {
												background: SLATE_50,
												borderRadius: "xl",
												padding: "lg",
											},
											slots: {
												default: [
													{
														id: "tf-about-grid",
														type: "grid",
														props: {
															columns: { base: "1", md: "3" },
															gap: "lg",
															alignItems: "center",
														},
														slots: {
															default: [
																{
																	id: "tf-about-logo-col",
																	type: "column",
																	props: { span: "1" },
																	slots: {
																		default: [
																			{
																				id: "tf-about-logo-stack",
																				type: "stack",
																				props: {
																					direction: "column",
																					align: "center",
																					gap: "xs",
																				},
																				slots: {
																					default: [
																						{
																							id: "tf-about-logo",
																							type: "heading",
																							props: {
																								text: "USAPEEC",
																								level: "3",
																								color: NAVY,
																								weight: "900",
																								align: "center",
																							},
																						},
																						{
																							id: "tf-about-logo-caption",
																							type: "text",
																							props: {
																								content:
																									"USA Poultry & Egg Export Council",
																								color: SLATE_500,
																								size: 11,
																								align: "center",
																								transform: "uppercase",
																								weight: "700",
																							},
																						},
																					],
																				},
																			},
																		],
																	},
																},
																{
																	id: "tf-about-text-col",
																	type: "column",
																	props: { span: "2" },
																	slots: {
																		default: [
																			{
																				id: "tf-about-text-stack",
																				type: "stack",
																				props: {
																					direction: "column",
																					gap: "sm",
																				},
																				slots: {
																					default: [
																						{
																							id: "tf-about-p1",
																							type: "text",
																							props: {
																								content:
																									"Somos una asociación comercial con un objetivo claro: mostrar al mundo los excelentes productos de carne de aves y huevos de los Estados Unidos.",
																								color: SLATE_600,
																								size: 13,
																							},
																						},
																						{
																							id: "tf-about-p2",
																							type: "text",
																							props: {
																								content:
																									"El hecho de contar con productores responsables, un gobierno comprometido con los más altos estándares y acceso a ciencia y tecnologías innovadoras hace que la carne de ave y los huevos estadounidenses sean seguros, de buen sabor y calidad.",
																								color: SLATE_600,
																								size: 13,
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
				// ── Nuestros aliados ────────────────────────────────────────
				{
					id: "tf-allies",
					type: "section",
					props: {
						background: NAVY,
						fullWidth: true,
						padding: { top: "xl", right: "md", bottom: "xl", left: "md" },
					},
					slots: {
						default: [
							{
								id: "tf-allies-container",
								type: "container",
								props: { maxWidth: "2xl", centered: true },
								slots: {
									default: [
										{
											id: "tf-allies-heading",
											type: "heading",
											props: {
												text: "Nuestros Aliados",
												level: "2",
												color: "#ffffff",
												align: "center",
												transform: "uppercase",
											},
										},
										{
											id: "tf-allies-grid",
											type: "grid",
											props: {
												columns: { base: "2", sm: "3", md: "4", lg: "7" },
												gap: "md",
											},
											slots: {
												default: Array.from({ length: 7 }, (_, i) => ({
													id: `tf-ally-${i + 1}`,
													type: "column",
													props: { span: "1" },
													slots: {
														default: [
															{
																id: `tf-ally-${i + 1}-card`,
																type: "card",
																props: {
																	background: "#ffffff",
																	borderRadius: "lg",
																	shadow: "sm",
																	padding: "sm",
																},
																slots: {
																	default: [
																		{
																			id: `tf-ally-${i + 1}-image`,
																			type: "image",
																			props: {
																				src: `https://picsum.photos/seed/tf-ally-${i + 1}/200/200`,
																				alt: `Aliado ${i + 1}`,
																				fit: "contain",
																				aspectRatio: "1/1",
																			},
																		},
																	],
																},
															},
														],
													},
												})),
											},
										},
									],
								},
							},
						],
					},
				},
				// ── Revive la novena edición (gallery) ─────────────────────
				{
					id: "tf-gallery",
					type: "section",
					props: {
						background: "#ffffff",
						fullWidth: true,
						padding: { top: "xl", right: "md", bottom: "xl", left: "md" },
					},
					slots: {
						default: [
							{
								id: "tf-gallery-container",
								type: "container",
								props: { maxWidth: "xl", centered: true },
								slots: {
									default: [
										{
											id: "tf-gallery-heading",
											type: "heading",
											props: {
												text: "Revive la Novena Edición de la Feria",
												level: "2",
												color: NAVY,
												align: "center",
												transform: "uppercase",
											},
										},
										{
											id: "tf-gallery-grid",
											type: "grid",
											props: { columns: { base: "1", md: "3" }, gap: "lg" },
											slots: {
												default: [
													{
														id: "tf-gallery-1",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "tf-gallery-1-card",
																	type: "card",
																	props: {
																		background: SLATE_50,
																		borderRadius: "xl",
																		padding: "sm",
																	},
																	slots: {
																		default: [
																			{
																				id: "tf-gallery-1-stack",
																				type: "stack",
																				props: {
																					direction: "column",
																					gap: "sm",
																				},
																				slots: {
																					default: [
																						{
																							id: "tf-gallery-1-image",
																							type: "image",
																							props: {
																								src: "https://picsum.photos/seed/tf-gallery-1/600/450",
																								alt: "Demostraciones Culinarias en Vivo",
																								fit: "cover",
																								aspectRatio: "4/3",
																								borderRadius: "lg",
																							},
																						},
																						{
																							id: "tf-gallery-1-caption",
																							type: "text",
																							props: {
																								content:
																									"Demostraciones Culinarias en Vivo",
																								color: NAVY,
																								weight: "800",
																								size: 12,
																								transform: "uppercase",
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
														id: "tf-gallery-2",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "tf-gallery-2-card",
																	type: "card",
																	props: {
																		background: SLATE_50,
																		borderRadius: "xl",
																		padding: "sm",
																	},
																	slots: {
																		default: [
																			{
																				id: "tf-gallery-2-stack",
																				type: "stack",
																				props: {
																					direction: "column",
																					gap: "sm",
																				},
																				slots: {
																					default: [
																						{
																							id: "tf-gallery-2-image",
																							type: "image",
																							props: {
																								src: "https://picsum.photos/seed/tf-gallery-2/600/450",
																								alt: "Seminario Técnico",
																								fit: "cover",
																								aspectRatio: "4/3",
																								borderRadius: "lg",
																							},
																						},
																						{
																							id: "tf-gallery-2-caption",
																							type: "text",
																							props: {
																								content: "Seminario Técnico",
																								color: NAVY,
																								weight: "800",
																								size: 12,
																								transform: "uppercase",
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
														id: "tf-gallery-3",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "tf-gallery-3-card",
																	type: "card",
																	props: {
																		background: SLATE_50,
																		borderRadius: "xl",
																		padding: "sm",
																	},
																	slots: {
																		default: [
																			{
																				id: "tf-gallery-3-stack",
																				type: "stack",
																				props: {
																					direction: "column",
																					gap: "sm",
																				},
																				slots: {
																					default: [
																						{
																							id: "tf-gallery-3-image",
																							type: "image",
																							props: {
																								src: "https://picsum.photos/seed/tf-gallery-3/600/450",
																								alt: "Reuniones de negocios",
																								fit: "cover",
																								aspectRatio: "4/3",
																								borderRadius: "lg",
																							},
																						},
																						{
																							id: "tf-gallery-3-caption",
																							type: "text",
																							props: {
																								content:
																									"Reuniones de negocios",
																								color: NAVY,
																								weight: "800",
																								size: 12,
																								transform: "uppercase",
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
				// ── Dirigido a ──────────────────────────────────────────────
				{
					id: "tf-audience",
					type: "section",
					props: {
						background: SLATE_50,
						fullWidth: true,
						padding: { top: "xl", right: "md", bottom: "xl", left: "md" },
					},
					slots: {
						default: [
							{
								id: "tf-audience-container",
								type: "container",
								props: { maxWidth: "xl", centered: true },
								slots: {
									default: [
										{
											id: "tf-audience-heading",
											type: "heading",
											props: {
												text: "Dirigido a",
												level: "2",
												color: NAVY,
												align: "center",
												transform: "uppercase",
											},
										},
										{
											id: "tf-audience-grid",
											type: "grid",
											props: {
												columns: { base: "1", sm: "2", lg: "4" },
												gap: "md",
											},
											slots: {
												default: [
													{
														id: "tf-audience-1",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "tf-audience-1-card",
																	type: "card",
																	props: {
																		borderRadius: "xl",
																		shadow: "sm",
																		padding: "lg",
																	},
																	slots: {
																		default: [
																			{
																				id: "tf-audience-1-stack",
																				type: "stack",
																				props: {
																					direction: "column",
																					align: "center",
																					gap: "sm",
																				},
																				slots: {
																					default: [
																						{
																							id: "tf-audience-1-emoji",
																							type: "text",
																							props: {
																								content: "🍽️",
																								size: 32,
																								align: "center",
																							},
																						},
																						{
																							id: "tf-audience-1-title",
																							type: "heading",
																							props: {
																								text: "Restaurantes",
																								level: "4",
																								color: NAVY,
																								align: "center",
																								transform: "uppercase",
																								size: 14,
																							},
																						},
																						{
																							id: "tf-audience-1-text",
																							type: "text",
																							props: {
																								content:
																									"Establecimientos gastronómicos que buscan insumos avícolas estandarizados y de alta calidad.",
																								color: SLATE_500,
																								size: 12,
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
													{
														id: "tf-audience-2",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "tf-audience-2-card",
																	type: "card",
																	props: {
																		borderRadius: "xl",
																		shadow: "sm",
																		padding: "lg",
																	},
																	slots: {
																		default: [
																			{
																				id: "tf-audience-2-stack",
																				type: "stack",
																				props: {
																					direction: "column",
																					align: "center",
																					gap: "sm",
																				},
																				slots: {
																					default: [
																						{
																							id: "tf-audience-2-emoji",
																							type: "text",
																							props: {
																								content: "🎰",
																								size: 32,
																								align: "center",
																							},
																						},
																						{
																							id: "tf-audience-2-title",
																							type: "heading",
																							props: {
																								text: "Casinos",
																								level: "4",
																								color: NAVY,
																								align: "center",
																								transform: "uppercase",
																								size: 14,
																							},
																						},
																						{
																							id: "tf-audience-2-text",
																							type: "text",
																							props: {
																								content:
																									"Centros de entretenimiento con áreas de restaurante que requieren volumen de abastecimiento continuo.",
																								color: SLATE_500,
																								size: 12,
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
													{
														id: "tf-audience-3",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "tf-audience-3-card",
																	type: "card",
																	props: {
																		borderRadius: "xl",
																		shadow: "sm",
																		padding: "lg",
																	},
																	slots: {
																		default: [
																			{
																				id: "tf-audience-3-stack",
																				type: "stack",
																				props: {
																					direction: "column",
																					align: "center",
																					gap: "sm",
																				},
																				slots: {
																					default: [
																						{
																							id: "tf-audience-3-emoji",
																							type: "text",
																							props: {
																								content: "🏨",
																								size: 32,
																								align: "center",
																							},
																						},
																						{
																							id: "tf-audience-3-title",
																							type: "heading",
																							props: {
																								text: "Hoteles",
																								level: "4",
																								color: NAVY,
																								align: "center",
																								transform: "uppercase",
																								size: 14,
																							},
																						},
																						{
																							id: "tf-audience-3-text",
																							type: "text",
																							props: {
																								content:
																									"Cadenas de hospedaje enfocadas en ofrecer estándares internacionales de inocuidad en sus bufés.",
																								color: SLATE_500,
																								size: 12,
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
													{
														id: "tf-audience-4",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "tf-audience-4-card",
																	type: "card",
																	props: {
																		borderRadius: "xl",
																		shadow: "sm",
																		padding: "lg",
																	},
																	slots: {
																		default: [
																			{
																				id: "tf-audience-4-stack",
																				type: "stack",
																				props: {
																					direction: "column",
																					align: "center",
																					gap: "sm",
																				},
																				slots: {
																					default: [
																						{
																							id: "tf-audience-4-emoji",
																							type: "text",
																							props: {
																								content: "👨‍🍳",
																								size: 32,
																								align: "center",
																							},
																						},
																						{
																							id: "tf-audience-4-title",
																							type: "heading",
																							props: {
																								text: "Caterings",
																								level: "4",
																								color: NAVY,
																								align: "center",
																								transform: "uppercase",
																								size: 14,
																							},
																						},
																						{
																							id: "tf-audience-4-text",
																							type: "text",
																							props: {
																								content:
																									"Empresas de eventos y banquetes que necesitan el máximo rendimiento de cocción por porción.",
																								color: SLATE_500,
																								size: 12,
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
						],
					},
				},
				// ── FAQ ─────────────────────────────────────────────────────
				{
					id: "tf-faq",
					type: "section",
					props: {
						background: "#ffffff",
						fullWidth: true,
						padding: { top: "xl", right: "md", bottom: "xl", left: "md" },
					},
					slots: {
						default: [
							{
								id: "tf-faq-container",
								type: "container",
								props: { maxWidth: "md", centered: true },
								slots: {
									default: [
										{
											id: "tf-faq-intro",
											type: "stack",
											props: {
												direction: "column",
												gap: "xs",
												align: "center",
											},
											slots: {
												default: [
													{
														id: "tf-faq-heading",
														type: "heading",
														props: {
															text: "Preguntas Frecuentes",
															level: "2",
															color: NAVY,
															align: "center",
														},
													},
													{
														id: "tf-faq-subtitle",
														type: "text",
														props: {
															content:
																"Resuelve tus dudas antes de asistir al evento.",
															color: SLATE_600,
															align: "center",
															size: 14,
														},
													},
												],
											},
										},
										{
											id: "tf-faq-accordion",
											type: "accordion",
											props: {
												allowMultiple: true,
												keepOneOpen: false,
												gap: "sm",
											},
											slots: {
												default: [
													{
														id: "tf-faq-1",
														type: "accordion-item",
														props: {
															title: "¿Qué es la Feria de Pollo Americano?",
															defaultOpen: true,
															background: SLATE_50,
															titleColor: NAVY,
														},
														slots: {
															default: [
																{
																	id: "tf-faq-1-text",
																	type: "text",
																	props: {
																		content:
																			"Una experiencia creada para celebrar y descubrir todo lo que el pollo americano tiene para ofrecer. Conecta con importadores, distribuidores y empresas del sector HORECA.",
																		color: SLATE_600,
																		size: 13,
																	},
																},
															],
														},
													},
													{
														id: "tf-faq-2",
														type: "accordion-item",
														props: {
															title: "¿A quién está dirigida?",
															background: SLATE_50,
															titleColor: NAVY,
														},
														slots: {
															default: [
																{
																	id: "tf-faq-2-text",
																	type: "text",
																	props: {
																		content:
																			"La feria está dirigida principalmente a importadores, distribuidores, supermercados, restaurantes, hoteles, foodservice y profesionales de la industria de alimentos.",
																		color: SLATE_600,
																		size: 13,
																	},
																},
															],
														},
													},
													{
														id: "tf-faq-3",
														type: "accordion-item",
														props: {
															title: "¿Por qué participar?",
															background: SLATE_50,
															titleColor: NAVY,
														},
														slots: {
															default: [
																{
																	id: "tf-faq-3-text",
																	type: "text",
																	props: {
																		content:
																			"Porque es una oportunidad para conocer nuevos productos, conectar con proveedores, generar contactos comerciales y descubrir soluciones para tu negocio en un solo lugar.",
																		color: SLATE_600,
																		size: 13,
																	},
																},
															],
														},
													},
													{
														id: "tf-faq-4",
														type: "accordion-item",
														props: {
															title: "¿La entrada tiene algún costo?",
															background: SLATE_50,
															titleColor: NAVY,
														},
														slots: {
															default: [
																{
																	id: "tf-faq-4-text",
																	type: "text",
																	props: {
																		content:
																			"No. La participación es gratuita, previa inscripción y confirmación.",
																		color: SLATE_600,
																		size: 13,
																	},
																},
															],
														},
													},
													{
														id: "tf-faq-5",
														type: "accordion-item",
														props: {
															title: "¿Necesito registrarme previamente?",
															background: SLATE_50,
															titleColor: NAVY,
														},
														slots: {
															default: [
																{
																	id: "tf-faq-5-text",
																	type: "text",
																	props: {
																		content:
																			"Sí. Te recomendamos registrarte con anticipación para asegurar tu participación y recibir toda la información del evento.",
																		color: SLATE_600,
																		size: 13,
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
