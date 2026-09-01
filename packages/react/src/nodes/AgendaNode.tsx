import { GAP, RADIUS } from "@kivcode/nodes";
import { type CSSProperties, createContext, useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

/**
 * The Vue original has no dedicated context for this — AgendaItemNode reads
 * its ancestor Agenda's layout by querying the DOM for a
 * `--kiv-agenda-layout` custom property via `getComputedStyle`, falling back
 * to "stripe" when no Agenda ancestor exists at all (an item dropped
 * straight into a Container/Stack/Tab Panel). There's no DOM to query
 * before hydration in React, so this small context replaces that lookup —
 * same "stripe" fallback (the context's default value) when there's no
 * Provider above.
 */
export const AgendaLayoutContext = createContext<string>("stripe");

export interface AgendaNodeProps extends KivNodeComponentProps {
	disclaimer?: string;
	layout?: string;
	columns?: string;
	gap?: string;
	stripeWidth?: string;
	itemRadius?: string;
	bodyBackground?: string;
	showTimelineLine?: boolean;
	// Declared on the schema for parity with the Vue original, which never
	// reads it either (no timeline connector line is actually rendered there).
	timelineLineColor?: string;
}

export function AgendaNode({
	disclaimer,
	layout,
	columns,
	gap,
	stripeWidth,
	itemRadius,
	bodyBackground,
	showTimelineLine,
	timelineLineColor: _timelineLineColor,
	slots,
	id,
	style,
	...rest
}: AgendaNodeProps) {
	const resolvedLayout = layout ?? "stripe";

	const listStyle = useMemo(() => {
		const base: Record<string, string | number | undefined> = {
			display: "flex",
			flexDirection: "column",
			gap: GAP[gap ?? "xs"] ?? "4px",
			"--kiv-agenda-stripe-width": stripeWidth || "150px",
			"--kiv-agenda-item-radius": RADIUS[itemRadius ?? "md"] ?? "8px",
			"--kiv-agenda-body-bg": bodyBackground || "#eceefb",
		};
		if (resolvedLayout === "card" && Number(columns ?? "1") > 1) {
			base.display = "grid";
			base.gridTemplateColumns = `repeat(${columns}, 1fr)`;
			base.flexDirection = undefined;
		}
		if (resolvedLayout === "timeline") {
			base.position = "relative";
			if (showTimelineLine !== false) base.paddingLeft = "24px";
		}
		return base as CSSProperties;
	}, [
		gap,
		resolvedLayout,
		columns,
		showTimelineLine,
		stripeWidth,
		itemRadius,
		bodyBackground,
	]);

	return (
		<div id={id} data-kiv-type="agenda" style={style} {...rest}>
			{disclaimer && (
				<p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px" }}>
					{disclaimer}
				</p>
			)}
			<AgendaLayoutContext.Provider value={resolvedLayout}>
				<div style={listStyle}>{slots?.default}</div>
			</AgendaLayoutContext.Provider>
		</div>
	);
}
