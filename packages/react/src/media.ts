import type { MediaProvider } from "@kivcode/engine";
import { createContext } from "react";

/**
 * Supplied by KivRenderer when the consumer passes a `media` prop (typically
 * `engine.media`). ImageNode/VideoNode read it via useContext to resolve
 * responsive URLs/srcset. When absent, they fall back to rendering the raw
 * `src` unchanged.
 */
export const KivMediaContext = createContext<MediaProvider | null>(null);
