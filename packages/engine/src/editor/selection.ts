export type SelectionListener = (ids: readonly string[]) => void;

/** Tracks selected node IDs. Framework-agnostic — no Vue refs, plain getters and a subscribe/notify pattern. */
export class SelectionState {
	private selected = new Set<string>();
	private listeners = new Set<SelectionListener>();

	get ids(): readonly string[] {
		return [...this.selected];
	}

	get size(): number {
		return this.selected.size;
	}

	get isEmpty(): boolean {
		return this.selected.size === 0;
	}

	has(id: string): boolean {
		return this.selected.has(id);
	}

	/** Replaces the selection with a single id. */
	select(id: string): void {
		this.replace([id]);
	}

	/** Adds one id to the selection (multi-select). */
	add(id: string): void {
		if (this.selected.has(id)) return;
		this.selected.add(id);
		this.notify();
	}

	/** Removes one id from the selection, if present. */
	remove(id: string): void {
		if (!this.selected.has(id)) return;
		this.selected.delete(id);
		this.notify();
	}

	/** Adds the id if absent, removes it if present. */
	toggle(id: string): void {
		if (this.selected.has(id)) this.remove(id);
		else this.add(id);
	}

	/** Replaces the whole selection with the given ids (multi-select). */
	replace(ids: readonly string[]): void {
		this.selected = new Set(ids);
		this.notify();
	}

	/** Clears the selection entirely. */
	clear(): void {
		if (this.selected.size === 0) return;
		this.selected.clear();
		this.notify();
	}

	onChange(listener: SelectionListener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notify(): void {
		const snapshot = this.ids;
		for (const listener of this.listeners) listener(snapshot);
	}
}
