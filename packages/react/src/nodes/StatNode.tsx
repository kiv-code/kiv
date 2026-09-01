import {
	formatStatValue,
	resolveTextPaintStyle,
	STAT_SIZE,
} from "@kivcode/nodes";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface StatNodeProps extends KivNodeComponentProps {
	value?: number;
	prefix?: string;
	suffix?: string;
	label?: string;
	decimals?: number;
	animateOnView?: boolean;
	animationDuration?: number;
	align?: string;
	valueColor?: unknown;
	size?: string;
}

export function StatNode({
	value,
	prefix,
	suffix,
	label,
	decimals,
	animateOnView = true,
	animationDuration,
	align,
	valueColor,
	size,
	id,
	style,
	...rest
}: StatNodeProps) {
	const rootRef = useRef<HTMLDivElement | null>(null);
	const hasAnimated = useRef(false);
	const [displayValue, setDisplayValue] = useState(0);

	// biome-ignore lint/correctness/useExhaustiveDependencies: mirrors the Vue original's onMounted-once behavior — the observer is set up once and only re-fires the count-up on visibility, not on every value/duration change
	useEffect(() => {
		if (!animateOnView || typeof IntersectionObserver === "undefined") {
			setDisplayValue(value ?? 0);
			return;
		}

		const target = value ?? 0;
		const duration = animationDuration ?? 1500;

		function animateTo(): void {
			const start = performance.now();
			function tick(nowMs: number) {
				const progress = Math.min(1, (nowMs - start) / Math.max(1, duration));
				setDisplayValue(target * progress);
				if (progress < 1) requestAnimationFrame(tick);
			}
			requestAnimationFrame(tick);
		}

		const observer = new IntersectionObserver((entries) => {
			if (entries[0]?.isIntersecting && !hasAnimated.current) {
				hasAnimated.current = true;
				animateTo();
				observer.disconnect();
			}
		});
		if (rootRef.current) observer.observe(rootRef.current);

		return () => observer.disconnect();
	}, [animateOnView]);

	// Editing `value` (e.g. live in the Inspector) after the count-up already
	// ran must still be reflected — otherwise the displayed number goes stale
	// forever, since the IntersectionObserver only ever fires once.
	useEffect(() => {
		if (!animateOnView || hasAnimated.current) {
			setDisplayValue(value ?? 0);
		}
	}, [value, animateOnView]);

	const formatted = formatStatValue(
		displayValue,
		decimals ?? 0,
		prefix ?? "",
		suffix ?? "",
	);

	const resolvedSize = STAT_SIZE[size ?? "xl"] ?? "56px";
	const valueStyle = useMemo(
		() => ({
			fontSize: resolvedSize,
			fontWeight: "800" as const,
			lineHeight: "1.1",
			...resolveTextPaintStyle(valueColor, "#0f172a"),
		}),
		[resolvedSize, valueColor],
	);
	const wrapperStyle = useMemo(
		() => ({
			display: "flex" as const,
			flexDirection: "column" as const,
			alignItems:
				align === "left"
					? ("flex-start" as const)
					: align === "right"
						? ("flex-end" as const)
						: ("center" as const),
			textAlign: (align ?? "center") as "left" | "center" | "right",
			...style,
		}),
		[align, style],
	);

	return (
		<div
			ref={rootRef}
			id={id}
			style={wrapperStyle}
			data-kiv-type="stat"
			{...rest}
		>
			<span style={valueStyle}>{formatted}</span>
			{label && (
				<span
					className="kiv-stat__label"
					style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}
				>
					{label}
				</span>
			)}
		</div>
	);
}
