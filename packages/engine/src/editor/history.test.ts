import { describe, expect, it } from "vitest";
import { HistoryManager } from "./history";

describe("HistoryManager", () => {
	it("starts with the initial snapshot as present", () => {
		const history = new HistoryManager("v0");
		expect(history.present).toBe("v0");
		expect(history.canUndo).toBe(false);
		expect(history.canRedo).toBe(false);
	});

	it("push moves the present forward and clears redo", () => {
		const history = new HistoryManager("v0");
		history.push("v1");
		expect(history.present).toBe("v1");
		expect(history.canUndo).toBe(true);
	});

	it("undo restores the previous snapshot", () => {
		const history = new HistoryManager("v0");
		history.push("v1");
		history.undo();
		expect(history.present).toBe("v0");
		expect(history.canRedo).toBe(true);
	});

	it("redo re-applies an undone snapshot", () => {
		const history = new HistoryManager("v0");
		history.push("v1");
		history.undo();
		history.redo();
		expect(history.present).toBe("v1");
		expect(history.canRedo).toBe(false);
	});

	it("undo on an empty stack returns null and keeps present unchanged", () => {
		const history = new HistoryManager("v0");
		expect(history.undo()).toBeNull();
		expect(history.present).toBe("v0");
	});

	it("push after undo discards the redo stack", () => {
		const history = new HistoryManager("v0");
		history.push("v1");
		history.undo();
		history.push("v2");
		expect(history.present).toBe("v2");
		expect(history.canRedo).toBe(false);
	});

	it("respects the configured depth limit", () => {
		const history = new HistoryManager("v0", { limit: 2 });
		history.push("v1");
		history.push("v2");
		history.push("v3");
		expect(history.undo()).toBe("v2");
		expect(history.undo()).toBe("v1");
		expect(history.undo()).toBeNull();
	});

	it("goto jumps to an arbitrary point in the timeline", () => {
		const history = new HistoryManager("v0");
		history.push("v1");
		history.push("v2");
		expect(history.goto(0)).toBe("v0");
		expect(history.canRedo).toBe(true);
		expect(history.goto(2)).toBe("v2");
		expect(history.canRedo).toBe(false);
	});

	it("goto with an out-of-range index returns null and does not mutate state", () => {
		const history = new HistoryManager("v0");
		history.push("v1");
		expect(history.goto(99)).toBeNull();
		expect(history.present).toBe("v1");
	});

	it("stores operation metadata alongside each snapshot", () => {
		const history = new HistoryManager("v0");
		history.push("v1", { type: "node.created", id: "a" });
		const entries = history.entries();
		expect(entries[1]?.meta).toEqual({ type: "node.created", id: "a" });
	});

	it("reset discards all history", () => {
		const history = new HistoryManager("v0");
		history.push("v1");
		history.reset("v2");
		expect(history.present).toBe("v2");
		expect(history.canUndo).toBe(false);
		expect(history.canRedo).toBe(false);
	});
});
