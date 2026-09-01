import type { KivNodeComponentProps } from "../node-props";

export interface PageNodeProps extends KivNodeComponentProps {
	lang?: string;
}

export function PageNode({ lang, slots, id, style, ...rest }: PageNodeProps) {
	return (
		<div id={id} lang={lang} style={style} data-kiv-type="page" {...rest}>
			{slots?.default}
		</div>
	);
}
