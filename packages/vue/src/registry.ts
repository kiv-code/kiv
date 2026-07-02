import type { Component } from "vue";

export interface VueRegistry {
	register(type: string, component: Component): void;
	get(type: string): Component | undefined;
	has(type: string): boolean;
}

class VueRegistryImpl implements VueRegistry {
	private components = new Map<string, Component>();

	register(type: string, component: Component): void {
		if (this.components.has(type)) {
			throw new Error(
				`[kiv/vue] El tipo de nodo "${type}" ya está registrado.`,
			);
		}
		this.components.set(type, component);
	}

	get(type: string): Component | undefined {
		return this.components.get(type);
	}

	has(type: string): boolean {
		return this.components.has(type);
	}
}

export function createVueRegistry(): VueRegistry {
	return new VueRegistryImpl();
}
