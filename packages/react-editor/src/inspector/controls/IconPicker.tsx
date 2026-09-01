import type { FieldDescriptor } from "@kivcode/engine";
import type { IconSet } from "@kivcode/nodes";
import { getIconSets, resolveIconInfo } from "@kivcode/nodes";
import { useContext, useMemo, useRef, useState } from "react";
import { EditorStoreContext } from "../../store/context";

const INITIAL_LIMIT = 200;

export interface IconPickerProps {
	value?: string;
	/** Part of the common plugin-control contract; unused here (same as the Vue original, which never declared it either). */
	fieldKey?: string;
	/** Declared for schema parity with the plugin-control contract; never read (same as the Vue original, which declares but never uses it). */
	descriptor?: FieldDescriptor;
	onChange: (value: string) => void;
}

function findSetForValue(
	value: string,
	iconSets: IconSet[],
): IconSet | undefined {
	if (!value || value.startsWith("<svg")) return undefined;
	const colonIdx = value.indexOf(":");
	if (colonIdx > 0) {
		return iconSets.find((s) => s.prefix === value.slice(0, colonIdx));
	}
	for (const set of iconSets) {
		if (set.data.icons?.[value]) return set;
	}
	return undefined;
}

export function IconPicker({
	value = "",
	fieldKey: _fieldKey,
	descriptor: _descriptor,
	onChange,
}: IconPickerProps) {
	const store = useContext(EditorStoreContext);
	const iconSets = getIconSets();

	// `activeSet`/`showCustom` are one-time snapshots derived from the initial
	// `value` (mirrors Vue's `ref(...)` initializers) — they don't re-derive
	// reactively if `value` changes from outside afterwards.
	const [activeSet, setActiveSet] = useState<IconSet>(
		() => findSetForValue(value, iconSets) ?? (iconSets[0] as IconSet),
	);
	const [search, setSearch] = useState("");
	const [showCustom, setShowCustom] = useState(() =>
		value.trim().startsWith("<svg"),
	);
	const [showAll, setShowAll] = useState(false);

	const svgCacheRef = useRef(new Map<string, string>());

	function getSvg(key: string): string {
		const cache = svgCacheRef.current;
		let svg = cache.get(key);
		if (svg === undefined) {
			const info = resolveIconInfo(key);
			svg = info?.svg ?? "";
			cache.set(key, svg);
		}
		return svg;
	}

	const allNames = useMemo(
		() => Object.keys(activeSet.data.icons ?? {}),
		[activeSet],
	);

	const filteredNames = useMemo(() => {
		if (showCustom) return [];
		const q = search.toLowerCase().trim();
		if (!q) return allNames;
		return allNames.filter((name) => name.toLowerCase().includes(q));
	}, [showCustom, search, allNames]);

	const visibleNames = showAll
		? filteredNames
		: filteredNames.slice(0, INITIAL_LIMIT);
	const hasMore = !showAll && filteredNames.length > INITIAL_LIMIT;
	const totalCount = filteredNames.length;

	const selectedInfo = useMemo(() => {
		if (showCustom || !value) return null;
		if (value.trim().startsWith("<svg")) return null;
		return resolveIconInfo(value);
	}, [showCustom, value]);

	function selectIconName(name: string) {
		setShowCustom(false);
		onChange(`${activeSet.prefix}:${name}`);
	}

	function switchTab(set: IconSet) {
		setActiveSet(set);
		setShowCustom(false);
		setSearch("");
		setShowAll(false);
		if (!value || value.startsWith("<svg")) {
			onChange("");
		}
	}

	function switchToCustom() {
		setShowCustom(true);
		onChange("<svg>\n\n</svg>");
	}

	// ── Embedded size + color (read from the selected node's props) ──
	const selectedNode = store?.selected;
	const iconSizeValue = selectedNode?.props?.iconSize;
	const iconSize = typeof iconSizeValue === "number" ? iconSizeValue : 16;
	const iconColorValue = selectedNode?.props?.iconColor;
	const iconColor =
		typeof iconColorValue === "string" && iconColorValue ? iconColorValue : "";

	function setIconSize(px: number) {
		if (!store || !selectedNode) return;
		store.updateProps(selectedNode.id, { iconSize: px });
	}
	function setIconColor(color: string) {
		if (!store || !selectedNode) return;
		store.updateProps(selectedNode.id, { iconColor: color });
	}

	return (
		<div className="kiv-icon-picker">
			<div className="kiv-icon-picker__tabs">
				{iconSets.map((set) => (
					<button
						key={set.prefix}
						type="button"
						className={`kiv-icon-picker__tab${!showCustom && activeSet.prefix === set.prefix ? " kiv-icon-picker__tab--active" : ""}`}
						onClick={() => switchTab(set)}
					>
						{set.label}
					</button>
				))}
				<button
					type="button"
					className={`kiv-icon-picker__tab${showCustom ? " kiv-icon-picker__tab--active" : ""}`}
					onClick={switchToCustom}
				>
					Custom
				</button>
			</div>

			{!showCustom ? (
				<>
					<div className="kiv-icon-picker__search">
						<input
							type="text"
							className="kiv-icon-picker__search-input"
							placeholder="Search icons…"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					{selectedInfo && (
						<div className="kiv-icon-picker__active-preview">
							<span
								className="kiv-icon-picker__preview-icon"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: resolved icon markup comes from the bundled @iconify-json sets via resolveIconInfo, same trust boundary as the Vue control's v-html
								dangerouslySetInnerHTML={{ __html: selectedInfo.svg }}
							/>
							<span className="kiv-icon-picker__active-name">{value}</span>
							<button
								type="button"
								className="kiv-icon-picker__clear"
								onClick={() => onChange("")}
							>
								&times;
							</button>
						</div>
					)}

					<div className="kiv-icon-picker__grid">
						{visibleNames.map((name) => {
							const iconKey = `${activeSet.prefix}:${name}`;
							return (
								<button
									key={iconKey}
									type="button"
									className={`kiv-icon-picker__item${value === iconKey ? " kiv-icon-picker__item--active" : ""}`}
									title={name}
									onClick={() => selectIconName(name)}
									// biome-ignore lint/security/noDangerouslySetInnerHtml: resolved icon markup comes from the bundled @iconify-json sets via resolveIconInfo, same trust boundary as the Vue control's v-html
									dangerouslySetInnerHTML={{ __html: getSvg(iconKey) }}
								/>
							);
						})}
						{hasMore && (
							<button
								type="button"
								className="kiv-icon-picker__show-all"
								onClick={() => setShowAll(true)}
							>
								Show all {totalCount} icons
							</button>
						)}
						{visibleNames.length === 0 && (
							<div className="kiv-icon-picker__empty">
								No icons match "{search}"
							</div>
						)}
					</div>

					<div className="kiv-icon-picker__extra">
						<div className="kiv-icon-picker__extra-row">
							<label
								className="kiv-icon-picker__extra-label"
								htmlFor="kiv-icon-picker-size-slider"
							>
								Size
							</label>
							<div className="kiv-icon-picker__size-wrap">
								<input
									id="kiv-icon-picker-size-slider"
									type="range"
									className="kiv-icon-picker__size-slider"
									value={iconSize}
									min={8}
									max={128}
									step={1}
									onChange={(e) => setIconSize(Number(e.target.value))}
								/>
								<input
									type="number"
									className="kiv-icon-picker__size-input"
									value={iconSize}
									min={8}
									max={128}
									onChange={(e) => setIconSize(Number(e.target.value))}
								/>
							</div>
						</div>
						<div className="kiv-icon-picker__extra-row">
							<label
								className="kiv-icon-picker__extra-label"
								htmlFor="kiv-icon-picker-color-input"
							>
								Color
							</label>
							<input
								id="kiv-icon-picker-color-input"
								type="color"
								className="kiv-icon-picker__color-input"
								value={iconColor || "#000000"}
								onChange={(e) => setIconColor(e.target.value)}
							/>
							<input
								type="text"
								className="kiv-icon-picker__color-text"
								value={iconColor}
								placeholder="inherit"
								onChange={(e) => setIconColor(e.target.value)}
							/>
						</div>
					</div>
				</>
			) : (
				<textarea
					value={value}
					className="kiv-icon-picker__custom-input"
					placeholder="Paste SVG markup"
					rows={4}
					onChange={(e) => onChange(e.target.value)}
				/>
			)}
		</div>
	);
}
