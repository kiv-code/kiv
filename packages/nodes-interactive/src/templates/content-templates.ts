import type { KivNode } from "@kiv/engine";

let counter = 0;
function uid(): string {
	return `tpl-${Date.now()}-${counter++}`;
}

function node(
	type: string,
	props: Record<string, unknown> = {},
	slots: Record<string, KivNode[]> = {},
): KivNode {
	return { id: uid(), type, props, slots };
}

// ── Hero ─────────────────────────────────────────────────────────────

export function heroTemplate(): KivNode {
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
					action: { type: "external", href: "#" },
				}),
			],
		},
	);
}

// ── Feature Grid ─────────────────────────────────────────────────────

export function featureGridTemplate(): KivNode {
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
										node("icon", { name: f.icon, size: "40px" }),
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
					color: "#6366f1",
				}),
			],
		},
	);
}

// ── Testimonial ──────────────────────────────────────────────────────

export function testimonialTemplate(): KivNode {
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
											height: "80px",
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
											height: "80px",
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
											height: "80px",
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
											height: "80px",
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
