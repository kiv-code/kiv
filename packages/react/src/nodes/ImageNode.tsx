import {
	hoverEffectClass,
	hoverGlowStyle,
	IMAGE_SRCSET_WIDTHS,
	RADIUS,
	SHADOW,
} from "@kivcode/nodes";
import { useContext, useMemo } from "react";
import { KivMediaContext } from "../media";
import type { KivNodeComponentProps } from "../node-props";

export interface ImageNodeProps extends KivNodeComponentProps {
	src?: string;
	alt?: string;
	fit?: string;
	aspectRatio?: string;
	width?: string;
	borderRadius?: string;
	shadow?: string;
	hoverEffect?: string;
	hoverGlowColor?: string;
}

export function ImageNode({
	src,
	alt,
	fit,
	aspectRatio,
	width,
	borderRadius,
	shadow,
	hoverEffect,
	hoverGlowColor,
	id,
	style,
	...rest
}: ImageNodeProps) {
	const media = useContext(KivMediaContext);

	// Without a MediaProvider, resolve() is the identity and no srcset is
	// generated — a raw URL string has no reliable way to derive width variants.
	const resolvedSrc = media?.resolve(src ?? "", {}) ?? src ?? "";

	const srcSet = useMemo(() => {
		if (!media || !src) return undefined;
		return IMAGE_SRCSET_WIDTHS.map(
			(w) => `${media.resolve(src ?? "", { width: w })} ${w}w`,
		).join(", ");
	}, [media, src]);

	const imageStyle = useMemo(
		() => ({
			objectFit: (fit ?? "cover") as "cover" | "contain" | "fill" | "none",
			aspectRatio: aspectRatio !== "auto" ? aspectRatio : undefined,
			width: width ?? "100%",
			maxWidth: "100%",
			display: "block",
			borderRadius: RADIUS[borderRadius ?? "none"] ?? "0",
			boxShadow: SHADOW[shadow ?? "none"] ?? "none",
			...hoverGlowStyle(hoverGlowColor),
			...style,
		}),
		[fit, aspectRatio, width, borderRadius, shadow, hoverGlowColor, style],
	);
	const hoverClass = hoverEffectClass(hoverEffect);

	return (
		<img
			id={id}
			src={resolvedSrc}
			srcSet={srcSet}
			sizes="100vw"
			loading="lazy"
			alt={alt ?? ""}
			className={hoverClass}
			style={imageStyle}
			data-kiv-type="image"
			{...rest}
		/>
	);
}
