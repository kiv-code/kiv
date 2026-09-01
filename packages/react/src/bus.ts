import type { EventBus } from "@kivcode/engine";
import { createContext } from "react";

/**
 * Declare the events this renderer emits so `bus.emit`/`bus.on` are fully
 * typed. This is module augmentation — adding an event never touches
 * @kivcode/engine.
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
 * Supplied by KivRenderer when the consumer passes a `bus` prop. Interactive
 * nodes read it via useContext to emit events (button.clicked, modal.opened,
 * accordion.itemToggled, …). When absent (e.g. inside the editor canvas),
 * nodes simply don't emit.
 */
export const KivBusContext = createContext<EventBus | null>(null);
