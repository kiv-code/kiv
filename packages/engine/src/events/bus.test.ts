import { describe, expect, it, vi } from "vitest";
import { createEventBus } from "./bus";

describe("createEventBus", () => {
	it("emits to a registered handler", () => {
		const bus = createEventBus();
		const handler = vi.fn();
		bus.on("page.loaded", handler);
		bus.emit("page.loaded", undefined);
		expect(handler).toHaveBeenCalledOnce();
	});

	it("passes payload to handler", () => {
		const bus = createEventBus();
		const handler = vi.fn();
		bus.on("widget.created", handler);
		bus.emit("widget.created", { id: "abc" });
		expect(handler).toHaveBeenCalledWith({ id: "abc" });
	});

	it("on returns an unsubscribe function", () => {
		const bus = createEventBus();
		const handler = vi.fn();
		const stop = bus.on("page.loaded", handler);
		stop();
		bus.emit("page.loaded", undefined);
		expect(handler).not.toHaveBeenCalled();
	});

	it("off removes a specific handler", () => {
		const bus = createEventBus();
		const handler = vi.fn();
		bus.on("page.loaded", handler);
		bus.off("page.loaded", handler);
		bus.emit("page.loaded", undefined);
		expect(handler).not.toHaveBeenCalled();
	});

	it("once fires only once", () => {
		const bus = createEventBus();
		const handler = vi.fn();
		bus.once("widget.created", handler);
		bus.emit("widget.created", { id: "1" });
		bus.emit("widget.created", { id: "2" });
		expect(handler).toHaveBeenCalledOnce();
		expect(handler).toHaveBeenCalledWith({ id: "1" });
	});

	it("once unsubscribe function prevents the single fire", () => {
		const bus = createEventBus();
		const handler = vi.fn();
		const stop = bus.once("widget.created", handler);
		stop();
		bus.emit("widget.created", { id: "1" });
		expect(handler).not.toHaveBeenCalled();
	});

	it("namespace wildcard matches all events in namespace", () => {
		const bus = createEventBus();
		const handler = vi.fn();
		bus.on("widget.*", handler);
		bus.emit("widget.created", { id: "1" });
		bus.emit("widget.updated", { id: "2" });
		bus.emit("page.loaded", undefined);
		expect(handler).toHaveBeenCalledTimes(2);
		expect(handler).toHaveBeenCalledWith("widget.created", { id: "1" });
		expect(handler).toHaveBeenCalledWith("widget.updated", { id: "2" });
	});

	it("global wildcard receives all events", () => {
		const bus = createEventBus();
		const handler = vi.fn();
		bus.on("*", handler);
		bus.emit("page.loaded", undefined);
		bus.emit("widget.created", { id: "1" });
		expect(handler).toHaveBeenCalledTimes(2);
	});

	it("wildcard unsubscribe works", () => {
		const bus = createEventBus();
		const handler = vi.fn();
		const stop = bus.on("widget.*", handler);
		stop();
		bus.emit("widget.created", { id: "1" });
		expect(handler).not.toHaveBeenCalled();
	});

	it("clear removes all handlers for a specific event", () => {
		const bus = createEventBus();
		const handler = vi.fn();
		bus.on("page.loaded", handler);
		bus.clear("page.loaded");
		bus.emit("page.loaded", undefined);
		expect(handler).not.toHaveBeenCalled();
	});

	it("clear with no args removes all handlers", () => {
		const bus = createEventBus();
		const h1 = vi.fn();
		const h2 = vi.fn();
		bus.on("page.loaded", h1);
		bus.on("widget.*", h2);
		bus.clear();
		bus.emit("page.loaded", undefined);
		bus.emit("widget.created", { id: "1" });
		expect(h1).not.toHaveBeenCalled();
		expect(h2).not.toHaveBeenCalled();
	});

	it("isolates handler errors — other handlers still fire", () => {
		const errors: unknown[] = [];
		const bus = createEventBus({ onError: (err) => errors.push(err) });
		const bad = vi.fn(() => {
			throw new Error("boom");
		});
		const good = vi.fn();
		bus.on("page.loaded", bad);
		bus.on("page.loaded", good);
		bus.emit("page.loaded", undefined);
		expect(good).toHaveBeenCalledOnce();
		expect(errors).toHaveLength(1);
	});

	it("multiple handlers for same event all receive payload", () => {
		const bus = createEventBus();
		const h1 = vi.fn();
		const h2 = vi.fn();
		bus.on("page.loaded", h1);
		bus.on("page.loaded", h2);
		bus.emit("page.loaded", undefined);
		expect(h1).toHaveBeenCalledOnce();
		expect(h2).toHaveBeenCalledOnce();
	});
});
