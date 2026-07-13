import type { KivPlugin, PluginContext } from "@kivcode/engine";

/**
 * @kivcode/plugin-analytics
 *
 * A minimal example plugin that proves the engine's event-driven architecture:
 * it hooks into the bus WITHOUT touching @kivcode/engine. Any event emitted anywhere
 * (by a node, a renderer, the app) flows to this plugin via `bus.on("*")`.
 *
 * This is "the exam of the architecture" from the project's north star:
 * adding an integration must never require changing the core.
 */

/** A single captured analytics event. */
export interface AnalyticsEvent {
	/** The event name, e.g. "button.clicked". */
	event: string;
	/** The event payload, as emitted. */
	payload: unknown;
}

/** Where captured events go. Defaults to console. */
export type AnalyticsSink = (event: AnalyticsEvent) => void;

export interface AnalyticsOptions {
	/**
	 * Called for every event. Defaults to console.debug.
	 * Pass your own to forward to GA, PostHog, a store, etc.
	 */
	sink?: AnalyticsSink;
	/**
	 * Optional filter — only events whose name passes are forwarded.
	 * e.g. (name) => name.startsWith("button.")
	 */
	filter?: (event: string) => boolean;
}

const defaultSink: AnalyticsSink = (e) => {
	console.debug("[kiv:analytics]", e.event, e.payload);
};

/**
 * Creates the analytics plugin.
 *
 * @example
 *   const captured: AnalyticsEvent[] = [];
 *   createEngine({ plugins: [analyticsPlugin({ sink: (e) => captured.push(e) })] });
 */
export function analyticsPlugin(options: AnalyticsOptions = {}): KivPlugin {
	const sink = options.sink ?? defaultSink;
	const filter = options.filter;

	return {
		name: "analytics",
		install(ctx: PluginContext): void {
			// Subscribe to EVERY event via the global wildcard.
			// Emitting a brand-new event elsewhere never requires changing this.
			ctx.bus.on("*", (event, payload) => {
				if (filter && !filter(event)) return;
				sink({ event, payload });
			});
		},
	};
}

export {
	type ClickCounterOptions,
	type ClickCounts,
	clickCounterPlugin,
} from "./click-counter";
