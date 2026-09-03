import type { FieldDescriptor } from "@kivcode/engine";
import type { ChangeEvent } from "react";
import { useContext, useEffect, useState } from "react";
import { useContinuousEdit } from "../../composables/useContinuousEdit";
import { EditorStoreContext } from "../../store/context";

export interface SizeSliderControlProps {
	value?: string;
	/** Part of the common plugin-control contract; unused here (same as the Vue original, which never declared it either). */
	fieldKey?: string;
	descriptor?: FieldDescriptor;
	onChange: (value: string) => void;
}

const DEFAULT_UNITS = [
	{ unit: "%", min: 0, max: 100, step: 1 },
	{ unit: "px", min: 0, max: 1200, step: 1 },
];

const NUMERIC = /^(-?\d*\.?\d+)\s*([a-z%]*)$/i;

function parse(
	value: string | undefined,
	units: ReadonlyArray<{ unit: string }>,
): { amount: number; unit: string } {
	const raw = (value ?? "").trim();
	const match = raw.match(NUMERIC);
	const fallbackUnit = units[0]?.unit ?? "px";
	if (!match) return { amount: 0, unit: fallbackUnit };
	const amount = Number(match[1]);
	const unit = match[2] || fallbackUnit;
	return { amount: Number.isNaN(amount) ? 0 : amount, unit };
}

export function SizeSliderControl({
	value,
	fieldKey: _fieldKey,
	descriptor,
	onChange,
}: SizeSliderControlProps) {
	const store = useContext(EditorStoreContext);
	const { start, end } = useContinuousEdit(store);

	const units = descriptor?.sliderUnits ?? DEFAULT_UNITS;
	const allowAuto = descriptor?.allowAuto === true;
	const autoLabel = descriptor?.autoLabel ?? "auto";

	// A node instance may not have this prop set at all yet (created before the
	// field existed, or simply never touched) — falling back to the
	// descriptor's own default for DISPLAY purposes only avoids showing a
	// misleading "0" when the node is really rendering at its documented
	// default (e.g. width 100%).
	const displayValue = value ?? (descriptor?.default as string | undefined);

	const [activeUnit, setActiveUnit] = useState(
		() => parse(displayValue, units).unit,
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: only re-syncs `activeUnit` off `displayValue` changes (mirrors the Vue `watch(displayValue, ...)`) — including `activeUnit`/`units` here would re-run this effect every time the unit itself changes, defeating the point
	useEffect(() => {
		const parsed = parse(displayValue, units);
		if (parsed.unit !== activeUnit) setActiveUnit(parsed.unit);
	}, [displayValue]);

	const amount = parse(displayValue, units).amount;
	const unitConfig = units.find((u) => u.unit === activeUnit) ?? units[0];

	const raw = (displayValue ?? "").trim();
	/** Unset — the field contributes no declaration at all. */
	const isAuto = raw === "";
	/**
	 * A value the slider cannot represent: `calc(...)`, `clamp(...)`, or a unit
	 * the field wasn't configured with. Showing it as editable text is the
	 * honest option — the old control rendered it as `0`, and the first drag
	 * destroyed it.
	 */
	// A parseable number in a unit this field wasn't configured with would be
	// driven by the wrong slider range — dragging a `3rem` value on a 0–500px
	// range writes `250rem`. Editing it as text keeps it intact.
	const isCustom =
		!isAuto &&
		(!NUMERIC.test(raw) ||
			!units.some((u) => u.unit === parse(raw, units).unit));

	function commit(nextAmount: number, unit: string) {
		onChange(`${nextAmount}${unit}`);
	}

	function onSlider(e: ChangeEvent<HTMLInputElement>) {
		start();
		commit(Number(e.target.value), activeUnit);
	}
	function onNumber(e: ChangeEvent<HTMLInputElement>) {
		const v = Number(e.target.value);
		if (!Number.isNaN(v)) commit(v, activeUnit);
	}
	function switchUnit(unit: string) {
		setActiveUnit(unit);
		// Coming back from auto/custom there is no number yet — seed from the
		// unit's own minimum rather than writing NaN.
		const next = isAuto || isCustom ? (unitConfig?.min ?? 0) : amount;
		commit(next, unit);
	}

	return (
		<div className="kiv-size-slider">
			{(units.length > 1 || allowAuto) && (
				<div className="kiv-size-slider__units">
					{units.map((u) => (
						<button
							key={u.unit}
							type="button"
							className={`kiv-size-slider__unit${!isAuto && !isCustom && u.unit === activeUnit ? " kiv-size-slider__unit--active" : ""}`}
							onClick={() => switchUnit(u.unit)}
						>
							{u.unit}
						</button>
					))}
					{allowAuto && (
						<button
							type="button"
							className={`kiv-size-slider__unit${isAuto ? " kiv-size-slider__unit--active" : ""}`}
							onClick={() => onChange("")}
						>
							{autoLabel}
						</button>
					)}
				</div>
			)}

			{/* Unset: nothing to drag, and saying so beats showing a fake 0. */}
			{isAuto ? (
				<p className="kiv-size-slider__auto">
					Not set — inherits from the layout.
				</p>
			) : isCustom ? (
				/* calc(), clamp(), or a unit this field wasn't configured with. */
				<input
					type="text"
					className="kiv-input"
					value={raw}
					onChange={(e) => onChange(e.target.value)}
				/>
			) : (
				<div className="kiv-size-slider__row">
					<input
						type="range"
						className="kiv-size-slider__range"
						min={unitConfig?.min ?? 0}
						max={unitConfig?.max ?? 100}
						step={unitConfig?.step ?? 1}
						value={amount}
						onChange={onSlider}
						// React's onChange for a range input fires on every drag tick
						// (mapped from the native 'input' event) — there's no separate
						// native 'change' event exposed the way Vue's template
						// `@change="end"` listens for on release, so use pointerup/blur
						// as the drag-end signal that collapses the gesture into one
						// undo step.
						onPointerUp={end}
						onBlur={end}
					/>
					<div className="kiv-size-slider__value">
						<input
							type="number"
							className="kiv-size-slider__number"
							value={amount}
							onChange={onNumber}
						/>
						<span className="kiv-size-slider__unit-label">{activeUnit}</span>
					</div>
				</div>
			)}
		</div>
	);
}
