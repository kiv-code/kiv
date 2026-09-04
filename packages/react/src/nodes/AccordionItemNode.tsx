import { RADIUS, resolveShadow, SPACING } from "@kivcode/nodes";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { KivEditorModeContext } from "../editor-mode";
import type { KivNodeComponentProps } from "../node-props";
import { AccordionContext } from "./accordion-context";

export interface AccordionItemNodeProps extends KivNodeComponentProps {
	title?: string;
	defaultOpen?: boolean;
	disabled?: boolean;
	icon?: string;
	background?: string;
	titleColor?: string;
	borderRadius?: string;
	shadow?: string;
	shadowColor?: string;
	titleFontSize?: number;
	titleFontWeight?: string;
	padding?: string;
	bodyPadding?: string;
}

export function AccordionItemNode({
	title,
	defaultOpen,
	disabled,
	// Declared on the schema for parity with the Vue original, which never
	// reads it either — the icon actually shown is the accordion-level
	// icon/iconPosition/iconSize from AccordionContext, not a per-item one.
	icon: _icon,
	background,
	titleColor,
	borderRadius,
	shadow,
	shadowColor,
	titleFontSize = 0,
	titleFontWeight,
	padding,
	bodyPadding,
	slots,
	id,
	style,
	...rest
}: AccordionItemNodeProps) {
	const ctx = useContext(AccordionContext);
	const isEditorMode = useContext(KivEditorModeContext);

	// biome-ignore lint/correctness/useExhaustiveDependencies: register/unregister only ever run once per item, mirroring Vue's onMounted/onBeforeUnmount
	useEffect(() => {
		ctx?.register(id, defaultOpen === true);
		return () => ctx?.unregister(id);
	}, []);

	const isOpen = isEditorMode || (ctx ? ctx.isOpen(id) : defaultOpen === true);

	const bodyRef = useRef<HTMLDivElement | null>(null);
	// Stays mounted a little longer than `isOpen` on close, so the height
	// collapse below can finish before the content actually leaves the DOM —
	// what Vue's <Transition css="false"> + its own after-leave hook does.
	const [mounted, setMounted] = useState(isOpen);
	// Vue's <Transition> defaults to `appear: false` — no animation plays for
	// content that's already open on first mount. React has no equivalent
	// flag, so this ref suppresses just the very first enter animation.
	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isOpen) {
			setMounted(true);
			return;
		}
		const el = bodyRef.current;
		if (!el) {
			setMounted(false);
			return;
		}
		const inner = el.firstElementChild as HTMLElement | null;
		const h = inner?.scrollHeight ?? el.scrollHeight;
		el.style.transition = "height 0.25s ease";
		el.style.height = `${h}px`;
		el.style.overflow = "hidden";
		const raf = requestAnimationFrame(() => {
			el.style.height = "0px";
		});
		const onEnd = () => setMounted(false);
		el.addEventListener("transitionend", onEnd, { once: true });
		return () => {
			cancelAnimationFrame(raf);
			el.removeEventListener("transitionend", onEnd);
		};
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen || !mounted) return;
		if (isInitialMount.current) return;
		const el = bodyRef.current;
		const inner = el?.firstElementChild as HTMLElement | null;
		if (!el || !inner) return;
		const h = inner.scrollHeight;
		el.style.transition = "height 0.25s ease";
		el.style.height = "0px";
		el.style.overflow = "hidden";
		const raf = requestAnimationFrame(() => {
			el.style.height = `${h}px`;
		});
		const onEnd = () => {
			el.style.height = "";
			el.style.overflow = "";
			el.style.transition = "";
		};
		el.addEventListener("transitionend", onEnd, { once: true });
		return () => {
			cancelAnimationFrame(raf);
			el.removeEventListener("transitionend", onEnd);
		};
	}, [isOpen, mounted]);

	useEffect(() => {
		isInitialMount.current = false;
	}, []);

	const wrapStyle = useMemo(
		() => ({
			background:
				background && background !== "transparent" ? background : undefined,
			borderRadius: RADIUS[borderRadius ?? "sm"] ?? "4px",
			boxShadow: resolveShadow(shadow ?? "none", shadowColor || undefined),
			overflow: "hidden" as const,
			...style,
		}),
		[background, borderRadius, shadow, shadowColor, style],
	);

	const iconPosition = ctx?.iconPosition ?? "right";
	const headerStyle = useMemo(
		() => ({
			display: "flex" as const,
			alignItems: "center" as const,
			justifyContent: "space-between" as const,
			gap: "8px",
			padding: SPACING[padding ?? "md"] ?? "12px 16px",
			cursor: disabled ? "not-allowed" : "pointer",
			color: titleColor || undefined,
			fontWeight: Number(titleFontWeight ?? "600"),
			fontSize: titleFontSize > 0 ? `${titleFontSize}px` : undefined,
			opacity: disabled ? 0.5 : 1,
			flexDirection: (iconPosition === "left" ? "row-reverse" : "row") as
				| "row"
				| "row-reverse",
		}),
		[
			padding,
			disabled,
			titleColor,
			titleFontWeight,
			titleFontSize,
			iconPosition,
		],
	);

	const bodyPaddingStyle = useMemo(
		() => ({ padding: SPACING[bodyPadding ?? "md"] ?? "0 16px 16px" }),
		[bodyPadding],
	);

	const iconKind = ctx?.icon ?? "chevron";
	const iconSize = ctx?.iconSize ?? 12;

	function onToggle(): void {
		if (isEditorMode) return;
		ctx?.toggle(id, disabled);
	}

	return (
		<div id={id} style={wrapStyle} data-kiv-type="accordion-item" {...rest}>
			<button
				type="button"
				disabled={disabled}
				aria-expanded={isOpen}
				style={{
					font: "inherit",
					textAlign: "left",
					width: "100%",
					...headerStyle,
				}}
				onClick={onToggle}
			>
				<span>{title}</span>
				<span
					className="kiv-accordion-item__icon"
					style={{
						display: "inline-flex",
						transition: "transform 0.2s ease",
						transform: isOpen ? "rotate(180deg)" : undefined,
					}}
				>
					{iconKind === "chevron" ? (
						<svg
							width={iconSize}
							height={iconSize}
							viewBox="0 0 12 12"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M3 4.5l3 3 3-3"
								stroke="currentColor"
								strokeWidth={1.6}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					) : iconKind === "plus" ? (
						<svg
							width={iconSize}
							height={iconSize}
							viewBox="0 0 12 12"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M6 1v10M1 6h10"
								stroke="currentColor"
								strokeWidth={1.6}
								strokeLinecap="round"
							/>
						</svg>
					) : (
						<svg
							width={iconSize}
							height={iconSize}
							viewBox="0 0 12 12"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M1 6h9M6 2l4 4-4 4"
								stroke="currentColor"
								strokeWidth={1.6}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					)}
				</span>
			</button>
			{mounted && (
				<div ref={bodyRef} style={bodyPaddingStyle}>
					<div>{slots?.default}</div>
				</div>
			)}
		</div>
	);
}
