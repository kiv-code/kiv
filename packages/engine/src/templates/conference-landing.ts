import type { I18nConfig, KivDocument } from "../types";

/**
 * A multi-track conference / keynote-event landing — modeled after a real
 * client delivery (a PMI-style LATAM conference) so users start from an
 * advanced composition instead of a blank canvas. Reuses the exact same node
 * vocabulary as `trade-fair-landing.ts`, plus:
 * - The `pricing` node's `table` variant for a tiered-registration price
 *   grid, including a Unicode strikethrough ("was S/ 1,700, now S/ 1,275")
 *   embedded directly in a price string — no special field needed for that.
 * - A gradient CTA button via `colorOrGradientField`'s `type: "gradient"`
 *   shape instead of a flat color.
 * - `section`'s `backgroundImage` + `overlay` for a dark-tinted photo hero.
 *
 * The keynote-speaker cards use GENERIC placeholder names/photos rather than
 * the real client's speakers — this ships as a public, reusable starter
 * template, and baking a specific person's name, employer and photo into it
 * isn't appropriate even when that content is otherwise public. Swap in the
 * real bios once applied inside the actual project.
 */
export const CONFERENCE_I18N: I18nConfig = { default: "es", supported: ["es"] };

const MAGENTA = "#f72c73";
const DEEP_PURPLE = "#4c073d";
const PEACH = "#fff0e5";
const INK = "#14162b";

function gradientPaint(from: string, middle: string, to: string) {
	return {
		type: "gradient" as const,
		solid: "",
		alpha: 1,
		from,
		fromAlpha: 1,
		middle,
		middleAlpha: 1,
		to,
		toAlpha: 1,
		angle: 135,
	};
}

function solidPaint(hex: string) {
	return {
		type: "solid" as const,
		solid: hex,
		alpha: 1,
		from: "#6366f1",
		fromAlpha: 1,
		middle: "",
		middleAlpha: 1,
		to: "#a855f7",
		toAlpha: 1,
		angle: 135,
	};
}

const CTA_GRADIENT = gradientPaint("#fb150c", MAGENTA, "#b662ff");
const CTA_DARK = gradientPaint(DEEP_PURPLE, DEEP_PURPLE, DEEP_PURPLE);

function speakerCard(id: string, seed: number) {
	return {
		id: `cf-speaker-${id}`,
		type: "column",
		props: { span: "1" },
		slots: {
			default: [
				{
					id: `cf-speaker-${id}-card`,
					type: "card",
					props: { padding: "lg", shadow: "none" },
					slots: {
						default: [
							{
								id: `cf-speaker-${id}-stack`,
								type: "stack",
								props: { direction: "column", align: "center", gap: "sm" },
								slots: {
									default: [
										{
											id: `cf-speaker-${id}-photo`,
											type: "image",
											props: {
												src: `https://picsum.photos/seed/cf-speaker-${seed}/300/300`,
												alt: "Speaker name",
												fit: "cover",
												aspectRatio: "1/1",
												borderRadius: "full",
												width: "220px",
												shadow: "md",
											},
										},
										{
											id: `cf-speaker-${id}-name`,
											type: "heading",
											props: {
												text: "Speaker Name",
												level: "4",
												align: "center",
												size: 20,
											},
										},
										{
											id: `cf-speaker-${id}-company`,
											type: "text",
											props: {
												content: "Role · Company",
												color: MAGENTA,
												align: "center",
												weight: "700",
												size: 14,
											},
										},
										{
											id: `cf-speaker-${id}-desc`,
											type: "text",
											props: {
												content: "One-line summary of their session topic.",
												align: "center",
												size: 13,
												color: "#475569",
											},
										},
										{
											id: `cf-speaker-${id}-btn`,
											type: "button",
											props: {
												label: "Ver información",
												href: "",
												linkType: "none",
												variant: "outline",
												borderRadius: "full",
												size: "sm",
												textColor: solidPaint(MAGENTA),
												customBorderColor: MAGENTA,
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

// Real page renders each bullet as a checkmark-in-a-circle + label row (an
// icon + text pair), never as an HTML `<ul>` — so every "benefit" stays a
// real node with its own color/weight/size fields the inspector can reach,
// instead of a raw HTML list baked into one rich-text block.
function benefitRow(id: string, label: string, accent: string) {
	return {
		id,
		type: "stack",
		props: { direction: "row", align: "center", gap: "sm" },
		slots: {
			default: [
				{
					id: `${id}-icon-wrap`,
					type: "card",
					props: {
						background: accent,
						borderRadius: "full",
						padding: "xs",
						shadow: "sm",
					},
					slots: {
						default: [
							{
								id: `${id}-icon`,
								type: "icon",
								props: {
									icon: "lucide:check",
									iconSize: "14px",
									iconColor: "#ffffff",
								},
							},
						],
					},
				},
				{
					id: `${id}-text`,
					type: "text",
					props: { content: label, size: 15, weight: "500" },
				},
			],
		},
	};
}

export const conferenceLandingDocument: KivDocument = {
	schemaVersion: 3,
	i18n: CONFERENCE_I18N,
	root: {
		id: "root",
		type: "page",
		props: { lang: "es" },
		slots: {
			default: [
				// ── Hero: full-bleed photo, left-to-right dark gradient
				// overlay, left-aligned content — matches the real PMI hero.
				{
					id: "cf-hero",
					type: "section",
					props: {
						backgroundImage: "https://picsum.photos/seed/cf-hero/1920/1080",
						backgroundSize: "cover",
						backgroundPosition: "center",
						overlay: true,
						overlayColor: {
							type: "gradient",
							solid: "",
							alpha: 1,
							from: "#000000",
							fromAlpha: 0.8,
							middle: "#000000",
							middleAlpha: 0.6,
							to: "#000000",
							toAlpha: 0,
							angle: 90,
						},
						fullWidth: true,
						minHeight: "90vh",
						alignItems: "flex-start",
						justifyContent: "center",
						padding: { top: "2xl", right: "md", bottom: "2xl", left: "md" },
					},
					slots: {
						default: [
							{
								id: "cf-hero-container",
								type: "container",
								props: { maxWidth: "2xl", centered: true },
								slots: {
									default: [
										{
											id: "cf-hero-inner",
											type: "container",
											props: {
												maxWidth: "sm",
												centered: false,
												padding: {
													top: "none",
													right: "none",
													bottom: "none",
													left: "none",
												},
											},
											slots: {
												default: [
													{
														id: "cf-hero-stack",
														type: "stack",
														props: {
															direction: "column",
															align: "flex-start",
															gap: "md",
														},
														slots: {
															default: [
																{
																	id: "cf-hero-badge-pill",
																	type: "card",
																	props: {
																		background: {
																			type: "solid",
																			solid: "#ffffff",
																			alpha: 0.2,
																			from: "#6366f1",
																			fromAlpha: 1,
																			middle: "",
																			middleAlpha: 1,
																			to: "#a855f7",
																			toAlpha: 1,
																			angle: 135,
																		},
																		borderRadius: "full",
																		padding: {
																			top: "xs",
																			right: "md",
																			bottom: "xs",
																			left: "md",
																		},
																		shadow: "none",
																		borderWidth: 1,
																		borderColor: "rgba(255,255,255,0.3)",
																	},
																	slots: {
																		default: [
																			{
																				id: "cf-hero-badge",
																				type: "text",
																				props: {
																					content: "12 – 13 de agosto de 2026",
																					color: "#ffffff",
																					size: 13,
																					weight: "500",
																				},
																			},
																		],
																	},
																},
																{
																	id: "cf-hero-title",
																	type: "heading",
																	props: {
																		text: "PMI® LATAM Conference",
																		level: "1",
																		color: "#ffffff",
																	},
																},
																{
																	id: "cf-hero-tagline",
																	type: "text",
																	props: {
																		content: "MORE, Together",
																		color: MAGENTA,
																		weight: "900",
																		size: 20,
																	},
																},
																{
																	id: "cf-hero-subtitle",
																	type: "text",
																	props: {
																		content:
																			"Nuestro momento para elevar proyectos.",
																		color: "#f1f5f9",
																		fontStyle: "italic",
																		weight: "700",
																		size: 16,
																	},
																},
																{
																	id: "cf-hero-description",
																	type: "text",
																	props: {
																		content:
																			"Bienvenido al evento más influyente en América Latina sobre la dirección de proyectos. Con más de 20 ponentes nacionales e internacionales, te invitamos a explorar tendencias emergentes, liderazgo estratégico, innovación y agilidad.",
																		color: "#e2e8f0",
																		size: 15,
																	},
																},
																{
																	id: "cf-hero-location",
																	type: "stack",
																	props: {
																		direction: "row",
																		align: "center",
																		gap: "xs",
																	},
																	slots: {
																		default: [
																			{
																				id: "cf-hero-location-icon",
																				type: "icon",
																				props: {
																					icon: "lucide:map-pin",
																					iconSize: "20px",
																					iconColor: "#ffffff",
																				},
																			},
																			{
																				id: "cf-hero-location-text",
																				type: "text",
																				props: {
																					content: "Swissôtel — Lima, Perú",
																					color: "#ffffff",
																					weight: "700",
																					size: 14,
																				},
																			},
																		],
																	},
																},
																{
																	id: "cf-hero-cta",
																	type: "button",
																	props: {
																		label: "Regístrate ahora",
																		icon: "lucide:move-right",
																		iconPosition: "right",
																		href: "/auth/register",
																		linkType: "internal",
																		background: CTA_GRADIENT,
																		textColor: solidPaint("#ffffff"),
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
									],
								},
							},
						],
					},
				},
				// ── Why attend ──────────────────────────────────────────────
				{
					id: "cf-why-attend",
					type: "section",
					props: {
						background: "#ffffff",
						fullWidth: true,
						padding: { top: "2xl", right: "md", bottom: "2xl", left: "md" },
					},
					slots: {
						default: [
							{
								id: "cf-why-container",
								type: "container",
								props: { maxWidth: "xl", centered: true, gap: "lg" },
								slots: {
									default: [
										{
											id: "cf-why-heading",
											type: "heading",
											props: { text: "¿Por qué asistir?", level: "2" },
										},
										{
											id: "cf-why-intro",
											type: "text",
											props: {
												content:
													"Inscríbete hoy en la PMI® LATAM Conference, que tomará lugar en Lima, un punto de encuentro clave para activar el poder de lograr el éxito en los proyectos, juntos.",
												size: 16,
												color: "#334155",
											},
										},
										{
											id: "cf-why-grid",
											type: "grid",
											props: { columns: { base: "1", md: "3" }, gap: "lg" },
											slots: {
												default: [
													{
														id: "cf-why-1",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "cf-why-1-stack",
																	type: "stack",
																	props: {
																		direction: "column",
																		align: "center",
																		gap: "sm",
																	},
																	slots: {
																		default: [
																			{
																				id: "cf-why-1-image",
																				type: "image",
																				props: {
																					src: "https://picsum.photos/seed/cf-why-1/400/400",
																					alt: "Más conexión",
																					fit: "cover",
																					aspectRatio: "1/1",
																					borderRadius: "full",
																					width: "220px",
																					shadow: "lg",
																					hoverEffect: "grayscale",
																				},
																			},
																			{
																				id: "cf-why-1-title",
																				type: "heading",
																				props: {
																					text: "Más conexión",
																					level: "3",
																					align: "center",
																					size: 18,
																				},
																			},
																			{
																				id: "cf-why-1-text",
																				type: "text",
																				props: {
																					content:
																						"Construye y diversifica tu red profesional, mientras descubres nuevas herramientas y caminos para acelerar tu crecimiento.",
																					align: "center",
																					size: 13,
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
														id: "cf-why-2",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "cf-why-2-stack",
																	type: "stack",
																	props: {
																		direction: "column",
																		align: "center",
																		gap: "sm",
																	},
																	slots: {
																		default: [
																			{
																				id: "cf-why-2-image",
																				type: "image",
																				props: {
																					src: "https://picsum.photos/seed/cf-why-2/400/400",
																					alt: "Más oportunidad",
																					fit: "cover",
																					aspectRatio: "1/1",
																					borderRadius: "full",
																					width: "220px",
																					shadow: "lg",
																					hoverEffect: "grayscale",
																				},
																			},
																			{
																				id: "cf-why-2-title",
																				type: "heading",
																				props: {
																					text: "Más oportunidad",
																					level: "3",
																					align: "center",
																					size: 18,
																				},
																			},
																			{
																				id: "cf-why-2-text",
																				type: "text",
																				props: {
																					content:
																						"Prepárate para el futuro con sesiones enfocadas en el desarrollo de habilidades, crecimiento profesional y las prácticas más actuales de la dirección de proyectos.",
																					align: "center",
																					size: 13,
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
														id: "cf-why-3",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "cf-why-3-stack",
																	type: "stack",
																	props: {
																		direction: "column",
																		align: "center",
																		gap: "sm",
																	},
																	slots: {
																		default: [
																			{
																				id: "cf-why-3-image",
																				type: "image",
																				props: {
																					src: "https://picsum.photos/seed/cf-why-3/400/400",
																					alt: "Más impacto",
																					fit: "cover",
																					aspectRatio: "1/1",
																					borderRadius: "full",
																					width: "220px",
																					shadow: "lg",
																					hoverEffect: "grayscale",
																				},
																			},
																			{
																				id: "cf-why-3-title",
																				type: "heading",
																				props: {
																					text: "Más impacto",
																					level: "3",
																					align: "center",
																					size: 18,
																				},
																			},
																			{
																				id: "cf-why-3-text",
																				type: "text",
																				props: {
																					content:
																						"Aprovecha el poder de la dirección de proyectos para generar valor, impulsar el cambio colectivo y liderar el progreso a escala global.",
																					align: "center",
																					size: 13,
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
											id: "cf-why-benefits-card",
											type: "card",
											props: {
												background: PEACH,
												borderRadius: "xl",
												padding: "lg",
											},
											slots: {
												default: [
													{
														id: "cf-why-benefits-stack",
														type: "stack",
														props: { direction: "column", gap: "sm" },
														slots: {
															default: [
																{
																	id: "cf-why-benefits-title",
																	type: "heading",
																	props: {
																		text: "Además:",
																		level: "3",
																		size: 18,
																	},
																},
																{
																	id: "cf-why-benefits-grid",
																	type: "grid",
																	props: {
																		columns: { base: "1", md: "2" },
																		gap: "sm",
																	},
																	slots: {
																		default: [
																			benefitRow(
																				"cf-why-benefit-1",
																				"Conecta con líderes y expertos de toda la región y de múltiples industrias.",
																				MAGENTA,
																			),
																			benefitRow(
																				"cf-why-benefit-2",
																				"Accede a contenidos prácticos y estratégicos en varios formatos.",
																				MAGENTA,
																			),
																			benefitRow(
																				"cf-why-benefit-3",
																				"Obtén PDUs para la renovación de certificaciones del PMI®, como el PMP® o el CAPM®.",
																				MAGENTA,
																			),
																			benefitRow(
																				"cf-why-benefit-4",
																				"Vive una experiencia presencial de alto nivel junto al equipo de PMI® en LATAM.",
																				MAGENTA,
																			),
																			benefitRow(
																				"cf-why-benefit-5",
																				"Conoce nuestra comunidad: miembros de PMI® y de nuestros capítulos.",
																				MAGENTA,
																			),
																		],
																	},
																},
																{
																	id: "cf-why-benefits-ctas",
																	type: "stack",
																	props: {
																		direction: { base: "column", sm: "row" },
																		gap: "sm",
																	},
																	slots: {
																		default: [
																			{
																				id: "cf-why-cta-primary",
																				type: "button",
																				props: {
																					label: "Regístrate ahora",
																					href: "/auth/register",
																					linkType: "internal",
																					background: CTA_GRADIENT,
																					textColor: solidPaint("#ffffff"),
																					borderRadius: "full",
																				},
																			},
																			{
																				id: "cf-why-cta-secondary",
																				type: "button",
																				props: {
																					label: "Detalles de la conferencia",
																					href: "#cf-conference-details",
																					linkType: "anchor",
																					background: CTA_DARK,
																					textColor: solidPaint("#ffffff"),
																					borderRadius: "full",
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
				// ── Pricing ─────────────────────────────────────────────────
				{
					id: "cf-pricing",
					type: "section",
					props: {
						background: PEACH,
						fullWidth: true,
						padding: { top: "2xl", right: "md", bottom: "2xl", left: "md" },
					},
					slots: {
						default: [
							{
								id: "cf-pricing-container",
								type: "container",
								props: { maxWidth: "xl", centered: true },
								slots: {
									default: [
										{
											id: "cf-pricing-grid",
											type: "grid",
											props: {
												columns: { base: "1", lg: "12" },
												gap: "lg",
												alignItems: "center",
											},
											slots: {
												default: [
													{
														id: "cf-pricing-text-col",
														type: "column",
														props: { span: "7" },
														slots: {
															default: [
																{
																	id: "cf-pricing-stack",
																	type: "stack",
																	props: { direction: "column", gap: "sm" },
																	slots: {
																		default: [
																			{
																				id: "cf-pricing-heading",
																				type: "heading",
																				props: {
																					text: "¡Inscripciones abiertas!",
																					level: "2",
																				},
																			},
																			{
																				id: "cf-pricing-subtitle",
																				type: "text",
																				props: {
																					content:
																						"¡Regístrate ahora y asegura tu descuento por reserva anticipada!",
																					color: MAGENTA,
																					weight: "700",
																					size: 17,
																				},
																			},
																			{
																				id: "cf-pricing-table",
																				type: "pricing",
																				props: {
																					data: JSON.stringify({
																						tiers: [
																							{
																								period: "13 al 27 Julio",
																								tier: "Regular (25% dto.)",
																								highlighted: true,
																							},
																							{
																								period: "Agosto",
																								tier: "Late",
																								highlighted: false,
																							},
																						],
																						rows: [
																							{
																								label: "PMI Members",
																								values: [
																									"S̶/̶ ̶1̶,̶7̶0̶0̶  S/ 1,275",
																									"S/ 2,100",
																								],
																							},
																							{
																								label: "Non-members",
																								values: [
																									"S̶/̶ ̶2̶,̶2̶0̶0̶  S/ 1,650",
																									"S/ 2,600",
																								],
																							},
																						],
																					}),
																					variant: "table",
																					headerColor: INK,
																					highlightColor: solidPaint(MAGENTA),
																					borderRadius: "lg",
																					ctaLabel: "Regístrate ahora",
																					linkType: "internal",
																					href: "/auth/register",
																				},
																			},
																			{
																				id: "cf-pricing-tax-note",
																				type: "text",
																				props: {
																					content:
																						"Los precios publicados incluyen IGV (18%), conforme a la normativa vigente.",
																					size: 11,
																					color: "#94a3b8",
																				},
																			},
																			{
																				id: "cf-pricing-member-note",
																				type: "text",
																				props: {
																					content:
																						"Acuérdate de que los miembros del PMI® ahorran en todos los eventos del PMI®, así que ¡inscríbete hoy mismo y ahorra al comprar tu ticket!",
																					size: 13,
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
														id: "cf-pricing-image-col",
														type: "column",
														props: { span: "5" },
														slots: {
															default: [
																{
																	id: "cf-pricing-image",
																	type: "image",
																	props: {
																		src: "https://picsum.photos/seed/cf-pricing/600/600",
																		alt: "Inscripciones",
																		fit: "cover",
																		aspectRatio: "1/1",
																		borderRadius: "full",
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
				// ── Keynote speakers ────────────────────────────────────────
				{
					id: "cf-speakers",
					type: "section",
					props: {
						background: "#ffffff",
						fullWidth: true,
						padding: { top: "2xl", right: "md", bottom: "2xl", left: "md" },
					},
					slots: {
						default: [
							{
								id: "cf-speakers-container",
								type: "container",
								props: { maxWidth: "xl", centered: true, gap: "lg" },
								slots: {
									default: [
										{
											id: "cf-speakers-heading",
											type: "heading",
											props: {
												text: "Keynote Speakers",
												level: "2",
												align: "center",
											},
										},
										{
											id: "cf-speakers-grid",
											type: "grid",
											props: {
												columns: { base: "1", sm: "2", lg: "3" },
												gap: "lg",
											},
											slots: {
												default: [
													speakerCard("1", 1),
													speakerCard("2", 2),
													speakerCard("3", 3),
												],
											},
										},
									],
								},
							},
						],
					},
				},
				// ── Featured session (heading + rich text + image) ─────────
				{
					id: "cf-session",
					type: "section",
					props: {
						background: "#f9fafb",
						fullWidth: true,
						padding: { top: "2xl", right: "md", bottom: "2xl", left: "md" },
					},
					slots: {
						default: [
							{
								id: "cf-session-container",
								type: "container",
								props: { maxWidth: "xl", centered: true },
								slots: {
									default: [
										{
											id: "cf-session-grid",
											type: "grid",
											props: {
												columns: { base: "1", md: "12" },
												gap: "lg",
												alignItems: "center",
											},
											slots: {
												default: [
													{
														id: "cf-session-text-col",
														type: "column",
														props: { span: "7" },
														slots: {
															default: [
																{
																	id: "cf-session-stack",
																	type: "stack",
																	props: { direction: "column", gap: "sm" },
																	slots: {
																		default: [
																			{
																				id: "cf-session-heading",
																				type: "heading",
																				props: {
																					text: "Sesión Especial LATAM 2026",
																					level: "2",
																				},
																			},
																			{
																				id: "cf-session-text",
																				type: "rich-text",
																				props: {
																					content:
																						"<p>Un espacio privado y estratégico reservado para socios y aliados de la región. Comparte experiencias, fortalece la red regional y mira hacia el futuro.</p><p><strong>Esta reunión ofrece:</strong></p><p>✔ Sesión exclusiva.<br>✔ Conversaciones estratégicas.<br>✔ Alineación regional.<br>✔ Intercambio de mejores prácticas.</p>",
																					color: "#475569",
																					size: 14,
																				},
																			},
																			{
																				id: "cf-session-cta",
																				type: "button",
																				props: {
																					label: "Regístrate ahora",
																					href: "/auth/register",
																					linkType: "internal",
																					background: CTA_GRADIENT,
																					textColor: solidPaint("#ffffff"),
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
													{
														id: "cf-session-image-col",
														type: "column",
														props: { span: "5" },
														slots: {
															default: [
																{
																	id: "cf-session-image",
																	type: "image",
																	props: {
																		src: "https://picsum.photos/seed/cf-session/600/600",
																		alt: "Sesión especial",
																		fit: "cover",
																		aspectRatio: "1/1",
																		borderRadius: "full",
																		shadow: "lg",
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
				// ── Location ────────────────────────────────────────────────
				{
					id: "cf-location",
					type: "section",
					props: {
						background: "#ffffff",
						fullWidth: true,
						padding: { top: "2xl", right: "md", bottom: "2xl", left: "md" },
					},
					slots: {
						default: [
							{
								id: "cf-location-container",
								type: "container",
								props: { maxWidth: "xl", centered: true },
								slots: {
									default: [
										{
											id: "cf-location-grid",
											type: "grid",
											props: {
												columns: { base: "1", lg: "12" },
												gap: "lg",
												alignItems: "center",
											},
											slots: {
												default: [
													{
														id: "cf-location-text-col",
														type: "column",
														props: { span: "5" },
														slots: {
															default: [
																{
																	id: "cf-location-stack",
																	type: "stack",
																	props: { direction: "column", gap: "sm" },
																	slots: {
																		default: [
																			{
																				id: "cf-location-heading",
																				type: "heading",
																				props: {
																					text: "Ubicación",
																					level: "2",
																				},
																			},
																			{
																				id: "cf-location-venue",
																				type: "heading",
																				props: {
																					text: "Sede del evento",
																					level: "4",
																					color: MAGENTA,
																					fontStyle: "italic",
																				},
																			},
																			{
																				id: "cf-location-text",
																				type: "text",
																				props: {
																					content:
																						"Ubicado en el corazón del distrito financiero, una de las zonas más exclusivas de la ciudad, con fácil acceso a las principales vías, centros empresariales, restaurantes y hoteles.",
																					color: "#475569",
																					size: 14,
																				},
																			},
																			{
																				id: "cf-location-ctas",
																				type: "stack",
																				props: {
																					direction: {
																						base: "column",
																						sm: "row",
																					},
																					gap: "sm",
																				},
																				slots: {
																					default: [
																						{
																							id: "cf-location-cta-map",
																							type: "button",
																							props: {
																								label: "Ver en el mapa",
																								href: "https://maps.google.com",
																								linkType: "external",
																								background: CTA_DARK,
																								textColor:
																									solidPaint("#ffffff"),
																								borderRadius: "full",
																							},
																						},
																						{
																							id: "cf-location-cta-register",
																							type: "button",
																							props: {
																								label: "Regístrate ahora",
																								href: "/auth/register",
																								linkType: "internal",
																								background: CTA_GRADIENT,
																								textColor:
																									solidPaint("#ffffff"),
																								borderRadius: "full",
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
														id: "cf-location-image-col",
														type: "column",
														props: { span: "7" },
														slots: {
															default: [
																{
																	id: "cf-location-image",
																	type: "image",
																	props: {
																		src: "https://picsum.photos/seed/cf-location/600/600",
																		alt: "Sede del evento",
																		fit: "cover",
																		aspectRatio: "1/1",
																		borderRadius: "full",
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
				// ── Sponsors ────────────────────────────────────────────────
				{
					id: "cf-sponsors",
					type: "section",
					props: {
						background: PEACH,
						fullWidth: true,
						padding: { top: "2xl", right: "md", bottom: "2xl", left: "md" },
					},
					slots: {
						default: [
							{
								id: "cf-sponsors-container",
								type: "container",
								props: { maxWidth: "xl", centered: true },
								slots: {
									default: [
										{
											id: "cf-sponsors-grid",
											type: "grid",
											props: {
												columns: { base: "1", md: "2" },
												gap: "lg",
												alignItems: "center",
											},
											slots: {
												default: [
													{
														id: "cf-sponsors-text-col",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "cf-sponsors-stack",
																	type: "stack",
																	props: { direction: "column", gap: "sm" },
																	slots: {
																		default: [
																			{
																				id: "cf-sponsors-heading",
																				type: "heading",
																				props: {
																					text: "¡Ayúdanos a crear algo increíble juntos!",
																					level: "2",
																				},
																			},
																			{
																				id: "cf-sponsors-text",
																				type: "text",
																				props: {
																					content:
																						"¿Te interesa patrocinar o exponer en la conferencia? Explora nuestro prospecto o contáctanos para conocer nuestras oportunidades.",
																					color: "#475569",
																					size: 14,
																				},
																			},
																			{
																				id: "cf-sponsors-benefits",
																				type: "stack",
																				props: {
																					direction: "column",
																					gap: "sm",
																				},
																				slots: {
																					default: [
																						{
																							id: "cf-sponsors-benefit-1",
																							type: "stack",
																							props: {
																								direction: "row",
																								align: "center",
																								gap: "sm",
																							},
																							slots: {
																								default: [
																									{
																										id: "cf-sponsors-benefit-1-icon-wrap",
																										type: "card",
																										props: {
																											background: "#ffffff",
																											borderRadius: "full",
																											padding: "xs",
																											shadow: "sm",
																										},
																										slots: {
																											default: [
																												{
																													id: "cf-sponsors-benefit-1-icon",
																													type: "icon",
																													props: {
																														icon: "lucide:eye",
																														iconSize: "18px",
																														iconColor: MAGENTA,
																													},
																												},
																											],
																										},
																									},
																									{
																										id: "cf-sponsors-benefit-1-text",
																										type: "text",
																										props: {
																											content:
																												"Visibilidad estratégica",
																											weight: "800",
																											transform: "uppercase",
																											fontStyle: "italic",
																											size: 14,
																										},
																									},
																								],
																							},
																						},
																						{
																							id: "cf-sponsors-benefit-2",
																							type: "stack",
																							props: {
																								direction: "row",
																								align: "center",
																								gap: "sm",
																							},
																							slots: {
																								default: [
																									{
																										id: "cf-sponsors-benefit-2-icon-wrap",
																										type: "card",
																										props: {
																											background: "#ffffff",
																											borderRadius: "full",
																											padding: "xs",
																											shadow: "sm",
																										},
																										slots: {
																											default: [
																												{
																													id: "cf-sponsors-benefit-2-icon",
																													type: "icon",
																													props: {
																														icon: "lucide:zap",
																														iconSize: "18px",
																														iconColor: MAGENTA,
																													},
																												},
																											],
																										},
																									},
																									{
																										id: "cf-sponsors-benefit-2-text",
																										type: "text",
																										props: {
																											content:
																												"Conexión directa con profesionales activos",
																											weight: "800",
																											transform: "uppercase",
																											fontStyle: "italic",
																											size: 14,
																										},
																									},
																								],
																							},
																						},
																						{
																							id: "cf-sponsors-benefit-3",
																							type: "stack",
																							props: {
																								direction: "row",
																								align: "center",
																								gap: "sm",
																							},
																							slots: {
																								default: [
																									{
																										id: "cf-sponsors-benefit-3-icon-wrap",
																										type: "card",
																										props: {
																											background: "#ffffff",
																											borderRadius: "full",
																											padding: "xs",
																											shadow: "sm",
																										},
																										slots: {
																											default: [
																												{
																													id: "cf-sponsors-benefit-3-icon",
																													type: "icon",
																													props: {
																														icon: "lucide:target",
																														iconSize: "18px",
																														iconColor: MAGENTA,
																													},
																												},
																											],
																										},
																									},
																									{
																										id: "cf-sponsors-benefit-3-text",
																										type: "text",
																										props: {
																											content:
																												"Posicionamiento en un evento líder de la región",
																											weight: "800",
																											transform: "uppercase",
																											fontStyle: "italic",
																											size: 14,
																										},
																									},
																								],
																							},
																						},
																					],
																				},
																			},
																			{
																				id: "cf-sponsors-ctas",
																				type: "stack",
																				props: {
																					direction: {
																						base: "column",
																						sm: "row",
																					},
																					gap: "sm",
																				},
																				slots: {
																					default: [
																						{
																							id: "cf-sponsors-cta-prospect",
																							type: "button",
																							props: {
																								label: "Opciones de patrocinio",
																								href: "",
																								linkType: "none",
																								background: gradientPaint(
																									MAGENTA,
																									MAGENTA,
																									"#ff6200",
																								),
																								textColor:
																									solidPaint("#ffffff"),
																								borderRadius: "full",
																							},
																						},
																						{
																							id: "cf-sponsors-cta-contact",
																							type: "button",
																							props: {
																								label: "Contáctanos",
																								href: "/contact",
																								linkType: "internal",
																								background: gradientPaint(
																									MAGENTA,
																									MAGENTA,
																									"#ff6200",
																								),
																								textColor:
																									solidPaint("#ffffff"),
																								borderRadius: "full",
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
														id: "cf-sponsors-image-col",
														type: "column",
														props: { span: "1" },
														slots: {
															default: [
																{
																	id: "cf-sponsors-image",
																	type: "image",
																	props: {
																		src: "https://picsum.photos/seed/cf-sponsors/600/600",
																		alt: "Patrocinadores",
																		fit: "cover",
																		aspectRatio: "1/1",
																		borderRadius: "full",
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
				// ── Conference details (agenda teaser) ─────────────────────
				{
					id: "cf-conference-details",
					type: "section",
					props: {
						background: DEEP_PURPLE,
						fullWidth: true,
						padding: { top: "2xl", right: "md", bottom: "2xl", left: "md" },
					},
					slots: {
						default: [
							{
								id: "cf-details-container",
								type: "container",
								props: { maxWidth: "md", centered: true },
								slots: {
									default: [
										{
											id: "cf-details-stack",
											type: "stack",
											props: {
												direction: "column",
												gap: "sm",
												align: "center",
											},
											slots: {
												default: [
													{
														id: "cf-details-eyebrow",
														type: "text",
														props: {
															content: "Detalles de la conferencia",
															color: MAGENTA,
															align: "center",
															weight: "800",
															transform: "uppercase",
															size: 12,
														},
													},
													{
														id: "cf-details-heading",
														type: "heading",
														props: {
															text: "Agenda de la Conferencia",
															level: "2",
															color: "#ffffff",
															align: "center",
														},
													},
													{
														id: "cf-details-tagline",
														type: "text",
														props: {
															content:
																'"MORE, Together. Nuestro momento para elevar proyectos."',
															color: "#e2e8f0",
															align: "center",
															fontStyle: "italic",
														},
													},
													{
														id: "cf-details-description",
														type: "text",
														props: {
															content:
																"Un programa diseñado para inspirar, desafiar perspectivas y conectar a líderes de proyectos de toda la región, con keynotes visionarios, sesiones prácticas y conversaciones estratégicas a través de múltiples tracks temáticos.",
															color: "#cbd5e1",
															align: "center",
															size: 14,
														},
													},
													{
														id: "cf-details-cta",
														type: "button",
														props: {
															label: "Haz clic aquí para ver la agenda",
															href: "",
															linkType: "none",
															background: solidPaint("#ffffff"),
															textColor: solidPaint(DEEP_PURPLE),
															borderRadius: "full",
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
				// ── Sponsor logos ───────────────────────────────────────────
				{
					id: "cf-sponsor-logos",
					type: "section",
					props: {
						background: "#ffffff",
						fullWidth: true,
						padding: { top: "2xl", right: "md", bottom: "2xl", left: "md" },
					},
					slots: {
						default: [
							{
								id: "cf-sponsor-logos-container",
								type: "container",
								props: { maxWidth: "xl", centered: true, gap: "lg" },
								slots: {
									default: [
										{
											id: "cf-sponsor-logos-heading",
											type: "heading",
											props: {
												text: "¡Muchas gracias a nuestros patrocinadores!",
												level: "2",
												align: "center",
											},
										},
										{
											id: "cf-sponsor-logos-grid",
											type: "grid",
											props: {
												columns: { base: "2", sm: "3" },
												gap: "lg",
												alignItems: "center",
											},
											slots: {
												default: [1, 2, 3].map((n) => ({
													id: `cf-sponsor-logo-${n}`,
													type: "column",
													props: { span: "1" },
													slots: {
														default: [
															{
																id: `cf-sponsor-logo-${n}-image`,
																type: "image",
																props: {
																	src: `https://picsum.photos/seed/cf-sponsor-${n}/240/120`,
																	alt: `Patrocinador ${n}`,
																	fit: "contain",
																	aspectRatio: "16/9",
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
			],
		},
	},
};
