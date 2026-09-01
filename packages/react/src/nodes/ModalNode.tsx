import {
	BUTTON_RADIUS,
	BUTTON_SIZE,
	BUTTON_VARIANT,
	resolveBackgroundPaint,
	resolveIcon,
	resolveSpacingStyle,
	SHADOW,
} from "@kivcode/nodes";
import {
	type KeyboardEvent,
	type MouseEvent,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { KivBusContext } from "../bus";
import { KivEditorModeContext } from "../editor-mode";
import type { KivNodeComponentProps } from "../node-props";

declare module "@kivcode/engine" {
	interface KivEventMap {
		"modal.opened": { nodeId?: string };
		"modal.closed": { nodeId?: string };
	}
}

// Matches the transition durations from the Vue original's scoped <style>
// (kiv-modal-fade/-zoom/-slide-up/-slide-down), used here to time how long
// the closing backdrop stays mounted before it's actually removed.
const ANIMATION_DURATION_MS: Record<string, number> = {
	fade: 150,
	zoom: 180,
	"slide-up": 180,
	"slide-down": 180,
	none: 0,
};

export interface ModalNodeProps extends KivNodeComponentProps {
	size?: string;
	contentPadding?: unknown;
	panelBackground?: string;
	panelRadius?: string;
	panelShadow?: string;
	closeOnOverlay?: boolean;
	closeOnEscape?: boolean;
	showCloseButton?: boolean;
	preventScroll?: boolean;
	animation?: string;
	overlayColor?: string;
	overlayBlur?: string;
	autoOpen?: boolean;
	openDelay?: number;
	openFrequency?: string;
	openTrigger?: string;
	scrollPercent?: number;
	timeOnPage?: number;
	showTrigger?: boolean;
	triggerLabel?: string;
	triggerTag?: string;
	triggerVariant?: string;
	triggerIcon?: string;
	triggerIconPosition?: string;
	triggerSize?: string;
	triggerRadius?: string;
	triggerPadding?: unknown;
	triggerMargin?: unknown;
	triggerBackground?: unknown;
	triggerTextColor?: string;
	triggerBorderColor?: string;
	triggerBorderWidth?: number;
	triggerShadow?: string;
	triggerFullWidth?: boolean;
	clickAction?: string;
	actionHref?: string;
	actionTarget?: string;
}

export function ModalNode({
	size,
	contentPadding,
	panelBackground,
	panelRadius,
	panelShadow,
	closeOnOverlay = true,
	closeOnEscape = true,
	showCloseButton = true,
	preventScroll = true,
	animation,
	overlayColor,
	overlayBlur,
	autoOpen,
	openDelay,
	openFrequency,
	openTrigger,
	scrollPercent,
	timeOnPage,
	showTrigger = true,
	triggerLabel,
	triggerTag,
	triggerVariant,
	triggerIcon,
	triggerIconPosition,
	triggerSize,
	triggerRadius,
	triggerPadding,
	triggerMargin,
	triggerBackground,
	triggerTextColor,
	triggerBorderColor,
	triggerBorderWidth,
	triggerShadow,
	triggerFullWidth,
	clickAction,
	actionHref,
	actionTarget,
	slots,
	id,
	style,
	...rest
}: ModalNodeProps) {
	const bus = useContext(KivBusContext);
	const isEditorMode = useContext(KivEditorModeContext);

	const [open, setOpen] = useState(false);
	// Whether the backdrop is actually in the DOM — stays true a bit longer
	// than `open` while it plays its leave transition (see the effect below).
	const [dialogMounted, setDialogMounted] = useState(false);
	// Whether the backdrop is in its "shown" visual state — flips a frame
	// after mount so the enter transition has something to animate from.
	const [entered, setEntered] = useState(false);
	const autoOpenFired = useRef(false);

	// createPortal(..., document.body) can't run during SSR (no `document`),
	// and rendering it on the very first client render risks a hydration
	// mismatch — so the portal only turns on once this "mounted on the
	// client" flag flips true in an effect, one tick after hydration.
	const [canPortal, setCanPortal] = useState(false);
	useEffect(() => setCanPortal(true), []);

	function openModal(): void {
		if (isEditorMode) return;
		setOpen(true);
		bus?.emit("modal.opened", { nodeId: id });
	}

	function closeModal(): void {
		setOpen((wasOpen) => {
			if (!wasOpen) return wasOpen;
			bus?.emit("modal.closed", { nodeId: id });
			return false;
		});
	}

	function onOverlayClick(e: MouseEvent<HTMLDivElement>): void {
		if (e.target !== e.currentTarget) return;
		if (closeOnOverlay !== false) closeModal();
	}

	function onKeydown(e: KeyboardEvent<HTMLDivElement>): void {
		if (e.key === "Escape" && closeOnEscape !== false) closeModal();
	}

	useEffect(() => {
		if (open) {
			setDialogMounted(true);
			return;
		}
		setDialogMounted((wasMounted) => {
			if (!wasMounted) return wasMounted;
			setEntered(false);
			return wasMounted;
		});
	}, [open]);

	useEffect(() => {
		if (!dialogMounted) return;
		if (!open) {
			const duration = ANIMATION_DURATION_MS[animation ?? "fade"] ?? 150;
			const timer = setTimeout(() => setDialogMounted(false), duration);
			return () => clearTimeout(timer);
		}
		const raf = requestAnimationFrame(() => setEntered(true));
		return () => cancelAnimationFrame(raf);
	}, [dialogMounted, open, animation]);

	useEffect(() => {
		if (typeof document === "undefined") return;
		if (open && preventScroll !== false) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
	}, [open, preventScroll]);
	useEffect(() => {
		return () => {
			if (typeof document !== "undefined") document.body.style.overflow = "";
		};
	}, []);

	// ── Frequency gating (sessionStorage / localStorage) ──
	function frequencyKey(): string | null {
		return `kiv-modal-${id}`;
	}
	function canOpenByFrequency(): boolean {
		const freq = openFrequency ?? "always";
		if (freq === "always") return true;
		const key = frequencyKey();
		if (!key) return true;
		if (freq === "once-session") return !sessionStorage.getItem(key);
		return !localStorage.getItem(key);
	}
	function markOpened(): void {
		const freq = openFrequency ?? "always";
		if (freq === "always") return;
		const key = frequencyKey();
		if (!key) return;
		if (freq === "once-session") sessionStorage.setItem(key, "1");
		else localStorage.setItem(key, "1");
	}

	// ── Auto-open logic ──
	// biome-ignore lint/correctness/useExhaustiveDependencies: mirrors Vue's onMounted + a dedicated autoOpen watcher — deliberately re-schedules on every field that affects scheduling
	useEffect(() => {
		if (!autoOpen || isEditorMode || autoOpenFired.current) return;
		if (!canOpenByFrequency()) return;

		const delay = openDelay ?? 1000;
		const trigger = openTrigger ?? "load";

		let timeHandler: ReturnType<typeof setTimeout> | null = null;
		let scrollHandler: (() => void) | null = null;
		let exitHandler: ((e: globalThis.MouseEvent) => void) | null = null;

		function fire(): void {
			openModal();
			markOpened();
			autoOpenFired.current = true;
		}

		if (trigger === "load") {
			timeHandler = setTimeout(fire, delay);
		} else if (trigger === "time") {
			timeHandler = setTimeout(fire, (timeOnPage ?? 10) * 1000);
		} else if (trigger === "scroll") {
			const threshold = (scrollPercent ?? 50) / 100;
			scrollHandler = () => {
				if (autoOpenFired.current) return;
				const scrolled =
					window.scrollY /
					(document.documentElement.scrollHeight - window.innerHeight);
				if (scrolled >= threshold) fire();
			};
			window.addEventListener("scroll", scrollHandler, { passive: true });
		} else if (trigger === "exit-intent") {
			exitHandler = (e: globalThis.MouseEvent) => {
				if (autoOpenFired.current) return;
				if (e.clientY <= 0) fire();
			};
			document.addEventListener("mouseleave", exitHandler);
		}

		return () => {
			if (timeHandler) clearTimeout(timeHandler);
			if (scrollHandler) window.removeEventListener("scroll", scrollHandler);
			if (exitHandler) document.removeEventListener("mouseleave", exitHandler);
		};
	}, [
		autoOpen,
		isEditorMode,
		openDelay,
		openTrigger,
		timeOnPage,
		scrollPercent,
		openFrequency,
	]);

	// ── Trigger rendering ──
	const resolvedTriggerTag =
		clickAction && clickAction !== "none" ? "a" : (triggerTag ?? "button");
	const wrapperHidden = showTrigger === false && !isEditorMode;
	const showEditorPlaceholder = isEditorMode && showTrigger === false;
	const autoOpenSummary = useMemo(() => {
		if (!autoOpen) return "";
		const trigger = openTrigger ?? "load";
		if (trigger === "load") return `after ${openDelay ?? 1000}ms on load`;
		if (trigger === "time") return `after ${timeOnPage ?? 10}s on page`;
		if (trigger === "scroll") return `at ${scrollPercent ?? 50}% scroll`;
		return "on exit intent";
	}, [autoOpen, openTrigger, openDelay, timeOnPage, scrollPercent]);

	const hasTriggerIcon = !!triggerIcon?.trim();
	const resolvedTriggerSvg = resolveIcon(triggerIcon ?? "");
	const triggerIconIsSvg =
		(triggerIcon?.trim().startsWith("<") ?? false) || !!resolvedTriggerSvg;
	const triggerIconContent =
		resolvedTriggerSvg ||
		(triggerIcon?.trim().startsWith("<") ? triggerIcon : "");
	const triggerIconClass = triggerIconIsSvg ? "" : (triggerIcon ?? "");
	const triggerIconOnRight = (triggerIconPosition ?? "left") === "right";

	const triggerBtnSize = BUTTON_SIZE[triggerSize ?? "md"] ?? BUTTON_SIZE.md;
	const triggerBtnRadius = BUTTON_RADIUS[triggerRadius ?? "md"] ?? "6px";
	const triggerCustomBg = resolveBackgroundPaint(triggerBackground);
	const triggerBtnShadow = SHADOW[triggerShadow ?? "none"] ?? "none";

	const triggerStyle = useMemo(() => {
		const variant = triggerVariant ?? "primary";
		const isCustom = variant === "custom" || !!triggerBackground;
		const v = isCustom
			? null
			: (BUTTON_VARIANT[variant] ?? BUTTON_VARIANT.primary);
		const sz = triggerBtnSize;
		const pad = resolveSpacingStyle("padding", triggerPadding, sz?.padding);
		const margin = resolveSpacingStyle("margin", triggerMargin, "0");
		const borderW = triggerBorderWidth ?? 0;

		const base: Record<string, string | number | undefined> = {
			...pad,
			...margin,
			display: "inline-flex",
			alignItems: "center",
			gap: "6px",
			fontSize: sz?.fontSize,
			fontWeight: "600",
			borderRadius: triggerBtnRadius,
			cursor: isEditorMode ? "default" : "pointer",
			boxShadow: triggerBtnShadow !== "none" ? triggerBtnShadow : undefined,
			transition:
				"background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
			textDecoration: resolvedTriggerTag === "a" ? "none" : undefined,
			width: triggerFullWidth ? "100%" : undefined,
			justifyContent: triggerFullWidth ? "center" : undefined,
		};

		if (isCustom) {
			base.background = triggerCustomBg;
			base.color = triggerTextColor || undefined;
			base.border =
				borderW > 0
					? `${borderW}px solid ${triggerBorderColor || "#e2e8f0"}`
					: "none";
		} else if (v) {
			base.background = v.background;
			base.color = v.color;
			base.border = v.border;
			if (v.textDecoration) base.textDecoration = v.textDecoration;
		}
		return base;
	}, [
		triggerVariant,
		triggerBackground,
		triggerBtnSize,
		triggerPadding,
		triggerMargin,
		triggerBorderWidth,
		triggerBtnRadius,
		isEditorMode,
		triggerBtnShadow,
		resolvedTriggerTag,
		triggerFullWidth,
		triggerCustomBg,
		triggerTextColor,
		triggerBorderColor,
	]);

	const panelStyle = useMemo(() => {
		const widths: Record<string, string> = {
			sm: "400px",
			md: "560px",
			lg: "760px",
			xl: "960px",
			full: "100vw",
			auto: "auto",
		};
		const radiusMap: Record<string, string> = {
			sm: "4px",
			md: "8px",
			lg: "12px",
			xl: "16px",
		};
		const sz = size ?? "md";
		const base: Record<string, string | number | undefined> = {
			position: "relative",
			maxWidth: "calc(100vw - 32px)",
			maxHeight: "calc(100vh - 32px)",
			overflow: "auto",
			width: widths[sz] ?? widths.md,
			height: sz === "full" ? "100vh" : undefined,
			borderRadius:
				sz === "full" ? "0" : (radiusMap[panelRadius ?? "md"] ?? "8px"),
			background: panelBackground || "#ffffff",
			boxShadow: SHADOW[panelShadow ?? "lg"],
			transition: animation === "none" ? undefined : "transform 0.18s ease",
		};
		if (animation === "zoom")
			base.transform = entered ? "scale(1)" : "scale(0.92)";
		else if (animation === "slide-up")
			base.transform = entered ? "translateY(0)" : "translateY(24px)";
		else if (animation === "slide-down")
			base.transform = entered ? "translateY(0)" : "translateY(-24px)";
		return base;
	}, [size, panelRadius, panelBackground, panelShadow, animation, entered]);

	const overlayStyle = useMemo(() => {
		const color = overlayColor || "#000000";
		const blur = overlayBlur ?? "none";
		const blurMap: Record<string, string> = {
			none: "0",
			sm: "4px",
			md: "8px",
			lg: "16px",
		};
		return {
			position: "fixed" as const,
			inset: 0,
			zIndex: 9998,
			display: "flex" as const,
			alignItems: "center" as const,
			justifyContent: "center" as const,
			background: `${color}8c`,
			backdropFilter:
				blurMap[blur] && blurMap[blur] !== "0"
					? `blur(${blurMap[blur]})`
					: undefined,
			transition: animation === "none" ? undefined : "opacity 0.15s ease",
			opacity: animation === "none" ? 1 : entered ? 1 : 0,
		};
	}, [overlayColor, overlayBlur, animation, entered]);

	const contentStyle = useMemo(
		() => resolveSpacingStyle("padding", contentPadding, "24px"),
		[contentPadding],
	);

	const iconEl = hasTriggerIcon ? (
		triggerIconIsSvg ? (
			<span
				className="kiv-modal__trigger-icon"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: resolved icon markup, same trust boundary as the Vue renderer's v-html
				dangerouslySetInnerHTML={{ __html: triggerIconContent }}
			/>
		) : (
			<i
				className={`kiv-modal__trigger-icon ${triggerIconClass}`}
				aria-hidden="true"
			/>
		)
	) : null;

	const triggerChildren = (
		<>
			{hasTriggerIcon && !triggerIconOnRight && iconEl}
			<span>{triggerLabel ?? "Open"}</span>
			{hasTriggerIcon && triggerIconOnRight && iconEl}
		</>
	);

	let trigger: ReactNode = null;
	if (showTrigger !== false) {
		if (resolvedTriggerTag === "button") {
			trigger = (
				<button
					type="button"
					style={triggerStyle}
					data-kiv-modal-trigger
					onClick={openModal}
				>
					{triggerChildren}
				</button>
			);
		} else if (resolvedTriggerTag === "a") {
			trigger = (
				<a
					href={actionHref}
					target={actionTarget}
					style={triggerStyle}
					data-kiv-modal-trigger
					onClick={(e) => {
						e.preventDefault();
						openModal();
					}}
				>
					{triggerChildren}
				</a>
			);
		} else {
			trigger = (
				<button
					type="button"
					style={{ font: "inherit", ...triggerStyle }}
					data-kiv-modal-trigger
					onClick={openModal}
				>
					{triggerChildren}
				</button>
			);
		}
	} else if (showEditorPlaceholder) {
		trigger = (
			<div
				className="kiv-modal__editor-placeholder"
				data-kiv-modal-trigger
				style={{
					display: "inline-flex",
					alignItems: "center",
					gap: "6px",
					padding: "6px 10px",
					border: "1px dashed #94a3b8",
					borderRadius: "6px",
					color: "#64748b",
					fontSize: "12px",
					whiteSpace: "nowrap",
				}}
			>
				<svg
					width="13"
					height="13"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth={2}
					aria-hidden="true"
				>
					<rect x="3" y="3" width="18" height="18" rx="2" />
					<path d="M9 9h6v6H9z" />
				</svg>
				<span>
					Modal (no trigger button)
					{autoOpenSummary ? ` — auto-opens ${autoOpenSummary}` : ""}
				</span>
			</div>
		);
	}

	const dialog = dialogMounted && (
		<div
			className="kiv-modal__backdrop"
			data-kiv-type="modal"
			role="dialog"
			aria-modal="true"
			style={overlayStyle}
			onClick={onOverlayClick}
			onKeyDown={onKeydown}
		>
			<div className="kiv-modal__panel" style={panelStyle}>
				{showCloseButton !== false && (
					<button
						type="button"
						className="kiv-modal__close"
						aria-label="Close"
						style={{
							position: "absolute",
							top: "10px",
							right: "10px",
							width: "26px",
							height: "26px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							border: "none",
							borderRadius: "6px",
							background: "rgba(15, 23, 42, 0.06)",
							color: "#0f172a",
							cursor: "pointer",
							zIndex: 1,
						}}
						onClick={closeModal}
					>
						<svg
							width="12"
							height="12"
							viewBox="0 0 12 12"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M1 1l10 10M11 1L1 11"
								stroke="currentColor"
								strokeWidth={1.6}
								strokeLinecap="round"
							/>
						</svg>
					</button>
				)}
				<div className="kiv-modal__content" style={contentStyle}>
					{slots?.default}
				</div>
			</div>
		</div>
	);

	return (
		<div
			id={id}
			className="kiv-modal"
			style={{ display: wrapperHidden ? "none" : "inline-block", ...style }}
			{...rest}
		>
			{trigger}
			{canPortal && dialog && createPortal(dialog, document.body)}
		</div>
	);
}
