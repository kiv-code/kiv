import type { KivPlugin, PluginContext } from "@kivcode/engine";

/**
 * A second example plugin — showing a DIFFERENT shape than analyticsPlugin:
 *
 *  - It listens to ONE specific event ("button.clicked"), not the wildcard.
 *  - It holds its OWN state (a per-button click tally).
 *  - It reports changes through a callback.
 *
 * Same architectural guarantee: it plugs into the bus without touching
 * @kivcode/engine. Two plugins can listen to the same event independently.
 */

/** Map of button nodeId (or label) → number of clicks. */
export type ClickCounts = Record<string, number>;

export interface ClickCounterOptions {
	/** Called with the updated counts every time a button is clicked. */
	onChange?: (counts: ClickCounts) => void;
}

export function clickCounterPlugin(
	options: ClickCounterOptions = {},
): KivPlugin {
	const counts: ClickCounts = {};

	return {
		name: "click-counter",
		install(ctx: PluginContext): void {
			ctx.bus.on("button.clicked", (payload) => {
				// This plugin doesn't depend on @kivcode/vue (a plugin must not depend
				// on a renderer), so we read the payload defensively.
				const p = (payload ?? {}) as {
					nodeId?: string;
					label?: string;
				};
				const key = p.nodeId ?? p.label ?? "unknown";
				counts[key] = (counts[key] ?? 0) + 1;
				options.onChange?.({ ...counts });
			});
		},
	};
}
