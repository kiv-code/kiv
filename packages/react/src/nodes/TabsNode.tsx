import {
	BUTTON_RADIUS,
	hoverEffectClass,
	resolveBackgroundPaint,
	resolveIcon,
	resolveSolidColor,
	resolveSpacingStyle,
	SHADOW,
} from "@kivcode/nodes";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { KivBusContext } from "../bus";
import type { KivNodeComponentProps } from "../node-props";
import {
	type TabPanelMeta,
	TabsContext,
	type TabsContextValue,
} from "./tabs-context";

declare module "@kivcode/engine" {
	interface KivEventMap {
		"tabs.tabChanged": {
			nodeId?: string;
			currentIndex: number;
			currentTitle: string;
		};
	}
}

const FONT_SIZES: Record<string, string> = {
	xs: "0.75rem",
	sm: "0.85rem",
	md: "1rem",
	lg: "1.25rem",
};

export interface TabsNodeProps extends KivNodeComponentProps {
	defaultTab?: number;
	orientation?: string;
	position?: string;
	columns?: string;
	tabVariant?: string;
	activeColor?: unknown;
	inactiveColor?: string;
	activeTextColor?: string;
	inactiveTextColor?: string;
	tabRadius?: string;
	tabFontSize?: string;
	tabFontWeight?: string;
	activeTabFontWeight?: string;
	tabPadding?: unknown;
	tabGap?: string;
	contentGap?: string;
	hoverEffect?: string;
	tabShadow?: string;
	activeShadow?: string;
	tabBorder?: boolean;
	tabBorderColor?: string;
	contentBackground?: string;
	contentPadding?: unknown;
	contentBorderRadius?: string;
	animation?: string;
	stretch?: boolean;
	fullWidth?: boolean;
}

export function TabsNode({
	defaultTab,
	orientation,
	position: _position,
	columns,
	tabVariant,
	activeColor,
	inactiveColor,
	activeTextColor: _activeTextColor,
	inactiveTextColor: _inactiveTextColor,
	tabRadius,
	tabFontSize,
	tabFontWeight,
	activeTabFontWeight,
	tabPadding,
	tabGap,
	contentGap,
	hoverEffect,
	tabShadow,
	activeShadow,
	tabBorder,
	tabBorderColor,
	contentBackground,
	contentPadding,
	contentBorderRadius,
	// Declared on the schema for parity with the Vue original, which never
	// reads it either (panel switching has no transition there — TabPanelNode
	// just toggles `display`).
	animation: _animation,
	stretch,
	fullWidth,
	slots,
	id,
	style,
	...rest
}: TabsNodeProps) {
	const bus = useContext(KivBusContext);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [panels, setPanels] = useState<TabPanelMeta[]>([]);
	// Mutated synchronously (unlike `panels` state, which only takes effect
	// on the next render) so register/setActive can always read the
	// up-to-date panel list — mirrors Vue's `panels` ref, which is
	// synchronously current the moment a child's onMounted registers it.
	const panelsRef = useRef<TabPanelMeta[]>([]);

	function setActive(panelId: string): void {
		const index = panelsRef.current.findIndex((p) => p.id === panelId);
		const panel = panelsRef.current[index];
		if (!panel || panel.disabled || activeId === panelId) return;
		setActiveId(panelId);
		bus?.emit("tabs.tabChanged", {
			nodeId: id,
			currentIndex: index,
			currentTitle: panel.title,
		});
	}

	function register(meta: TabPanelMeta): void {
		panelsRef.current = [...panelsRef.current, meta];
		setPanels(panelsRef.current);
	}

	function update(
		panelId: string,
		patch: Partial<Omit<TabPanelMeta, "id">>,
	): void {
		panelsRef.current = panelsRef.current.map((p) =>
			p.id === panelId ? { ...p, ...patch } : p,
		);
		setPanels(panelsRef.current);
	}

	function unregister(panelId: string): void {
		panelsRef.current = panelsRef.current.filter((p) => p.id !== panelId);
		setPanels(panelsRef.current);
		setActiveId((prev) => (prev === panelId ? null : prev));
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: runs once on mount, after every TabPanelNode child has registered (mirrors Vue's onMounted)
	useEffect(() => {
		if (activeId || panelsRef.current.length === 0) return;
		const idx = defaultTab ?? 0;
		const preferred = panelsRef.current[idx] ?? panelsRef.current[0];
		if (preferred) setActiveId(preferred.id);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: register/update/unregister/setActive close over panelsRef (always current) plus the already-listed activeId/id/bus — their own identity changing every render doesn't change their behavior, so omitting them avoids recomputing this object on every unrelated re-render
	const context: TabsContextValue = useMemo(
		() => ({
			activeId,
			setActive,
			register,
			update,
			unregister,
			panels,
			iconPosition: "right",
			icon: "chevron",
		}),
		[activeId, panels, id, bus],
	);

	const isVertical = orientation === "vertical";
	const columnCount = Number(columns ?? "1");

	const wrapStyle = useMemo(
		() => ({
			display: "flex" as const,
			flexDirection: (isVertical ? "row" : "column") as "row" | "column",
			gap: contentGap || "12px",
			...style,
		}),
		[isVertical, contentGap, style],
	);

	const tablistStyle = useMemo(() => {
		if (isVertical) {
			return {
				display: "grid" as const,
				gridTemplateColumns:
					columnCount > 1 ? `repeat(${columnCount}, 1fr)` : undefined,
				gap: tabGap || "4px",
			};
		}
		return {
			display: "flex" as const,
			flexDirection: "row" as const,
			gap: tabGap || "4px",
			flexWrap: "nowrap" as const,
			overflowX: "auto" as const,
			// The full scrollbar-hiding trick also needs a `::-webkit-scrollbar`
			// rule, which can't be expressed as an inline style — only the
			// standardized property is set here, so horizontal scroll still
			// works everywhere, just without the hidden-scrollbar polish on
			// WebKit unless a consumer's own stylesheet adds that rule for
			// `.kiv-tabs__tablist`.
			scrollbarWidth: "none" as const,
			borderBottom:
				tabVariant === "underline" ? "1px solid #e2e8f0" : undefined,
		};
	}, [isVertical, columnCount, tabGap, tabVariant]);

	const activeBg = resolveBackgroundPaint(activeColor, "#6366f1");
	const activeSolid = resolveSolidColor(activeColor, "#6366f1");
	const inactiveTabColor = inactiveColor ?? "#334155";
	const resolvedTabRadius = BUTTON_RADIUS[tabRadius ?? "full"] ?? "9999px";
	const resolvedTabFontSize = FONT_SIZES[tabFontSize ?? "sm"] ?? "0.85rem";
	const resolvedTabFontWeight = tabFontWeight ?? "500";
	const resolvedActiveFontWeight = activeTabFontWeight ?? "700";

	function tintHex(hex: string): string {
		return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}14` : "#6366f114";
	}

	const panelData = useMemo(
		() =>
			panels.map((p) => ({ ...p, _svg: p.icon ? resolveIcon(p.icon) : null })),
		[panels],
	);

	const tabPaddingStyle = useMemo(
		() =>
			resolveSpacingStyle("padding", tabPadding, {
				top: "8px",
				right: "14px",
				bottom: "8px",
				left: "14px",
			}),
		[tabPadding],
	);

	const tabHoverClass = hoverEffectClass(hoverEffect ?? "lift");

	const contentStyle = useMemo(() => {
		const bg = contentBackground || undefined;
		const pad = resolveSpacingStyle("padding", contentPadding, "0");
		const radius =
			contentBorderRadius && contentBorderRadius !== "none"
				? (BUTTON_RADIUS[contentBorderRadius] ?? "0")
				: undefined;
		return {
			background: bg,
			...pad,
			borderRadius: radius,
			flex: "1",
			minWidth: "0",
		};
	}, [contentBackground, contentPadding, contentBorderRadius]);

	function tabButtonStyle(
		panel: TabPanelMeta,
	): Record<string, string | number | undefined> {
		const isActive = panel.id === activeId;
		const shadows = [SHADOW[tabShadow ?? "none"]]
			.concat(isActive ? [SHADOW[activeShadow ?? "none"]] : [])
			.filter((s) => s && s !== "none");

		const overrideFontSize = panel.titleFontSize
			? (FONT_SIZES[panel.titleFontSize] ?? undefined)
			: undefined;
		const panelTitleColor = panel.titleColor || undefined;

		const base: Record<string, string | number | undefined> = {
			...tabPaddingStyle,
			flex: stretch || fullWidth ? "1" : undefined,
			flexShrink: stretch || fullWidth ? undefined : 0,
			whiteSpace: "nowrap",
			justifyContent: stretch || fullWidth ? "center" : undefined,
			border: "none",
			background: "transparent",
			cursor: panel.disabled ? "not-allowed" : "pointer",
			opacity: panel.disabled ? 0.5 : 1,
			fontWeight: isActive ? resolvedActiveFontWeight : resolvedTabFontWeight,
			fontSize: overrideFontSize || resolvedTabFontSize,
			gap: panel.icon ? "6px" : undefined,
			alignItems: "center",
			display: "inline-flex",
			boxShadow: shadows.length ? shadows.join(", ") : undefined,
			transition:
				"background 0.18s ease, color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
		};
		if (tabVariant === "pills") {
			base.borderRadius = resolvedTabRadius;
			base.background = isActive ? activeBg : "#eef1f8";
			base.backgroundOrigin = "border-box";
			base.color = panelTitleColor || (isActive ? "#fff" : inactiveTabColor);
			if (tabBorder) base.border = `1px solid ${tabBorderColor || "#e2e8f0"}`;
		} else if (tabVariant === "buttons") {
			base.borderRadius = resolvedTabRadius;
			base.background = isActive ? tintHex(activeSolid) : "transparent";
			base.border = isActive
				? `1px solid ${activeSolid}`
				: `1px solid ${tabBorderColor || "#e2e8f0"}`;
			base.color =
				panelTitleColor || (isActive ? activeSolid : inactiveTabColor);
		} else {
			base.borderBottom = isActive
				? `2px solid ${activeSolid}`
				: "2px solid transparent";
			base.color =
				panelTitleColor || (isActive ? activeSolid : inactiveTabColor);
			base.paddingBottom = "6px";
		}
		return base;
	}

	return (
		<TabsContext.Provider value={context}>
			<div id={id} style={wrapStyle} data-kiv-type="tabs" {...rest}>
				<div role="tablist" className="kiv-tabs__tablist" style={tablistStyle}>
					{panelData.map((panel) => (
						<button
							key={panel.id}
							type="button"
							role="tab"
							aria-selected={panel.id === activeId}
							disabled={panel.disabled}
							className={tabHoverClass}
							style={tabButtonStyle(panel)}
							onClick={() => setActive(panel.id)}
						>
							{panel._svg && (
								<span
									className="kiv-tab__icon"
									style={{
										fontSize: `${panel.iconSize ?? 16}px`,
										color: panel.iconColor || undefined,
									}}
									// biome-ignore lint/security/noDangerouslySetInnerHtml: resolved icon markup, same trust boundary as the Vue renderer's v-html
									dangerouslySetInnerHTML={{ __html: panel._svg }}
								/>
							)}
							<span>{panel.title}</span>
							{panel.badge && (
								<span
									style={{
										marginLeft: "6px",
										fontSize: "0.75em",
										color: panel.badgeColor || undefined,
									}}
								>
									{panel.badge}
								</span>
							)}
						</button>
					))}
				</div>
				<div className="kiv-tabs__panels" style={contentStyle}>
					{slots?.default}
				</div>
			</div>
		</TabsContext.Provider>
	);
}
