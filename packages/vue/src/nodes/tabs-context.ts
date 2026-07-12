import type { InjectionKey, Ref } from "vue";

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

export interface TabsContext {
	activeId: Ref<string | null>;
	setActive(id: string): void;
	register(meta: TabPanelMeta): void;
	update(id: string, patch: Partial<Omit<TabPanelMeta, "id">>): void;
	unregister(id: string): void;
	panels: Ref<TabPanelMeta[]>;
	iconPosition: Ref<string>;
	icon: Ref<string>;
}

export const TABS_CONTEXT_KEY: InjectionKey<TabsContext> =
	Symbol("kiv-tabs-context");
