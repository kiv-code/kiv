import { createContext } from "react";

export interface TabPanelMeta {
	id: string;
	title: string;
	icon?: string;
	iconSize?: number;
	iconColor?: string;
	badge?: string;
	badgeColor?: string;
	titleColor?: string;
	titleFontSize?: string;
	disabled: boolean;
}

export interface TabsContextValue {
	activeId: string | null;
	setActive(id: string): void;
	register(meta: TabPanelMeta): void;
	update(id: string, patch: Partial<Omit<TabPanelMeta, "id">>): void;
	unregister(id: string): void;
	panels: TabPanelMeta[];
	iconPosition: string;
	icon: string;
}

export const TabsContext = createContext<TabsContextValue | null>(null);
