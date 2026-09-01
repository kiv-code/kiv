import type { ReactNode } from "react";

// Line-style SVG icons per node type — visually consistent (24x24 grid, 2px stroke).
// Used in the palette modal and the structure tree.

export interface NodeIconProps {
	type: string;
	size?: number;
}

const ICON_BODIES: Record<string, ReactNode> = {
	// Page: document
	page: (
		<>
			<path d="M6 2h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" />
			<path d="M14 2v4h4" />
		</>
	),
	// Section: full-width band
	section: (
		<>
			<rect x="3" y="5" width="18" height="14" rx="2" />
			<path d="M3 10h18" />
		</>
	),
	// Container: centered box with side margins
	container: (
		<>
			<rect x="6" y="4" width="12" height="16" rx="1.5" />
			<path d="M3 4v16M21 4v16" opacity="0.45" />
		</>
	),
	// Grid: 2x2 cells
	grid: (
		<>
			<rect x="3" y="3" width="8" height="8" rx="1" />
			<rect x="13" y="3" width="8" height="8" rx="1" />
			<rect x="3" y="13" width="8" height="8" rx="1" />
			<rect x="13" y="13" width="8" height="8" rx="1" />
		</>
	),
	// Column: single vertical slot
	column: <rect x="9" y="3" width="6" height="18" rx="1.5" />,
	// Group (stack): stacked bars
	stack: (
		<>
			<rect x="4" y="4" width="16" height="4" rx="1.5" />
			<rect x="4" y="10" width="16" height="4" rx="1.5" />
			<rect x="4" y="16" width="16" height="4" rx="1.5" />
		</>
	),
	// Heading: big H
	heading: <path d="M6 4v16M18 4v16M6 12h12" />,
	// Text: paragraph lines
	text: <path d="M4 6h16M4 11h16M4 16h10" />,
	// Button: rounded pill with a dot
	button: (
		<>
			<rect x="3" y="8" width="18" height="8" rx="4" />
			<path d="M8 12h6" opacity="0.6" />
		</>
	),
	// Image: framed picture
	image: (
		<>
			<rect x="3" y="4" width="18" height="16" rx="2" />
			<circle cx="8.5" cy="9" r="1.5" />
			<path d="m21 16-5-5L5 20" />
		</>
	),
	// Rich Text: text with bold/italic markers
	"rich-text": (
		<>
			<path d="M4 6h16M4 11h16M4 16h10" />
			<path d="M13 16l8 6M21 16l-8 6" strokeWidth="1.4" opacity="0.5" />
		</>
	),
	// Link: chain / anchor
	link: (
		<>
			<path d="M10 14a4 4 0 0 0 5.66 0l4-4a4 4 0 0 0-5.66-5.66l-1.5 1.5" />
			<path d="M14 10a4 4 0 0 0-5.66 0l-4 4a4 4 0 1 0 5.66 5.66l1.5-1.5" />
		</>
	),
	// Video: play triangle
	video: (
		<>
			<rect x="3" y="4" width="18" height="16" rx="2" />
			<polygon points="10,8 17,12 10,16" fill="currentColor" stroke="none" />
		</>
	),
	// Icon: star
	icon: (
		<polygon points="12,2 15,9 22,9 16.5,14 18.5,22 12,17.5 5.5,22 7.5,14 2,9 9,9" />
	),
	// Divider: horizontal line
	divider: (
		<>
			<line x1="4" y1="12" x2="20" y2="12" />
			<circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
		</>
	),
	// Spacer: dashed vertical gap between arrows
	spacer: (
		<>
			<path d="M12 3v6M12 15v6" />
			<path d="m9 6 3-3 3 3M9 18l3 3 3-3" />
			<line
				x1="4"
				y1="12"
				x2="20"
				y2="12"
				strokeDasharray="2 2"
				opacity="0.6"
			/>
		</>
	),
	// Form: clipboard with input lines and a submit bar
	form: (
		<>
			<rect x="4" y="3" width="16" height="18" rx="2" />
			<path d="M8 8h8M8 12h8" />
			<rect
				x="7"
				y="15.5"
				width="10"
				height="3"
				rx="1"
				fill="currentColor"
				stroke="none"
				opacity="0.6"
			/>
		</>
	),
	// Form Field: a single labeled input box
	"form-field": (
		<>
			<path d="M4 7h9" />
			<rect x="4" y="11" width="16" height="7" rx="1.5" />
		</>
	),
	// Testimonial: quote marks
	testimonial: (
		<>
			<path d="M7 8a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3" />
			<path d="M17 8a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3" />
		</>
	),
	// Card: rounded rect with inner content lines
	card: (
		<>
			<rect x="3" y="4" width="18" height="16" rx="2.5" />
			<path d="M7 9h10M7 13h6" opacity="0.6" />
		</>
	),
	// Countdown: clock with ticking hand
	countdown: (
		<>
			<circle cx="12" cy="13" r="8" />
			<path d="M12 9v4l3 2" />
			<path d="M9 2h6" />
		</>
	),
	// Stat: rising bars with a trend line
	stat: (
		<>
			<path d="M4 20V13M10 20V9M16 20v-7M20 20V6" />
			<path d="M4 10l6-5 6 3 4-5" opacity="0.6" />
		</>
	),
	// Social icons: connected nodes
	"social-icons": (
		<>
			<circle cx="6" cy="7" r="2.5" />
			<circle cx="6" cy="17" r="2.5" />
			<circle cx="17" cy="12" r="2.5" />
			<path d="M8.2 8.2 14.8 11M8.2 15.8 14.8 13" />
		</>
	),
	// Custom embed: code brackets
	embed: <path d="M8 5 3 12l5 7M16 5l5 7-5 7" />,
	// Table: grid with header row
	table: (
		<>
			<rect x="3" y="4" width="18" height="16" rx="1.5" />
			<path d="M3 9h18M9 9v11" opacity="0.6" />
		</>
	),
	// Carousel: framed slide with side arrows
	carousel: (
		<>
			<rect x="6" y="4" width="12" height="16" rx="1.5" />
			<path d="M2 12h2M20 12h2" />
			<path d="m3 10 -1.5 2 1.5 2M21 10l1.5 2-1.5 2" />
		</>
	),
	// Accordion / Accordion Item: stacked collapsible rows
	accordion: (
		<>
			<rect x="3" y="4" width="18" height="5" rx="1" />
			<rect x="3" y="11" width="18" height="5" rx="1" opacity="0.45" />
			<path d="M17 6.5l1.5 1.5 1.5-1.5" />
		</>
	),
	"accordion-item": (
		<>
			<rect x="3" y="4" width="18" height="5" rx="1" />
			<rect x="3" y="11" width="18" height="5" rx="1" opacity="0.45" />
			<path d="M17 6.5l1.5 1.5 1.5-1.5" />
		</>
	),
	// Tabs / Tab Panel: tab strip over a panel
	tabs: (
		<>
			<path d="M3 8h6v-3h6v3h6" />
			<rect x="3" y="8" width="18" height="12" rx="1.5" />
		</>
	),
	"tab-panel": (
		<>
			<path d="M3 8h6v-3h6v3h6" />
			<rect x="3" y="8" width="18" height="12" rx="1.5" />
		</>
	),
	// Modal: centered dialog over a dimmed backdrop
	modal: (
		<>
			<rect x="2" y="2" width="20" height="20" rx="2" opacity="0.35" />
			<rect
				x="6"
				y="8"
				width="12"
				height="8"
				rx="1.5"
				fill="currentColor"
				stroke="none"
				opacity="0.15"
			/>
			<rect x="6" y="8" width="12" height="8" rx="1.5" />
		</>
	),
};

// Fallback: diamond
const FALLBACK_ICON = <path d="M12 3l9 9-9 9-9-9 9-9Z" />;

export function NodeIcon({ type, size }: NodeIconProps) {
	const body = ICON_BODIES[type] ?? FALLBACK_ICON;
	const dimension = size ?? 18;
	return (
		<svg
			width={dimension}
			height={dimension}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="kiv-node-icon"
			aria-hidden="true"
		>
			{body}
		</svg>
	);
}
