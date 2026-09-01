import { GAP, RADIUS } from "@kivcode/nodes";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { KivBusContext } from "../bus";
import type { KivNodeComponentProps } from "../node-props";
import {
	AccordionContext,
	type AccordionContextValue,
} from "./accordion-context";

declare module "@kivcode/engine" {
	interface KivEventMap {
		"accordion.itemToggled": {
			nodeId?: string;
			itemIndex: number;
			isOpen: boolean;
		};
	}
}

export interface AccordionNodeProps extends KivNodeComponentProps {
	allowMultiple?: boolean;
	keepOneOpen?: boolean;
	defaultOpenIndex?: number;
	animation?: string;
	animationDuration?: number;
	icon?: string;
	iconPosition?: string;
	iconSize?: number;
	gap?: string;
	borderRadius?: string;
	// Declared on the schema for parity with the Vue original, which never
	// reads them either (no separator is actually rendered there).
	itemBorderRadius?: string;
	showSeparator?: boolean;
	separatorColor?: string;
}

export function AccordionNode({
	allowMultiple,
	keepOneOpen,
	defaultOpenIndex,
	animation,
	animationDuration,
	icon,
	iconPosition,
	iconSize,
	gap,
	borderRadius,
	itemBorderRadius: _itemBorderRadius,
	showSeparator: _showSeparator,
	separatorColor: _separatorColor,
	slots,
	id,
	style,
	...rest
}: AccordionNodeProps) {
	const bus = useContext(KivBusContext);
	const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
	// Registration order, mirroring Vue's `order` ref — mutated synchronously
	// from AccordionItemNode's mount effect (which always fires before this
	// component's own effects, since React runs child effects before parent
	// effects within a commit), so it's already complete by the time the
	// defaultOpenIndex effect below runs.
	const order = useRef<string[]>([]);

	function isOpen(itemId: string): boolean {
		return openIds.has(itemId);
	}

	function register(itemId: string, defaultOpen: boolean): void {
		order.current = [...order.current, itemId];
		if (defaultOpen) {
			setOpenIds((prev) => {
				const next = allowMultiple ? new Set(prev) : new Set<string>();
				next.add(itemId);
				return next;
			});
		}
	}

	function unregister(itemId: string): void {
		order.current = order.current.filter((existing) => existing !== itemId);
		setOpenIds((prev) => {
			if (!prev.has(itemId)) return prev;
			const next = new Set(prev);
			next.delete(itemId);
			return next;
		});
	}

	function toggle(itemId: string, disabled?: boolean): void {
		if (disabled) return;
		const wasOpen = openIds.has(itemId);
		if (wasOpen) {
			if (keepOneOpen && openIds.size === 1) return;
			const next = new Set(openIds);
			next.delete(itemId);
			setOpenIds(next);
			bus?.emit("accordion.itemToggled", {
				nodeId: id,
				itemIndex: order.current.indexOf(itemId),
				isOpen: false,
			});
		} else {
			const next = allowMultiple ? new Set(openIds) : new Set<string>();
			next.add(itemId);
			setOpenIds(next);
			bus?.emit("accordion.itemToggled", {
				nodeId: id,
				itemIndex: order.current.indexOf(itemId),
				isOpen: true,
			});
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: runs once on mount, mirroring Vue's onMounted
	useEffect(() => {
		setOpenIds((prev) => {
			if (prev.size > 0) return prev;
			const idx = defaultOpenIndex ?? -1;
			const itemId = idx >= 0 ? order.current[idx] : undefined;
			return itemId ? new Set([itemId]) : prev;
		});
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: register/unregister close over order (a ref, always current) and the setters/state already listed — their own identity changing every render doesn't change their behavior, so omitting them avoids recomputing this object on every unrelated re-render
	const context: AccordionContextValue = useMemo(
		() => ({
			isOpen,
			toggle,
			register,
			unregister,
			animation: animation ?? "slide",
			animationDuration: animationDuration ?? 200,
			icon: icon ?? "chevron",
			iconPosition: iconPosition ?? "right",
			iconSize: iconSize ?? 12,
		}),
		[
			openIds,
			allowMultiple,
			keepOneOpen,
			id,
			animation,
			animationDuration,
			icon,
			iconPosition,
			iconSize,
			bus,
		],
	);

	const accordionStyle = useMemo(
		() => ({
			display: "flex" as const,
			flexDirection: "column" as const,
			gap: GAP[gap ?? "sm"] ?? "8px",
			borderRadius: RADIUS[borderRadius ?? "md"] ?? "8px",
			...style,
		}),
		[gap, borderRadius, style],
	);

	return (
		<AccordionContext.Provider value={context}>
			<div id={id} style={accordionStyle} data-kiv-type="accordion" {...rest}>
				{slots?.default}
			</div>
		</AccordionContext.Provider>
	);
}
