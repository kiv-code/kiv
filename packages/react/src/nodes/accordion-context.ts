import { createContext } from "react";

export interface AccordionContextValue {
	isOpen(id: string): boolean;
	toggle(id: string, disabled?: boolean): void;
	register(id: string, defaultOpen: boolean): void;
	unregister(id: string): void;
	animation: string;
	animationDuration: number;
	icon: string;
	iconPosition: string;
	iconSize: number;
}

export const AccordionContext = createContext<AccordionContextValue | null>(
	null,
);
