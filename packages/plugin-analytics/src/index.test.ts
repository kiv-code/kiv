import { createEngine } from "@kivcode/engine";
import { describe, expect, it } from "vitest";
import { type AnalyticsEvent, analyticsPlugin } from "./index";

describe("analyticsPlugin", () => {
	it("captures events emitted on the engine bus", () => {
		const captured: AnalyticsEvent[] = [];
		const engine = createEngine({
			plugins: [analyticsPlugin({ sink: (e) => captured.push(e) })],
		});

		engine.bus.emit("button.clicked", { id: "cta" });

		expect(captured).toEqual([
			{ event: "button.clicked", payload: { id: "cta" } },
		]);
	});

	it("captures ALL events via the global wildcard (no per-event wiring)", () => {
		const captured: AnalyticsEvent[] = [];
		const engine = createEngine({
			plugins: [analyticsPlugin({ sink: (e) => captured.push(e) })],
		});

		engine.bus.emit("button.clicked", { id: "a" });
		engine.bus.emit("modal.opened", { id: "m" });
		engine.bus.emit("slide.changed", { index: 2 });

		expect(captured.map((e) => e.event)).toEqual([
			"button.clicked",
			"modal.opened",
			"slide.changed",
		]);
	});

	it("respects the filter option", () => {
		const captured: AnalyticsEvent[] = [];
		const engine = createEngine({
			plugins: [
				analyticsPlugin({
					sink: (e) => captured.push(e),
					filter: (name) => name.startsWith("button."),
				}),
			],
		});

		engine.bus.emit("button.clicked", { id: "a" });
		engine.bus.emit("modal.opened", { id: "m" });

		expect(captured.map((e) => e.event)).toEqual(["button.clicked"]);
	});

	it("installs via engine.use() after creation", () => {
		const captured: AnalyticsEvent[] = [];
		const engine = createEngine();
		engine.use(analyticsPlugin({ sink: (e) => captured.push(e) }));

		engine.bus.emit("button.clicked", { id: "later" });

		expect(captured).toHaveLength(1);
	});

	it("does NOT require touching the engine core to add a new event type", () => {
		// This test documents the architectural guarantee: a consumer emits an
		// event the core has never heard of, and the plugin still receives it.
		const captured: AnalyticsEvent[] = [];
		const engine = createEngine({
			plugins: [analyticsPlugin({ sink: (e) => captured.push(e) })],
		});

		engine.bus.emit("totally.new.custom.event", { anything: true });

		expect(captured[0]?.event).toBe("totally.new.custom.event");
		expect(captured[0]?.payload).toEqual({ anything: true });
	});
});
