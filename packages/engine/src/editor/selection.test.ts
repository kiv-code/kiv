import { describe, expect, it, vi } from "vitest";
import { SelectionState } from "./selection";

describe("SelectionState", () => {
	it("starts empty", () => {
		const selection = new SelectionState();
		expect(selection.isEmpty).toBe(true);
		expect(selection.size).toBe(0);
		expect(selection.ids).toEqual([]);
	});

	it("select replaces the whole selection with one id", () => {
		const selection = new SelectionState();
		selection.replace(["a", "b"]);
		selection.select("c");
		expect(selection.ids).toEqual(["c"]);
	});

	it("add appends without clearing (multi-select)", () => {
		const selection = new SelectionState();
		selection.add("a");
		selection.add("b");
		expect(selection.ids).toEqual(["a", "b"]);
		expect(selection.size).toBe(2);
	});

	it("remove drops a single id", () => {
		const selection = new SelectionState();
		selection.replace(["a", "b"]);
		selection.remove("a");
		expect(selection.ids).toEqual(["b"]);
	});

	it("toggle adds when absent, removes when present", () => {
		const selection = new SelectionState();
		selection.toggle("a");
		expect(selection.has("a")).toBe(true);
		selection.toggle("a");
		expect(selection.has("a")).toBe(false);
	});

	it("clear empties the selection", () => {
		const selection = new SelectionState();
		selection.replace(["a", "b"]);
		selection.clear();
		expect(selection.isEmpty).toBe(true);
	});

	it("onChange notifies listeners with the new snapshot", () => {
		const selection = new SelectionState();
		const listener = vi.fn();
		selection.onChange(listener);
		selection.add("a");
		expect(listener).toHaveBeenCalledWith(["a"]);
	});

	it("onChange unsubscribe stops further notifications", () => {
		const selection = new SelectionState();
		const listener = vi.fn();
		const stop = selection.onChange(listener);
		stop();
		selection.add("a");
		expect(listener).not.toHaveBeenCalled();
	});

	it("no-op mutations do not notify listeners", () => {
		const selection = new SelectionState();
		const listener = vi.fn();
		selection.onChange(listener);
		selection.remove("missing");
		selection.clear();
		expect(listener).not.toHaveBeenCalled();
	});
});
