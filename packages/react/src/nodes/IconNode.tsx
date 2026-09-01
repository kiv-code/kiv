import { resolveIcon } from "@kivcode/nodes";
import { useMemo } from "react";
import type { KivNodeComponentProps } from "../node-props";

export interface IconNodeProps extends KivNodeComponentProps {
	icon?: string;
	iconSize?: number;
	iconColor?: string;
}

export function IconNode({
	icon,
	iconSize,
	iconColor,
	id,
	style,
	...rest
}: IconNodeProps) {
	const svgContent = useMemo(() => {
		const raw = icon ?? "";
		if (raw.trim().startsWith("<svg")) return raw;
		return resolveIcon(raw) ?? "";
	}, [icon]);

	const spanStyle = useMemo(
		() => ({
			fontSize: `${iconSize ?? 24}px`,
			color: iconColor || "currentColor",
			display: "inline-flex" as const,
			alignItems: "center" as const,
			justifyContent: "center" as const,
			...style,
		}),
		[iconSize, iconColor, style],
	);

	if (svgContent) {
		return (
			<span
				id={id}
				style={spanStyle}
				data-kiv-type="icon"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: resolved icon markup is bundled with @kivcode/nodes, same trust boundary as the Vue renderer's v-html
				dangerouslySetInnerHTML={{ __html: svgContent }}
				{...rest}
			/>
		);
	}

	return (
		<span id={id} style={spanStyle} data-kiv-type="icon" {...rest}>
			<i className={icon} aria-hidden="true" />
		</span>
	);
}
