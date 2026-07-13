import type { KivNode } from "@kivcode/engine";

/**
 * Each template call gets its own counter, so ids are deterministic and
 * reproducible (no `Date.now()`) — the first node of a given type is just
 * its type name (e.g. "heading"), repeats get a suffix ("card-2"). Actual
 * uniqueness against whatever's already in the document is the caller's
 * job via `cloneNodeTree()` at insert time, same as clipboard paste/duplicate.
 */
function createNodeBuilder() {
	const counts: Record<string, number> = {};
	return function node(
		type: string,
		props: Record<string, unknown> = {},
		slots: Record<string, KivNode[]> = {},
	): KivNode {
		const n = (counts[type] ?? 0) + 1;
		counts[type] = n;
		return { id: n === 1 ? type : `${type}-${n}`, type, props, slots };
	};
}

// ── Hero ─────────────────────────────────────────────────────────────

export function heroTemplate(): KivNode {
	const node = createNodeBuilder();
	return node(
		"section",
		{ paddingY: "xl", align: "center" },
		{
			default: [
				node("heading", { level: "1", text: "Build Something Amazing" }),
				node("text", {
					text: "The all-in-one platform that helps you ship faster, iterate smarter, and scale with confidence.",
				}),
				node("spacer", { height: "md" }),
				node("button", {
					label: "Get Started",
					variant: "primary",
					size: "lg",
					href: "#",
				}),
			],
		},
	);
}

// ── Feature Grid ─────────────────────────────────────────────────────

export function featureGridTemplate(): KivNode {
	const node = createNodeBuilder();
	const features = [
		{
			icon: "zap",
			title: "Lightning Fast",
			desc: "Optimized for speed at every level.",
		},
		{
			icon: "shield",
			title: "Secure by Default",
			desc: "Enterprise-grade security out of the box.",
		},
		{
			icon: "layers",
			title: "Infinitely Scalable",
			desc: "From prototype to production, seamlessly.",
		},
	];

	return node(
		"section",
		{ paddingY: "lg" },
		{
			default: [
				node("heading", { level: "2", text: "Why Choose Us", align: "center" }),
				node("text", {
					text: "Everything you need to build modern applications.",
					align: "center",
				}),
				node("spacer", { height: "md" }),
				node(
					"grid",
					{ columns: "3", gap: "lg" },
					{
						default: features.map((f) =>
							node(
								"card",
								{ padding: "lg", align: "center" },
								{
									default: [
										node("icon", { icon: f.icon, iconSize: 40 }),
										node("heading", { level: "3", text: f.title }),
										node("text", { text: f.desc }),
									],
								},
							),
						),
					},
				),
			],
		},
	);
}

// ── CTA Banner ───────────────────────────────────────────────────────

export function ctaBannerTemplate(): KivNode {
	const node = createNodeBuilder();
	return node(
		"section",
		{ paddingY: "lg", background: "#6366f1" },
		{
			default: [
				node("heading", {
					level: "2",
					text: "Ready to Get Started?",
					color: "#ffffff",
					align: "center",
				}),
				node("text", {
					text: "Join thousands of teams already using our platform.",
					color: "#e0e7ff",
					align: "center",
				}),
				node("spacer", { height: "sm" }),
				node("button", {
					label: "Start Free Trial",
					variant: "primary",
					size: "lg",
					background: { type: "solid", solid: "#ffffff", alpha: 1 },
					textColor: "#6366f1",
				}),
			],
		},
	);
}

// ── Testimonial ──────────────────────────────────────────────────────

export function testimonialTemplate(): KivNode {
	const node = createNodeBuilder();
	return node(
		"section",
		{ paddingY: "lg" },
		{
			default: [
				node("heading", {
					level: "2",
					text: "What Our Users Say",
					align: "center",
				}),
				node("spacer", { height: "md" }),
				node(
					"grid",
					{ columns: "3", gap: "lg" },
					{
						default: [
							node("testimonial", {
								quote:
									"This platform changed how our team builds products. We shipped 3x faster.",
								author: "Sarah Chen",
								role: "CTO, StartupCo",
							}),
							node("testimonial", {
								quote:
									"The best developer experience I've ever had. Highly recommended.",
								author: "Marcus Johnson",
								role: "Lead Dev, AgencyX",
							}),
							node("testimonial", {
								quote:
									"We migrated from 3 different tools to this one. Never looking back.",
								author: "Priya Patel",
								role: "VP Engineering, ScaleUp",
							}),
						],
					},
				),
			],
		},
	);
}

// ── FAQ ──────────────────────────────────────────────────────────────

export function faqTemplate(): KivNode {
	const node = createNodeBuilder();
	const items = [
		{
			title: "How does the free trial work?",
			body: "Start using the platform immediately with full access. No credit card required.",
		},
		{
			title: "Can I change plans later?",
			body: "Yes, upgrade or downgrade at any time from your account settings.",
		},
		{
			title: "Is there a limit on team members?",
			body: "Free tier includes up to 5 members. Pro and Enterprise offer unlimited seats.",
		},
	];

	return node(
		"section",
		{ paddingY: "lg" },
		{
			default: [
				node("heading", {
					level: "2",
					text: "Frequently Asked Questions",
					align: "center",
				}),
				node("spacer", { height: "md" }),
				node(
					"accordion",
					{ allowMultiple: true, gap: "sm" },
					{
						default: items.map((item) =>
							node(
								"accordion-item",
								{ title: item.title },
								{
									default: [node("text", { text: item.body })],
								},
							),
						),
					},
				),
			],
		},
	);
}

// ── Pricing Table ────────────────────────────────────────────────────

export function pricingTemplate(): KivNode {
	const node = createNodeBuilder();
	return node(
		"section",
		{ paddingY: "lg" },
		{
			default: [
				node("heading", {
					level: "2",
					text: "Simple, Transparent Pricing",
					align: "center",
				}),
				node("text", {
					text: "Choose the plan that fits your needs.",
					align: "center",
				}),
				node("spacer", { height: "md" }),
				node("pricing", {
					plan: "starter",
					price: "$9",
					period: "/mo",
					features: "5 projects, 10GB storage, Email support",
					cta: "Get Started",
				}),
				node("pricing", {
					plan: "pro",
					price: "$29",
					period: "/mo",
					features: "Unlimited projects, 100GB storage, Priority support",
					cta: "Start Pro",
					featured: true,
				}),
				node("pricing", {
					plan: "enterprise",
					price: "$99",
					period: "/mo",
					features: "Everything in Pro + SSO, audit logs, dedicated support",
					cta: "Contact Sales",
				}),
			],
		},
	);
}

// ── Footer ───────────────────────────────────────────────────────────

export function footerTemplate(): KivNode {
	const node = createNodeBuilder();
	return node(
		"section",
		{ paddingY: "lg", background: "#0f172a" },
		{
			default: [
				node(
					"grid",
					{ columns: "3", gap: "lg" },
					{
						default: [
							node(
								"stack",
								{ gap: "sm" },
								{
									default: [
										node("heading", {
											level: "4",
											text: "Product",
											color: "#ffffff",
										}),
										node("link", { text: "Features", href: "#" }),
										node("link", { text: "Pricing", href: "#" }),
										node("link", { text: "Docs", href: "#" }),
									],
								},
							),
							node(
								"stack",
								{ gap: "sm" },
								{
									default: [
										node("heading", {
											level: "4",
											text: "Company",
											color: "#ffffff",
										}),
										node("link", { text: "About", href: "#" }),
										node("link", { text: "Blog", href: "#" }),
										node("link", { text: "Careers", href: "#" }),
									],
								},
							),
							node(
								"stack",
								{ gap: "sm" },
								{
									default: [
										node("heading", {
											level: "4",
											text: "Legal",
											color: "#ffffff",
										}),
										node("link", { text: "Privacy", href: "#" }),
										node("link", { text: "Terms", href: "#" }),
										node("link", { text: "Contact", href: "#" }),
									],
								},
							),
						],
					},
				),
			],
		},
	);
}

// ── Agenda (schedule) ────────────────────────────────────────────────

export function agendaScheduleTemplate(): KivNode {
	const node = createNodeBuilder();
	return node(
		"section",
		{ paddingY: "lg" },
		{
			default: [
				node("heading", {
					level: "2",
					text: "Event Schedule",
					align: "center",
				}),
				node("spacer", { height: "md" }),
				node(
					"agenda",
					{ layout: "stripe", gap: "xs" },
					{
						default: [
							node("agenda-item", {
								time: "9:00 AM",
								label: "Opening",
								title: "Welcome & Keynote",
								description: "Setting the stage for the day ahead.",
							}),
							node("agenda-item", {
								time: "10:00 AM",
								label: "Talk",
								title: "Building at Scale",
								location: "Main Hall",
								description: "Lessons learned from growing to 10M users.",
							}),
							node("agenda-item", {
								time: "11:30 AM",
								label: "Workshop",
								title: "Hands-on Workshop",
								location: "Room A",
								description: "Build a full-stack app in 60 minutes.",
							}),
							node("agenda-item", {
								time: "1:00 PM",
								label: "Lunch",
								title: "Networking Lunch",
							}),
							node("agenda-item", {
								time: "2:30 PM",
								label: "Panel",
								title: "Future of Web Dev",
								location: "Main Hall",
							}),
						],
					},
				),
			],
		},
	);
}

// ── Team Grid ────────────────────────────────────────────────────────

export function teamGridTemplate(): KivNode {
	const node = createNodeBuilder();
	return node(
		"section",
		{ paddingY: "lg" },
		{
			default: [
				node("heading", { level: "2", text: "Meet the Team", align: "center" }),
				node("text", {
					text: "The people building the future.",
					align: "center",
				}),
				node("spacer", { height: "md" }),
				node(
					"grid",
					{ columns: "4", gap: "lg" },
					{
						default: [
							node(
								"card",
								{ align: "center", padding: "md" },
								{
									default: [
										node("image", {
											src: "",
											alt: "Team member",
											borderRadius: "full",
											width: "80px",
											aspectRatio: "1/1",
										}),
										node("heading", {
											level: "4",
											text: "Alex Rivera",
											align: "center",
										}),
										node("text", {
											text: "CEO & Founder",
											align: "center",
											color: "#64748b",
										}),
									],
								},
							),
							node(
								"card",
								{ align: "center", padding: "md" },
								{
									default: [
										node("image", {
											src: "",
											alt: "Team member",
											borderRadius: "full",
											width: "80px",
											aspectRatio: "1/1",
										}),
										node("heading", {
											level: "4",
											text: "Jordan Lee",
											align: "center",
										}),
										node("text", {
											text: "CTO",
											align: "center",
											color: "#64748b",
										}),
									],
								},
							),
							node(
								"card",
								{ align: "center", padding: "md" },
								{
									default: [
										node("image", {
											src: "",
											alt: "Team member",
											borderRadius: "full",
											width: "80px",
											aspectRatio: "1/1",
										}),
										node("heading", {
											level: "4",
											text: "Sam Nguyen",
											align: "center",
										}),
										node("text", {
											text: "Head of Design",
											align: "center",
											color: "#64748b",
										}),
									],
								},
							),
							node(
								"card",
								{ align: "center", padding: "md" },
								{
									default: [
										node("image", {
											src: "",
											alt: "Team member",
											borderRadius: "full",
											width: "80px",
											aspectRatio: "1/1",
										}),
										node("heading", {
											level: "4",
											text: "Taylor Kim",
											align: "center",
										}),
										node("text", {
											text: "Head of Growth",
											align: "center",
											color: "#64748b",
										}),
									],
								},
							),
						],
					},
				),
			],
		},
	);
}

// ── Logo Cloud ───────────────────────────────────────────────────────

export function logoCloudTemplate(): KivNode {
	const node = createNodeBuilder();
	return node(
		"section",
		{ paddingY: "lg" },
		{
			default: [
				node("text", {
					text: "Trusted by teams at",
					align: "center",
					color: "#64748b",
				}),
				node("spacer", { height: "md" }),
				node(
					"grid",
					{ columns: "5", gap: "lg", alignItems: "center" },
					{
						default: ["Acme", "Globex", "Initech", "Umbrella", "Soylent"].map(
							(name) =>
								node("image", {
									src: "",
									alt: name,
									fit: "contain",
									width: "120px",
								}),
						),
					},
				),
			],
		},
	);
}

// ── Contact ──────────────────────────────────────────────────────────

export function contactTemplate(): KivNode {
	const node = createNodeBuilder();
	return node(
		"section",
		{ paddingY: "lg" },
		{
			default: [
				node("heading", { level: "2", text: "Get in Touch", align: "center" }),
				node("text", {
					text: "We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
					align: "center",
				}),
				node("spacer", { height: "md" }),
				node(
					"form",
					{ layout: "stacked", submitLabel: "Send Message" },
					{
						default: [
							node("form-field", {
								fieldType: "text",
								name: "name",
								label: "Name",
								required: true,
							}),
							node("form-field", {
								fieldType: "email",
								name: "email",
								label: "Email",
								required: true,
							}),
							node("form-field", {
								fieldType: "textarea",
								name: "message",
								label: "Message",
								required: true,
							}),
						],
					},
				),
			],
		},
	);
}

// ── Newsletter ───────────────────────────────────────────────────────

export function newsletterTemplate(): KivNode {
	const node = createNodeBuilder();
	return node(
		"section",
		{ paddingY: "lg", background: "#f8fafc" },
		{
			default: [
				node("heading", {
					level: "2",
					text: "Stay in the Loop",
					align: "center",
				}),
				node("text", {
					text: "Subscribe for product updates, no spam.",
					align: "center",
				}),
				node("spacer", { height: "sm" }),
				node(
					"form",
					{ layout: "inline", submitLabel: "Subscribe" },
					{
						default: [
							node("form-field", {
								fieldType: "email",
								name: "email",
								placeholder: "you@example.com",
								required: true,
							}),
						],
					},
				),
			],
		},
	);
}

// ── Gallery ──────────────────────────────────────────────────────────

export function galleryTemplate(): KivNode {
	const node = createNodeBuilder();
	return node(
		"section",
		{ paddingY: "lg" },
		{
			default: [
				node("heading", { level: "2", text: "Gallery", align: "center" }),
				node("spacer", { height: "md" }),
				node(
					"grid",
					{ columns: "3", gap: "md" },
					{
						default: [1, 2, 3, 4, 5, 6].map((i) =>
							node("image", {
								src: "",
								alt: `Gallery image ${i}`,
								fit: "cover",
								aspectRatio: "4/3",
								borderRadius: "md",
							}),
						),
					},
				),
			],
		},
	);
}

// ── Stats ────────────────────────────────────────────────────────────

export function statsTemplate(): KivNode {
	const node = createNodeBuilder();
	const stats = [
		{ value: 10000, suffix: "+", label: "Active Users" },
		{ value: 99, suffix: "%", label: "Uptime" },
		{ value: 150, suffix: "+", label: "Countries" },
		{ value: 24, suffix: "/7", label: "Support" },
	];
	return node(
		"section",
		{ paddingY: "lg", background: "#0f172a" },
		{
			default: [
				node(
					"grid",
					{ columns: "4", gap: "lg" },
					{
						default: stats.map((s) =>
							node("stat", {
								value: s.value,
								suffix: s.suffix,
								label: s.label,
								align: "center",
								valueColor: { type: "solid", solid: "#ffffff", alpha: 1 },
							}),
						),
					},
				),
			],
		},
	);
}

// ── Cards ────────────────────────────────────────────────────────────

export function cardsTemplate(): KivNode {
	const node = createNodeBuilder();
	const items = [
		{
			title: "Starter Guide",
			desc: "Everything you need to get up and running.",
		},
		{
			title: "API Reference",
			desc: "Complete documentation for every endpoint.",
		},
		{
			title: "Best Practices",
			desc: "Patterns and tips from our engineering team.",
		},
	];
	return node(
		"section",
		{ paddingY: "lg" },
		{
			default: [
				node("heading", { level: "2", text: "Resources", align: "center" }),
				node("spacer", { height: "md" }),
				node(
					"grid",
					{ columns: "3", gap: "lg" },
					{
						default: items.map((it) =>
							node(
								"card",
								{ padding: "lg" },
								{
									default: [
										node("heading", { level: "3", text: it.title }),
										node("text", { text: it.desc }),
									],
								},
							),
						),
					},
				),
			],
		},
	);
}

// ── Comparison ───────────────────────────────────────────────────────

export function comparisonTemplate(): KivNode {
	const node = createNodeBuilder();
	return node(
		"section",
		{ paddingY: "lg" },
		{
			default: [
				node("heading", {
					level: "2",
					text: "Compare Plans",
					align: "center",
				}),
				node("spacer", { height: "md" }),
				node("table", {
					data: JSON.stringify({
						headers: ["Feature", "Starter", "Pro", "Enterprise"],
						rows: [
							["Projects", "5", "Unlimited", "Unlimited"],
							["Storage", "10GB", "100GB", "Unlimited"],
							["Support", "Email", "Priority", "Dedicated"],
							["SSO", "\u2014", "\u2014", "\u2713"],
						],
					}),
					striped: true,
					bordered: true,
				}),
			],
		},
	);
}

// ── Callout ──────────────────────────────────────────────────────────

export function calloutTemplate(): KivNode {
	const node = createNodeBuilder();
	return node(
		"card",
		{
			padding: "lg",
			background: {
				type: "solid",
				solid: "#eef2ff",
				alpha: 1,
			},
			borderWidth: 1,
			borderColor: "#c7d2fe",
		},
		{
			default: [
				node("icon", { icon: "info", iconSize: 24, iconColor: "#6366f1" }),
				node("heading", { level: "4", text: "Good to know" }),
				node("text", {
					text: "Add a short, high-visibility note here — a tip, warning, or announcement.",
				}),
			],
		},
	);
}

// ── Banner ───────────────────────────────────────────────────────────

export function bannerTemplate(): KivNode {
	const node = createNodeBuilder();
	return node(
		"section",
		{ paddingY: "sm", background: "#111827" },
		{
			default: [
				node(
					"stack",
					{ direction: "row", justify: "center", align: "center", gap: "sm" },
					{
						default: [
							node("icon", {
								icon: "megaphone",
								iconSize: 18,
								iconColor: "#ffffff",
							}),
							node("text", {
								text: "New: version 2.0 is here — faster, lighter, and more flexible.",
								color: "#ffffff",
							}),
							node("button", {
								label: "Learn more",
								variant: "ghost",
								size: "sm",
								textColor: "#ffffff",
							}),
						],
					},
				),
			],
		},
	);
}

// ── Header ───────────────────────────────────────────────────────────

export function headerTemplate(): KivNode {
	const node = createNodeBuilder();
	return node(
		"section",
		{ paddingY: "sm" },
		{
			default: [
				node(
					"stack",
					{ direction: "row", justify: "space-between", align: "center" },
					{
						default: [
							node("image", {
								src: "",
								alt: "Logo",
								fit: "contain",
								width: "120px",
							}),
							node(
								"stack",
								{ direction: "row", gap: "lg", align: "center" },
								{
									default: [
										node("link", { text: "Product", href: "#" }),
										node("link", { text: "Pricing", href: "#" }),
										node("link", { text: "Docs", href: "#" }),
									],
								},
							),
							node("button", {
								label: "Sign Up",
								variant: "primary",
								size: "sm",
							}),
						],
					},
				),
			],
		},
	);
}

// ── Timeline ─────────────────────────────────────────────────────────
// Reuses agenda/agenda-item — already renders a time-blocked, stripe-layout
// list, which is exactly a timeline's shape. No new node needed.

export function timelineTemplate(): KivNode {
	const node = createNodeBuilder();
	return node(
		"section",
		{ paddingY: "lg" },
		{
			default: [
				node("heading", { level: "2", text: "Our Journey", align: "center" }),
				node("spacer", { height: "md" }),
				node(
					"agenda",
					{ layout: "stripe", gap: "xs" },
					{
						default: [
							node("agenda-item", {
								time: "2021",
								label: "Founded",
								title: "The Beginning",
								description: "Started as a two-person side project.",
							}),
							node("agenda-item", {
								time: "2022",
								label: "Milestone",
								title: "First 1,000 Users",
								description: "Reached our first major user milestone.",
							}),
							node("agenda-item", {
								time: "2023",
								label: "Growth",
								title: "Series A",
								description: "Raised funding to accelerate growth.",
							}),
							node("agenda-item", {
								time: "2024",
								label: "Today",
								title: "Scaling Up",
								description: "Serving thousands of teams worldwide.",
							}),
						],
					},
				),
			],
		},
	);
}
