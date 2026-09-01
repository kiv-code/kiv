import type { ServicesContainer } from "@kivcode/engine";
import { createContext } from "react";

/**
 * Supplied by KivRenderer when the consumer passes a `services` prop
 * (typically `engine.services`). FormNode reads it via useContext to submit
 * via `services.api` when configured, falling back to a native form submit
 * when absent (e.g. inside the editor canvas without an ApiClient wired up).
 */
export const KivServicesContext = createContext<ServicesContainer | null>(null);
