import type { PricingTier } from "@kivcode/nodes";
import type { CSSProperties } from "react";
import { useKivLink } from "../hooks/useKivLink";

/**
 * One pricing card's CTA — its own component so `useKivLink` (router
 * detection, anchor scroll, editor-mode guard) runs per tier instead of once
 * for the whole node. Each tier can point somewhere different; a tier with no
 * link of its own falls back to the node-level `linkType`/`href`.
 */
export function PricingCardCta({
	tier,
	fallbackLinkType,
	fallbackHref,
	label,
	style,
}: {
	tier: PricingTier;
	fallbackLinkType?: string;
	fallbackHref?: string;
	label: string;
	style: CSSProperties;
}) {
	const hasOwnLink = !!(tier.ctaLinkType || tier.ctaHref);
	const {
		tag: Tag,
		attrs,
		onClick,
	} = useKivLink({
		linkType: hasOwnLink ? tier.ctaLinkType : fallbackLinkType,
		href: hasOwnLink ? tier.ctaHref : fallbackHref,
	});

	return (
		<Tag {...attrs} style={style} onClick={onClick}>
			{label}
		</Tag>
	);
}
