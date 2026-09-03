import type { FontProvider } from "@kivcode/engine";
import { createContext } from "react";

/**
 * Set by KivRenderer when the consumer passes a `fonts` prop (typically
 * `engine.fonts`). Text nodes read it to turn a stored font id into the real
 * CSS stack. When absent, a font id falls through unresolved and the text
 * inherits the page font — never a typeface the project doesn't load.
 */
export const KivFontsContext = createContext<FontProvider | null>(null);
