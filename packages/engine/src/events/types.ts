/**
 * Extensible via module augmentation in packages that add events:
 *   declare module "@kivcode/engine" { interface KivEventMap { "modal.opened": { id: string } } }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface KivEventMap {
	[event: string]: unknown;
	"editor.ready": undefined;
}

export type EventHandler<P> = (payload: P) => void;

export type WildcardHandler = (event: string, payload: unknown) => void;

export type ErrorHandler = (error: unknown, event: string) => void;

export interface EventBus {
	emit<K extends keyof KivEventMap>(event: K, payload: KivEventMap[K]): void;

	on<K extends keyof KivEventMap>(
		event: K,
		handler: EventHandler<KivEventMap[K]>,
	): () => void;
	on(pattern: `${string}.*`, handler: WildcardHandler): () => void;
	on(pattern: "*", handler: WildcardHandler): () => void;

	once<K extends keyof KivEventMap>(
		event: K,
		handler: EventHandler<KivEventMap[K]>,
	): () => void;

	off<K extends keyof KivEventMap>(
		event: K,
		handler: EventHandler<KivEventMap[K]>,
	): void;

	clear(event?: string): void;
}
