import type { ComputedRef, InjectionKey } from "vue";

export interface AccordionContext {
	isOpen(id: string): boolean;
	toggle(id: string, disabled?: boolean): void;
	register(id: string, defaultOpen: boolean): void;
	unregister(id: string): void;
	animation: ComputedRef<string>;
	animationDuration: ComputedRef<number>;
	icon: ComputedRef<string>;
	iconPosition: ComputedRef<string>;
	iconSize: ComputedRef<number>;
}

export const ACCORDION_CONTEXT_KEY: InjectionKey<AccordionContext> = Symbol(
	"kiv-accordion-context",
);
