import type { ServicesContainer } from "@kivcode/engine";
import type { InjectionKey } from "vue";

/**
 * Provided by KivRenderer when the consumer passes a `services` prop
 * (typically `engine.services`). FormNode injects it to submit via
 * `services.api` when configured, falling back to a native form submit
 * when absent (e.g. inside the editor canvas without an ApiClient wired up).
 */
export const KIV_SERVICES_KEY: InjectionKey<ServicesContainer | null> =
	Symbol("kiv-services");
