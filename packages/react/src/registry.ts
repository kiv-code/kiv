import type { ComponentType } from "react";
import type { KivNodeComponentProps } from "./node-props";

export interface ReactRegistry {
	register(type: string, component: ComponentType<KivNodeComponentProps>): void;
	get(type: string): ComponentType<KivNodeComponentProps> | undefined;
	has(type: string): boolean;
}

class ReactRegistryImpl implements ReactRegistry {
	private components = new Map<string, ComponentType<KivNodeComponentProps>>();

	register(
		type: string,
		component: ComponentType<KivNodeComponentProps>,
	): void {
		if (this.components.has(type)) {
			throw new Error(
				`[kiv/react] The node type "${type}" is already registered.`,
			);
		}
		this.components.set(type, component);
	}

	get(type: string): ComponentType<KivNodeComponentProps> | undefined {
		return this.components.get(type);
	}

	has(type: string): boolean {
		return this.components.has(type);
	}
}

export function createReactRegistry(): ReactRegistry {
	return new ReactRegistryImpl();
}
