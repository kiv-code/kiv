import { useContext, useEffect, useRef } from "react";
import { KivEditorModeContext } from "../editor-mode";
import type { KivNodeComponentProps } from "../node-props";
import { TabsContext } from "./tabs-context";

export interface TabPanelNodeProps extends KivNodeComponentProps {
	title?: string;
	icon?: string;
	iconSize?: number;
	iconColor?: string;
	badge?: string;
	badgeColor?: string;
	titleColor?: string;
	titleFontSize?: string;
	disabled?: boolean;
}

export function TabPanelNode({
	title,
	icon,
	iconSize,
	iconColor,
	badge,
	badgeColor,
	titleColor,
	titleFontSize,
	disabled,
	slots,
	id,
	style,
	...rest
}: TabPanelNodeProps) {
	const ctx = useContext(TabsContext);
	const isEditorMode = useContext(KivEditorModeContext);

	function meta() {
		return {
			title: title ?? "",
			icon,
			iconSize,
			iconColor,
			badge,
			badgeColor,
			titleColor,
			titleFontSize,
			disabled: disabled === true,
		};
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: register/unregister only ever run once per panel, mirroring Vue's onMounted/onBeforeUnmount
	useEffect(() => {
		ctx?.register({ id, ...meta() });
		return () => ctx?.unregister(id);
	}, []);

	// Vue's `watch` (without `immediate: true`) only fires on CHANGE, never
	// for the initial value — this ref skips the first run so mounting
	// doesn't call `update` with the same meta `register` just sent.
	const isFirstUpdate = useRef(true);
	// biome-ignore lint/correctness/useExhaustiveDependencies: re-runs whenever any piece of `meta()` changes, mirroring Vue's watch
	useEffect(() => {
		if (isFirstUpdate.current) {
			isFirstUpdate.current = false;
			return;
		}
		ctx?.update(id, meta());
	}, [
		title,
		icon,
		iconSize,
		iconColor,
		badge,
		badgeColor,
		titleColor,
		titleFontSize,
		disabled,
	]);

	const isActive = isEditorMode || ctx?.activeId === id;

	return (
		<section
			id={id}
			style={{ display: isActive ? undefined : "none", ...style }}
			data-kiv-type="tab-panel"
			{...rest}
		>
			{slots?.default}
		</section>
	);
}
