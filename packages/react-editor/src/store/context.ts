import { createContext } from "react";
import type { EditorExtensions } from "../extensions";
import type { EditorStore } from "./editor-store";

export const EditorStoreContext = createContext<EditorStore | null>(null);

export const EditorExtensionsContext = createContext<EditorExtensions | null>(
	null,
);

/** The Structure panel's filter text, provided once at KivTree and read by every recursive KivTreeNode. */
export const KivTreeFilterContext = createContext<string>("");

/** Provided by KivTree so KivCanvas can focus the tree's search input on ⌘F. */
export const KivTreeFocusSearchContext = createContext<() => void>(() => {});
