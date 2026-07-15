import type { MediaAsset, MediaProvider } from "@kivcode/engine";

/**
 * Module-scope singleton — shared across every `KivMediaBrowser` instance in
 * the app (one per image/video field's `MediaPicker`, plus the toolbar's own
 * media library button), keyed by the `MediaProvider` object itself. Every
 * field in a given editor shares the SAME provider instance (created once by
 * `createEngine({ media })`), so this is effectively one cache per editor.
 *
 * A `const` declared at the top of a `<script setup>` block is NOT this —
 * it's re-initialized per component instance, which is why this lives in its
 * own module instead of inline in KivMediaBrowser.vue.
 */
export const mediaListCache = new WeakMap<MediaProvider, MediaAsset[]>();
