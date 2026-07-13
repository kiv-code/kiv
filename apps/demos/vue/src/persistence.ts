import type { KivDocument } from "@kivcode/engine";
import { migrateDocument } from "@kivcode/engine";

/**
 * Document persistence — a stand-in for your real backend.
 *
 * In the demo we use localStorage; in your app you'd swap the two functions
 * for API calls. The IMPORTANT part is the shape of the flow, which is
 * identical either way:
 *
 *   SAVE  →  JSON.stringify(document)  →  store           (= UPDATE pages SET document = ? )
 *   LOAD  →  JSON.parse(raw)  →  migrateDocument(...)  →   (= SELECT document FROM pages   )
 *
 * migrateDocument() upgrades an old-schema document to the current
 * schemaVersion, so pages saved months ago keep working after the engine
 * evolves. NEVER skip it on load.
 */

const STORAGE_KEY = "kiv:demo:page";

/**
 * Persist a document. Returns the serialized string that was stored
 * (handy if you want to send it to an API instead).
 *
 * Real backend equivalent:
 *   await fetch(`/api/pages/${id}`, {
 *     method: "PUT",
 *     body: JSON.stringify({ document }),
 *   })
 */
export function savePage(document: KivDocument): string {
	const raw = JSON.stringify(document);
	try {
		localStorage.setItem(STORAGE_KEY, raw);
	} catch {
		// storage full / unavailable — in a real app, surface this to the user
	}
	return raw;
}

/**
 * Load a persisted document, or null if none saved yet.
 * Always runs migrateDocument() so old documents are upgraded on read.
 *
 * Real backend equivalent:
 *   const { document } = await (await fetch(`/api/pages/${id}`)).json()
 *   return migrateDocument(document)
 */
export function loadPage(): KivDocument | null {
	let raw: string | null = null;
	try {
		raw = localStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw) as KivDocument;
		return migrateDocument(parsed);
	} catch {
		// Corrupt or incompatible (e.g. schemaVersion newer than engine) —
		// fall back to null so the app can load its default document.
		return null;
	}
}

/** Remove the persisted document (e.g. a "reset to default" action). */
export function clearPage(): void {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// ignore
	}
}
