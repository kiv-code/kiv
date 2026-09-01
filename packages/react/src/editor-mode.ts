import { createContext } from "react";

/** `true` inside the editor canvas. Nodes use this to disable navigation,
 *  enable inline editing, keep hidden-for-this-breakpoint nodes visible-and-dimmed, etc. */
export const KivEditorModeContext = createContext<boolean>(false);
