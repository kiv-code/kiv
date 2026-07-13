import type { KivNode } from "@kivcode/engine";
import { ref } from "vue";
import type { EditorStore } from "../store/editor-store";

interface InlineFieldConfig {
	/** Prop this field writes to. */
	field: string;
	/** When true, edits preserve HTML markup (innerHTML) instead of plain text. */
	html?: boolean;
}

/** Nodes that support inline editing on the canvas and the prop they write to. */
const INLINE_FIELDS: Record<string, InlineFieldConfig> = {
	heading: { field: "text" },
	text: { field: "content" },
	button: { field: "label" },
	"rich-text": { field: "content", html: true },
};

// All INLINE_FIELDS are localizable content props.
function isLocalized(v: unknown): v is { $t: Record<string, unknown> } {
	return (
		typeof v === "object" &&
		v !== null &&
		!Array.isArray(v) &&
		"$t" in (v as Record<string, unknown>)
	);
}

function findNode(node: KivNode, id: string): KivNode | null {
	if (node.id === id) return node;
	for (const children of Object.values(node.slots ?? {})) {
		for (const child of children) {
			const found = findNode(child, id);
			if (found) return found;
		}
	}
	return null;
}

interface Handlers {
	blur: EventListener;
	keydown: EventListener;
}

// WeakMap so handlers are GC'd with the element — no custom props on HTMLElement
const handlerMap = new WeakMap<HTMLElement, Handlers>();

/**
 * Activates inline editing when the user double-clicks a node in the canvas.
 * - Makes the element contenteditable
 * - On blur or Enter → commits via store.updateProps
 * - On Escape → reverts to original content
 * - For HTML fields (rich-text), also surfaces a light bold/italic/link
 *   toolbar and edits preserve markup (innerHTML) instead of plain text.
 */
export function useInlineEdit(store: EditorStore) {
	let currentEl: HTMLElement | null = null;
	let currentHtml = false;
	let originalContent = "";

	const toolbarVisible = ref(false);
	const toolbarTop = ref(0);
	const toolbarLeft = ref(0);

	function showToolbar(el: HTMLElement) {
		const rect = el.getBoundingClientRect();
		toolbarTop.value = Math.max(8, rect.top - 40);
		toolbarLeft.value = rect.left;
		toolbarVisible.value = true;
	}

	function hideToolbar() {
		toolbarVisible.value = false;
	}

	function getContent(el: HTMLElement, html: boolean): string {
		return html ? el.innerHTML.trim() : el.innerText.trim();
	}

	function commit(
		el: HTMLElement,
		nodeId: string,
		field: string,
		html: boolean,
	) {
		const newValue = getContent(el, html);
		if (newValue !== originalContent) {
			// Inline-edited fields (text/content/label) are localizable.
			// Write into the active locale, preserving other translations,
			// so editing "en" doesn't clobber "es"/"fr".
			const supported = store.document.value.i18n?.supported ?? [];
			if (supported.length > 1) {
				const node = findNode(store.document.value.root, nodeId);
				const existing = node?.props[field];
				const t: Record<string, unknown> = isLocalized(existing)
					? { ...existing.$t }
					: {};
				t[store.locale.value] = newValue;
				store.updateProps(nodeId, { [field]: { $t: t } });
			} else {
				store.updateProps(nodeId, { [field]: newValue });
			}
		}
		cleanup(el);
	}

	function cleanup(el: HTMLElement) {
		el.contentEditable = "false";
		el.removeAttribute("data-kiv-editing");
		el.style.outline = "";
		el.style.outlineOffset = "";
		const handlers = handlerMap.get(el);
		if (handlers) {
			el.removeEventListener("blur", handlers.blur);
			el.removeEventListener("keydown", handlers.keydown);
			handlerMap.delete(el);
		}
		currentEl = null;
		hideToolbar();
	}

	function activate(
		el: HTMLElement,
		nodeId: string,
		field: string,
		html = false,
	) {
		if (currentEl && currentEl !== el) {
			currentEl.contentEditable = "false";
			currentEl.removeAttribute("data-kiv-editing");
		}

		currentHtml = html;
		originalContent = getContent(el, html);
		el.contentEditable = "true";
		el.setAttribute("data-kiv-editing", "true");
		el.style.outline = "2px dashed #6366f1";
		el.style.outlineOffset = "2px";
		el.focus();

		// Place cursor at end
		const range = document.createRange();
		const sel = window.getSelection();
		range.selectNodeContents(el);
		range.collapse(false);
		sel?.removeAllRanges();
		sel?.addRange(range);

		currentEl = el;
		if (html) {
			showToolbar(el);
		} else {
			hideToolbar();
		}

		const blurHandler: EventListener = () => commit(el, nodeId, field, html);
		const keydownHandler: EventListener = (ev) => {
			const e = ev as KeyboardEvent;
			if (e.key === "Escape") {
				if (html) {
					el.innerHTML = originalContent;
				} else {
					el.innerText = originalContent;
				}
				cleanup(el);
				e.preventDefault();
			} else if (e.key === "Enter" && !e.shiftKey && !html) {
				// Plain-text fields commit on Enter. HTML fields let Enter insert a
				// line break, since rich text is usually multi-paragraph.
				e.preventDefault();
				commit(el, nodeId, field, html);
			}
		};

		handlerMap.set(el, { blur: blurHandler, keydown: keydownHandler });
		el.addEventListener("blur", blurHandler);
		el.addEventListener("keydown", keydownHandler);
	}

	/** Applies a light formatting command to the active HTML field's selection. */
	function execFormat(command: string, value?: string) {
		if (!currentEl || !currentHtml) return;
		currentEl.focus();
		document.execCommand(command, false, value);
	}

	function formatBold() {
		execFormat("bold");
	}

	function formatItalic() {
		execFormat("italic");
	}

	function formatLink() {
		const url = window.prompt("Link URL", "https://");
		if (url) execFormat("createLink", url);
	}

	/** Call this from the canvas dblclick handler */
	function onCanvasDblClick(e: MouseEvent) {
		const target = (e.target as HTMLElement).closest(
			"[data-kiv-node-id]",
		) as HTMLElement | null;
		if (!target) return;

		const nodeId = target.dataset.kivNodeId;
		if (!nodeId) return;

		// Find the element with data-kiv-type (the actual rendered node element)
		const typeEl = (
			target.dataset.kivType ? target : target.querySelector("[data-kiv-type]")
		) as HTMLElement | null;
		const resolvedType = typeEl?.dataset.kivType ?? "";

		const config = INLINE_FIELDS[resolvedType];
		if (!config) return;

		store.select(nodeId);
		e.preventDefault();
		e.stopPropagation();

		activate(typeEl ?? target, nodeId, config.field, config.html);
	}

	/** Deactivates any active inline edit */
	function deactivate() {
		if (currentEl) {
			currentEl.contentEditable = "false";
			currentEl.removeAttribute("data-kiv-editing");
			currentEl = null;
		}
		hideToolbar();
	}

	/** True when `type` has an inline-editable field (used to gate the Enter shortcut). */
	function supportsInlineEdit(type: string): boolean {
		return type in INLINE_FIELDS;
	}

	/** Programmatically starts inline editing for `nodeId`, e.g. from a keyboard shortcut rather than a dblclick. */
	function activateById(container: HTMLElement, nodeId: string) {
		const target = container.querySelector(
			`[data-kiv-node-id="${nodeId}"]`,
		) as HTMLElement | null;
		if (!target) return;

		const typeEl = (
			target.dataset.kivType ? target : target.querySelector("[data-kiv-type]")
		) as HTMLElement | null;
		const resolvedType = typeEl?.dataset.kivType ?? "";
		const config = INLINE_FIELDS[resolvedType];
		if (!config) return;

		activate(typeEl ?? target, nodeId, config.field, config.html);
	}

	return {
		onCanvasDblClick,
		deactivate,
		activateById,
		supportsInlineEdit,
		toolbarVisible,
		toolbarTop,
		toolbarLeft,
		formatBold,
		formatItalic,
		formatLink,
	};
}
