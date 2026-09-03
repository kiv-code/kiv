import { fontWeights } from "@kivcode/engine";
import { useContext } from "react";
import { EditorStoreContext } from "../../store/context";

export interface FontWeightControlProps {
	value?: string;
	fieldKey?: string;
	nodeProps?: Record<string, unknown>;
	onChange: (value: string) => void;
}

const LABELS: Record<number, string> = {
	100: "Thin",
	200: "Extra Light",
	300: "Light",
	400: "Regular",
	500: "Medium",
	600: "Semi Bold",
	700: "Bold",
	800: "Extra Bold",
	900: "Black",
};

export function FontWeightControl({
	value,
	nodeProps,
	onChange,
}: FontWeightControlProps) {
	const store = useContext(EditorStoreContext);
	/**
	 * Narrowed to the cuts the selected family actually ships. Offering a 900 a
	 * font doesn't have makes the browser synthesise a fake bold — it renders,
	 * so nothing looks broken, it just looks subtly wrong.
	 */
	const weights = fontWeights(
		nodeProps?.fontFamily,
		store?.fonts?.list() ?? [],
	);

	return (
		<select
			className="kiv-input"
			value={value ?? ""}
			onChange={(e) => onChange(e.target.value)}
		>
			{weights.map((w) => (
				<option key={w} value={String(w)}>
					{w} · {LABELS[w] ?? ""}
				</option>
			))}
		</select>
	);
}
