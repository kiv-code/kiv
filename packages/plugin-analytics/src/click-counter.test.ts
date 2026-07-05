import { createEngine } from "@kiv/engine";
import { describe, expect, it } from "vitest";
import { type ClickCounts, clickCounterPlugin } from "./click-counter";

describe("clickCounterPlugin", () => {
	it("tallies clicks per button nodeId", () => {
		let latest: ClickCounts = {};
		const engine = createEngine({
			plugins: [clickCounterPlugin({ onChange: (c) => (latest = c) })],
		});

		engine.bus.emit("button.clicked", { nodeId: "cta" });
		engine.bus.emit("button.clicked", { nodeId: "cta" });
		engine.bus.emit("button.clicked", { nodeId: "docs" });

		expect(latest).toEqual({ cta: 2, docs: 1 });
	});

	it("falls back to label, then 'unknown', when nodeId is missing", () => {
		let latest: ClickCounts = {};
		const engine = createEngine({
			plugins: [clickCounterPlugin({ onChange: (c) => (latest = c) })],
		});

		engine.bus.emit("button.clicked", { label: "Buy now" });
		engine.bus.emit("button.clicked", {});

		expect(latest).toEqual({ "Buy now": 1, unknown: 1 });
	});

	it("ignores other events", () => {
		let calls = 0;
		const engine = createEngine({
			plugins: [clickCounterPlugin({ onChange: () => calls++ })],
		});

		engine.bus.emit("modal.opened", { id: "m" });

		expect(calls).toBe(0);
	});

	it("runs alongside analytics on the same event independently", () => {
		let counts: ClickCounts = {};
		const engine = createEngine({
			plugins: [clickCounterPlugin({ onChange: (c) => (counts = c) })],
		});
		// A second listener on the same event does not interfere.
		let seen = 0;
		engine.bus.on("button.clicked", () => seen++);

		engine.bus.emit("button.clicked", { nodeId: "x" });

		expect(counts).toEqual({ x: 1 });
		expect(seen).toBe(1);
	});
});
