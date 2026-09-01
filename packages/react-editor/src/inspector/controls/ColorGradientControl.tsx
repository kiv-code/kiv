import type { FieldDescriptor } from "@kivcode/engine";
import type { ColorOrGradientValue } from "@kivcode/nodes";
import {
	normalizeColorOrGradient,
	resolveBackgroundPaint,
} from "@kivcode/nodes";
import { useContext, useMemo } from "react";
import { useContinuousEdit } from "../../composables/useContinuousEdit";
import { EditorStoreContext } from "../../store/context";

export interface ColorGradientControlProps {
	value?: unknown;
	/** Part of the common plugin-control contract; unused here (same as the Vue original, which never declared it either). */
	fieldKey?: string;
	descriptor?: FieldDescriptor;
	onChange: (value: Record<string, unknown>) => void;
}

const GRADIENT_STOPS = [
	{ key: "from", alphaKey: "fromAlpha", label: "From", optional: false },
	{ key: "middle", alphaKey: "middleAlpha", label: "Middle", optional: true },
	{ key: "to", alphaKey: "toAlpha", label: "To", optional: false },
] as const;

// The native <input type="color"> only accepts a complete "#rrggbb" value —
// while the user is mid-typing in the paired text field (e.g. just "#" or
// "#ff"), passing that partial string through logs a benign but noisy
// console warning ("does not conform to the required format"). `||` alone
// doesn't catch this since a partial string is still truthy.
function safeHex(v: string | undefined, fallback: string): string {
	return v && /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
}

export function ColorGradientControl({
	value,
	fieldKey: _fieldKey,
	descriptor: _descriptor,
	onChange,
}: ColorGradientControlProps) {
	const store = useContext(EditorStoreContext);
	const { start, end } = useContinuousEdit(store);

	// Handles legacy plain-string values (pre-dating this field type) safely —
	// never spread `value` directly, since spreading a STRING iterates its
	// characters as array indices and corrupts the object (see
	// normalizeColorOrGradient's doc comment in @kivcode/nodes).
	const normalized = useMemo(() => normalizeColorOrGradient(value), [value]);

	function patch(partial: Partial<ColorOrGradientValue>) {
		start();
		onChange({ ...normalized, ...partial });
	}

	// Dragging the opacity slider on an "inherit" (empty) solid color has
	// nothing to apply alpha to — the swatch shows a black fallback purely so
	// the native <input type="color"> has something to render, but the
	// underlying value is still empty. Committing that fallback here turns the
	// slider into a real color the moment the user touches it, instead of
	// silently doing nothing.
	function setSolidAlpha(alpha: number) {
		patch({ alpha, solid: normalized.solid || "#000000" });
	}

	function setStopColor(key: "from" | "middle" | "to", color: string) {
		patch({ [key]: color });
	}

	function setStopAlpha(
		alphaKey: "fromAlpha" | "middleAlpha" | "toAlpha",
		alpha: number,
	) {
		patch({ [alphaKey]: alpha });
	}

	const previewBackground = resolveBackgroundPaint(normalized, "transparent");

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: pointerup/blur delegation only, to detect "gesture committed" — every actual control inside (buttons, sliders, inputs) is independently keyboard-operable
		<div
			className="kiv-color-gradient"
			// React's onChange for range/color inputs fires on every drag tick
			// (mapped from the native 'input' event) rather than exposing a
			// separate native 'change' the way Vue's template `@change="end"`
			// delegates from this container — pointerup/blur bubbling up from any
			// child input are the closest equivalent "gesture committed" signals.
			onPointerUp={end}
			onBlur={end}
		>
			<div className="kiv-color-gradient__tabs">
				<button
					type="button"
					className={`kiv-color-gradient__tab${normalized.type === "solid" ? " kiv-color-gradient__tab--active" : ""}`}
					onClick={() => patch({ type: "solid" })}
				>
					Solid
				</button>
				<button
					type="button"
					className={`kiv-color-gradient__tab${normalized.type === "gradient" ? " kiv-color-gradient__tab--active" : ""}`}
					onClick={() => patch({ type: "gradient" })}
				>
					Gradient
				</button>
			</div>

			<div
				className="kiv-color-gradient__preview"
				style={{ background: previewBackground }}
			/>

			{normalized.type === "solid" ? (
				<>
					<div className="kiv-color-gradient__row">
						<input
							type="color"
							className="kiv-color-gradient__swatch"
							value={safeHex(normalized.solid, "#000000")}
							onChange={(e) => patch({ solid: e.target.value })}
						/>
						<input
							type="text"
							className="kiv-input kiv-color-gradient__text"
							value={normalized.solid}
							placeholder="inherit"
							onChange={(e) => patch({ solid: e.target.value })}
						/>
					</div>
					<div className="kiv-color-gradient__row">
						<span className="kiv-color-gradient__label">Opacity</span>
						<input
							type="range"
							min={0}
							max={1}
							step={0.01}
							className="kiv-color-gradient__angle"
							value={normalized.alpha}
							onChange={(e) => setSolidAlpha(Number(e.target.value))}
						/>
						<span className="kiv-color-gradient__angle-value">
							{Math.round(normalized.alpha * 100)}%
						</span>
					</div>
				</>
			) : (
				<>
					{GRADIENT_STOPS.map((stop) => (
						<div key={stop.key} className="kiv-color-gradient__stop">
							<div className="kiv-color-gradient__row">
								<span className="kiv-color-gradient__label">{stop.label}</span>
								<input
									type="color"
									className="kiv-color-gradient__swatch"
									value={safeHex(
										normalized[stop.key],
										stop.optional ? "#ffffff" : "#000000",
									)}
									onChange={(e) => setStopColor(stop.key, e.target.value)}
								/>
								<input
									type="text"
									className="kiv-input kiv-color-gradient__text"
									value={normalized[stop.key]}
									placeholder={stop.optional ? "none" : ""}
									onChange={(e) => setStopColor(stop.key, e.target.value)}
								/>
							</div>
							{(!stop.optional || normalized[stop.key]) && (
								<div className="kiv-color-gradient__row kiv-color-gradient__row--sub">
									<span className="kiv-color-gradient__label">Opacity</span>
									<input
										type="range"
										min={0}
										max={1}
										step={0.01}
										className="kiv-color-gradient__angle"
										value={normalized[stop.alphaKey]}
										onChange={(e) =>
											setStopAlpha(stop.alphaKey, Number(e.target.value))
										}
									/>
									<span className="kiv-color-gradient__angle-value">
										{Math.round(normalized[stop.alphaKey] * 100)}%
									</span>
								</div>
							)}
						</div>
					))}
					<div className="kiv-color-gradient__row">
						<span className="kiv-color-gradient__label">Angle</span>
						<input
							type="range"
							min={0}
							max={360}
							step={1}
							className="kiv-color-gradient__angle"
							value={normalized.angle}
							onChange={(e) => patch({ angle: Number(e.target.value) })}
						/>
						<span className="kiv-color-gradient__angle-value">
							{normalized.angle}°
						</span>
					</div>
				</>
			)}
		</div>
	);
}
