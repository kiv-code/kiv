import type { FieldDescriptor } from "@kivcode/engine";
import type { SpacingBoxValue } from "@kivcode/nodes";
import { normalizeSpacingBox } from "@kivcode/nodes";
import { useMemo, useState } from "react";

export interface SpacingBoxControlProps {
	value?: unknown;
	/** Part of the common plugin-control contract; unused here (same as the Vue original, which never declared it either). */
	fieldKey?: string;
	descriptor?: FieldDescriptor;
	onChange: (value: SpacingBoxValue) => void;
}

const SIDES = [
	{ key: "top", label: "Top", area: "top" },
	{ key: "right", label: "Right", area: "right" },
	{ key: "bottom", label: "Bottom", area: "bottom" },
	{ key: "left", label: "Left", area: "left" },
] as const;

export function SpacingBoxControl({
	value,
	fieldKey: _fieldKey,
	descriptor: _descriptor,
	onChange,
}: SpacingBoxControlProps) {
	// Never spread `value` directly — a legacy plain string (uniform value on
	// all 4 sides, pre-dating this field type) would iterate as characters.
	// See normalizeColorOrGradient's identical concern in color-gradient.ts.
	const normalized = useMemo(() => normalizeSpacingBox(value), [value]);

	const allEqual =
		normalized.top === normalized.right &&
		normalized.right === normalized.bottom &&
		normalized.bottom === normalized.left;
	// Starts linked whenever the current value happens to be uniform (including
	// the empty/inherit default) — unlinking is an explicit user action from
	// there. Only the initializer reads `allEqual`, matching Vue's
	// `ref(allEqual.value)` (a one-time snapshot, not a reactive binding).
	const [linked, setLinked] = useState(allEqual);

	function patch(partial: Partial<SpacingBoxValue>) {
		onChange({ ...normalized, ...partial });
	}

	function setAll(v: string) {
		patch({ top: v, right: v, bottom: v, left: v });
	}

	function setSide(side: keyof SpacingBoxValue, v: string) {
		patch({ [side]: v });
	}

	return (
		<div className="kiv-spacing-box">
			<div className="kiv-spacing-box__tabs">
				<button
					type="button"
					className={`kiv-spacing-box__tab${linked ? " kiv-spacing-box__tab--active" : ""}`}
					onClick={() => {
						setLinked(true);
						setAll(normalized.top);
					}}
				>
					All sides
				</button>
				<button
					type="button"
					className={`kiv-spacing-box__tab${!linked ? " kiv-spacing-box__tab--active" : ""}`}
					onClick={() => setLinked(false)}
				>
					Per side
				</button>
			</div>

			{linked ? (
				<div className="kiv-spacing-box__row">
					<input
						type="text"
						className="kiv-input"
						value={normalized.top}
						placeholder="inherit"
						onChange={(e) => setAll(e.target.value)}
					/>
				</div>
			) : (
				<div className="kiv-spacing-box__grid">
					{SIDES.map((side) => (
						<div
							key={side.key}
							className="kiv-spacing-box__cell"
							style={{ gridArea: side.area }}
						>
							<span className="kiv-spacing-box__cell-label">{side.label}</span>
							<input
								type="text"
								className="kiv-input"
								value={normalized[side.key]}
								placeholder="inherit"
								onChange={(e) => setSide(side.key, e.target.value)}
							/>
						</div>
					))}
					<div
						className="kiv-spacing-box__center"
						style={{ gridArea: "center" }}
					/>
				</div>
			)}
		</div>
	);
}
