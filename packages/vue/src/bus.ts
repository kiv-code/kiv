import type { EventBus } from "@kivcode/engine";
import type { InjectionKey } from "vue";

/**
 * Declare the events this renderer emits so `bus.emit`/`bus.on` are fully typed.
 * This is module augmentation — adding an event never touches @kivcode/engine.
 */
declare module "@kivcode/engine" {
	interface KivEventMap {
		"button.clicked": {
			nodeId?: string;
			label?: string;
			href?: string;
		};
	}
}

/**
 * Provided by KivRenderer when the consumer passes a `bus` prop.
 * Interactive nodes inject it to emit events (button.clicked, modal.opened, …).
 * When absent (e.g. inside the editor canvas), nodes simply don't emit.
 */
export const KIV_BUS_KEY: InjectionKey<EventBus | null> = Symbol("kiv-bus");
