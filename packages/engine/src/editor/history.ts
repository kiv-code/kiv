/** Arbitrary metadata describing which operation produced a snapshot (e.g. for a history UI). */
export interface HistoryMeta {
	type: string;
	[key: string]: unknown;
}

export interface HistoryOptions {
	/** Max number of past snapshots kept. Oldest entries are dropped once exceeded. */
	limit?: number;
}

interface HistoryEntry<T> {
	snapshot: T;
	meta?: HistoryMeta;
}

const DEFAULT_LIMIT = 50;

/** Undo/redo stack of immutable snapshots. Framework-agnostic — plain class, no reactivity. */
export class HistoryManager<T> {
	private past: HistoryEntry<T>[] = [];
	private current: HistoryEntry<T>;
	private future: HistoryEntry<T>[] = [];
	private readonly limit: number;

	constructor(initial: T, options: HistoryOptions = {}) {
		this.limit = options.limit ?? DEFAULT_LIMIT;
		this.current = { snapshot: initial };
	}

	get present(): T {
		return this.current.snapshot;
	}

	get canUndo(): boolean {
		return this.past.length > 0;
	}

	get canRedo(): boolean {
		return this.future.length > 0;
	}

	/** Position of the current snapshot within the full timeline (past + current + future). */
	get index(): number {
		return this.past.length;
	}

	get size(): number {
		return this.past.length + 1 + this.future.length;
	}

	/** Pushes a new snapshot, becoming the present. Clears the redo stack. */
	push(snapshot: T, meta?: HistoryMeta): void {
		this.past.push(this.current);
		if (this.past.length > this.limit) this.past.shift();
		this.current = { snapshot, meta };
		this.future = [];
	}

	undo(): T | null {
		const prev = this.past.pop();
		if (!prev) return null;
		this.future.unshift(this.current);
		this.current = prev;
		return this.current.snapshot;
	}

	redo(): T | null {
		const next = this.future.shift();
		if (!next) return null;
		this.past.push(this.current);
		this.current = next;
		return this.current.snapshot;
	}

	/** Jumps to an arbitrary point in the timeline (0-based, past+current+future). */
	goto(index: number): T | null {
		const timeline = [...this.past, this.current, ...this.future];
		const target = timeline[index];
		if (!target) return null;
		this.past = timeline.slice(0, index);
		this.current = target;
		this.future = timeline.slice(index + 1);
		return this.current.snapshot;
	}

	/** Full timeline (past + current + future), each entry with its operation metadata. */
	entries(): ReadonlyArray<{ snapshot: T; meta?: HistoryMeta }> {
		return [...this.past, this.current, ...this.future];
	}

	/** Resets the manager to a single snapshot, discarding all history. */
	reset(initial: T): void {
		this.past = [];
		this.future = [];
		this.current = { snapshot: initial };
	}
}
