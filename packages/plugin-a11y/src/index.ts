import type { KivDocument, KivPlugin, PluginContext } from "@kivcode/engine";
import A11yPanel from "./A11yPanel.vue";
import { checkDocument } from "./rules";

declare module "@kivcode/engine" {
	interface KivEventMap {
		"a11y.checked": { issues: import("./rules").A11yIssue[] };
	}
}

/**
 * @kivcode/plugin-a11y
 *
 * Registers an "Accessibility" inspector tab listing WCAG-adjacent issues
 * (missing alt text, skipped heading levels, low-contrast text, links/buttons
 * with no discernible label, videos with no captions) found by walking the
 * live document — see `checkDocument()` in ./rules for the full rule set.
 * Re-runs on every node mutation and emits `a11y.checked` so other plugins
 * (or a toolbar badge) can react without mounting the panel themselves.
 */
export function a11yPlugin(): KivPlugin {
	let latestDocument: KivDocument | undefined;

	function recheck(ctx: PluginContext): void {
		if (!latestDocument) return;
		ctx.bus.emit("a11y.checked", { issues: checkDocument(latestDocument) });
	}

	return {
		name: "a11y",
		install(ctx: PluginContext): void {
			ctx.bus.on("node.created", () => recheck(ctx));
			ctx.bus.on("node.removed", () => recheck(ctx));
			ctx.bus.on("node.propsChanged", () => recheck(ctx));
		},
		onEditorReady(ctx: PluginContext): void {
			ctx.editor?.addInspectorTab("a11y", A11yPanel);
			ctx.editor?.onDocumentChange((doc) => {
				latestDocument = doc;
				recheck(ctx);
			});
		},
	};
}

export {
	compositeOver,
	contrastRatio,
	isLargeText,
	minimumContrastRatio,
	parseColor,
	type Rgb,
	relativeLuminance,
} from "./contrast";
export {
	type A11yIssue,
	type A11ySeverity,
	checkDocument,
	walkDocument,
} from "./rules";
export { A11yPanel };
