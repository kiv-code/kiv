import { RADIUS } from "@kivcode/nodes";
import {
	type CSSProperties,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { KivBusContext } from "../bus";
import { KivEditorModeContext } from "../editor-mode";
import type { KivNodeComponentProps } from "../node-props";

declare module "@kivcode/engine" {
	interface KivEventMap {
		"carousel.slideChanged": {
			nodeId?: string;
			currentIndex: number;
			previousIndex: number;
		};
	}
}

export interface CarouselNodeProps extends KivNodeComponentProps {
	autoplay?: boolean;
	autoplayInterval?: number;
	pauseOnHover?: boolean;
	loop?: boolean;
	animation?: string;
	animationDuration?: number;
	showArrows?: boolean;
	showDots?: boolean;
	showThumbnails?: boolean;
	aspectRatio?: string;
	borderRadius?: string;
}

export function CarouselNode({
	autoplay,
	autoplayInterval,
	pauseOnHover,
	loop,
	animation,
	animationDuration,
	showArrows,
	showDots,
	showThumbnails,
	aspectRatio,
	borderRadius,
	slots,
	id,
	style,
	...rest
}: CarouselNodeProps) {
	const bus = useContext(KivBusContext);
	const isEditorMode = useContext(KivEditorModeContext);
	const [currentIndex, setCurrentIndex] = useState(0);
	// Read inside the autoplay interval only — doesn't affect what's
	// rendered, so a ref (not state) avoids a re-render on every hover.
	const pausedRef = useRef(false);

	// Unlike the Vue original (which counts DOM children via a ref + an
	// onUpdated hook, because Vue slots don't come with a length up front),
	// KivNodeRenderer has already produced a concrete, ordered array for
	// `slots.default` before this component ever renders — its length IS
	// the slide count, no DOM introspection needed.
	const slideList = slots?.default ?? [];
	const slideCount = slideList.length;

	function goTo(index: number): void {
		if (slideCount === 0) return;
		const next = loop
			? ((index % slideCount) + slideCount) % slideCount
			: Math.max(0, Math.min(slideCount - 1, index));
		if (next === currentIndex) return;
		const previous = currentIndex;
		setCurrentIndex(next);
		bus?.emit("carousel.slideChanged", {
			nodeId: id,
			currentIndex: next,
			previousIndex: previous,
		});
	}
	function next(): void {
		goTo(currentIndex + 1);
	}
	function prev(): void {
		goTo(currentIndex - 1);
	}

	useEffect(() => {
		if (!autoplay || isEditorMode || slideCount <= 1) return;
		const interval = Math.max(500, autoplayInterval ?? 5000);
		const timer = setInterval(() => {
			if (pausedRef.current) return;
			// Needs the functional-update form: a `setInterval` closure only
			// ever sees the `currentIndex` that existed when the effect ran,
			// so `prev` here is the only reliably up-to-date value to advance
			// from — mirrors Vue's `next()`, which reads its ref synchronously.
			setCurrentIndex((prevIndex) => {
				const nextIndex = loop
					? (prevIndex + 1) % slideCount
					: Math.min(slideCount - 1, prevIndex + 1);
				if (nextIndex === prevIndex) return prevIndex;
				bus?.emit("carousel.slideChanged", {
					nodeId: id,
					currentIndex: nextIndex,
					previousIndex: prevIndex,
				});
				return nextIndex;
			});
		}, interval);
		return () => clearInterval(timer);
	}, [autoplay, autoplayInterval, slideCount, loop, isEditorMode, bus, id]);

	function onMouseEnter(): void {
		if (pauseOnHover) pausedRef.current = true;
	}
	function onMouseLeave(): void {
		pausedRef.current = false;
	}

	const isAbsoluteLayout = (animation ?? "slide") !== "slide";

	const viewportStyle = useMemo(
		() => ({
			position: "relative" as const,
			overflow: "hidden" as const,
			borderRadius: RADIUS[borderRadius ?? "lg"] ?? "16px",
			aspectRatio:
				aspectRatio && aspectRatio !== "auto" ? aspectRatio : undefined,
			...style,
		}),
		[borderRadius, aspectRatio, style],
	);

	const trackStyle = useMemo(() => {
		if (isAbsoluteLayout)
			return { position: "relative" as const, width: "100%", height: "100%" };
		return {
			display: "flex" as const,
			width: "100%",
			height: "100%",
			transform: `translateX(-${currentIndex * 100}%)`,
			transition: `transform ${animationDuration ?? 300}ms ease`,
		};
	}, [isAbsoluteLayout, currentIndex, animationDuration]);

	// Per-slide visibility (fade/none layouts): the Vue original applies
	// this imperatively to the track's DOM children because it doesn't have
	// an up-front slide array to map over. Here `slideList` already is that
	// array, so each slide is just wrapped with its own computed style.
	function slideWrapperStyle(index: number): CSSProperties {
		if (isAbsoluteLayout) {
			const noTransition = (animation ?? "fade") === "none";
			return {
				position: "absolute",
				inset: 0,
				transition: noTransition
					? undefined
					: `opacity ${animationDuration ?? 300}ms ease`,
				opacity: index === currentIndex ? 1 : 0,
				pointerEvents: index === currentIndex ? "auto" : "none",
			};
		}
		return { flex: "0 0 100%", minWidth: 0 };
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: pause-on-hover has no keyboard equivalent to offer — autoplay is a passive convenience, not a required interaction, and the arrow/dot/thumb buttons below remain fully keyboard-operable regardless of hover state
		<div
			id={id}
			style={viewportStyle}
			data-kiv-type="carousel"
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			{...rest}
		>
			<div className="kiv-carousel__track" style={trackStyle}>
				{slideList.map((slide, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: slide order is stable per render; the slide element itself already carries its own node id as key
					<div key={index} style={slideWrapperStyle(index)}>
						{slide}
					</div>
				))}
			</div>

			{showArrows && slideCount > 1 && (
				<>
					<button
						type="button"
						className="kiv-carousel__arrow kiv-carousel__arrow--prev"
						aria-label="Previous slide"
						style={{
							position: "absolute",
							top: "50%",
							left: "10px",
							transform: "translateY(-50%)",
							width: "30px",
							height: "30px",
							border: "none",
							borderRadius: "9999px",
							background: "rgba(15, 23, 42, 0.55)",
							color: "#fff",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer",
							zIndex: 2,
						}}
						onClick={prev}
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 14 14"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M9 2 4 7l5 5"
								stroke="currentColor"
								strokeWidth={1.8}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</button>
					<button
						type="button"
						className="kiv-carousel__arrow kiv-carousel__arrow--next"
						aria-label="Next slide"
						style={{
							position: "absolute",
							top: "50%",
							right: "10px",
							transform: "translateY(-50%)",
							width: "30px",
							height: "30px",
							border: "none",
							borderRadius: "9999px",
							background: "rgba(15, 23, 42, 0.55)",
							color: "#fff",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer",
							zIndex: 2,
						}}
						onClick={next}
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 14 14"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M5 2l5 5-5 5"
								stroke="currentColor"
								strokeWidth={1.8}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</button>
				</>
			)}

			{showDots && slideCount > 1 && (
				<div
					className="kiv-carousel__dots"
					style={{
						position: "absolute",
						bottom: "10px",
						left: 0,
						right: 0,
						display: "flex",
						justifyContent: "center",
						gap: "6px",
						zIndex: 2,
					}}
				>
					{slideList.map((_, index) => (
						<button
							// biome-ignore lint/suspicious/noArrayIndexKey: dot order mirrors the fixed slide order
							key={index}
							type="button"
							className={`kiv-carousel__dot${index === currentIndex ? " kiv-carousel__dot--active" : ""}`}
							aria-label={`Go to slide ${index + 1}`}
							style={{
								width: "8px",
								height: "8px",
								borderRadius: "9999px",
								border: "none",
								background:
									index === currentIndex ? "#fff" : "rgba(255, 255, 255, 0.5)",
								cursor: "pointer",
								padding: 0,
							}}
							onClick={() => goTo(index)}
						/>
					))}
				</div>
			)}

			{showThumbnails && slideCount > 1 && (
				<div
					className="kiv-carousel__thumbs"
					style={{
						position: "absolute",
						bottom: "10px",
						left: 0,
						right: 0,
						display: "flex",
						justifyContent: "center",
						gap: "6px",
						zIndex: 2,
					}}
				>
					{slideList.map((_, index) => (
						<button
							// biome-ignore lint/suspicious/noArrayIndexKey: thumbnail order mirrors the fixed slide order
							key={index}
							type="button"
							className={`kiv-carousel__thumb${index === currentIndex ? " kiv-carousel__thumb--active" : ""}`}
							style={{
								minWidth: "22px",
								height: "22px",
								padding: "0 4px",
								borderRadius: "4px",
								border:
									index === currentIndex
										? "1px solid #6366f1"
										: "1px solid rgba(255, 255, 255, 0.6)",
								background:
									index === currentIndex ? "#6366f1" : "rgba(15, 23, 42, 0.55)",
								color: "#fff",
								fontSize: "0.65rem",
								cursor: "pointer",
							}}
							onClick={() => goTo(index)}
						>
							{index + 1}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
