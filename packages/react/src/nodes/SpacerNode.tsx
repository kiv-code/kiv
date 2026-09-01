import { SPACING } from "@kivcode/nodes";
import { useContext, useMemo } from "react";
import { KivEditorModeContext } from "../editor-mode";
import type { KivNodeComponentProps } from "../node-props";

export interface SpacerNodeProps extends KivNodeComponentProps {
	height?: string;
	showDividerOnCanvas?: boolean;
}

export function SpacerNode({
	height,
	showDividerOnCanvas = true,
	id,
	style,
	...rest
}: SpacerNodeProps) {
	const isEditorMode = useContext(KivEditorModeContext);

	const spacerStyle = useMemo(
		() => ({
			height: SPACING[height ?? "md"] ?? "16px",
			width: "100%",
			...(isEditorMode && showDividerOnCanvas
				? {
						outline: "1px dashed rgba(99, 102, 241, 0.4)",
						outlineOffset: "-1px",
					}
				: null),
			...style,
		}),
		[height, isEditorMode, showDividerOnCanvas, style],
	);

	return <div id={id} style={spacerStyle} data-kiv-type="spacer" {...rest} />;
}
