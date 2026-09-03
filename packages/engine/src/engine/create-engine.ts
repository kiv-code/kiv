import { createEventBus } from "../events";
import type { FontProvider } from "../fonts";
import { systemFontProvider } from "../fonts";
import type { MediaProvider } from "../media";
import type {
	EditorExtensionPoints,
	KivPlugin,
	PluginContext,
} from "../plugin";
import { createRegistry } from "../registry";
import type { ResolveContext } from "../resolver";
import { resolveNode } from "../resolver";
import type { CompiledNode } from "../schema";
import type { ServicesContainer } from "../services";
import type { ThemeOverride, ThemeTokens } from "../theme";
import { resolveTheme, themeToCssVars } from "../theme";
import type { I18nConfig, KivNode } from "../types";

export interface CreateEngineOptions {
	theme?: ThemeOverride;
	i18n?: I18nConfig;
	plugins?: KivPlugin[];
	nodes?: CompiledNode[];
	media?: { provider: MediaProvider };
	/** Typefaces the project ships. Without one, only the generic system families are offered. */
	fonts?: { provider: FontProvider };
	services?: ServicesContainer;
}

export interface KivEngine {
	bus: ReturnType<typeof createEventBus>;
	registry: ReturnType<typeof createRegistry>;
	theme: ThemeTokens;
	i18n: I18nConfig;
	media?: MediaProvider;
	fonts: FontProvider;
	services: ServicesContainer;
	use(plugin: KivPlugin): void;
	css(): string;
	resolve(node: KivNode, ctx: ResolveContext): ReturnType<typeof resolveNode>;
	/** Set editor extension points so plugins can register UI. Triggers `onEditorReady` on all installed plugins. */
	setEditorExtensions(ext: EditorExtensionPoints): void;
}

const DEFAULT_I18N: I18nConfig = {
	default: "en",
	supported: ["en"],
};

export function createEngine(options: CreateEngineOptions = {}): KivEngine {
	const bus = createEventBus();
	const registry = createRegistry();
	const theme = resolveTheme(options.theme);
	const i18n = options.i18n ?? DEFAULT_I18N;
	const media = options.media?.provider;
	const fonts = options.fonts?.provider ?? systemFontProvider;
	const services = options.services ?? {};
	const installed = new Set<string>();
	const installedPlugins: KivPlugin[] = [];
	let editorExtensions: EditorExtensionPoints | null = null;

	if (options.nodes) {
		registry.registerMany(options.nodes);
	}

	function use(plugin: KivPlugin): void {
		if (installed.has(plugin.name)) {
			throw new Error(
				`[kiv] The plugin "${plugin.name}" is already installed.`,
			);
		}
		const ctx: PluginContext = {
			bus,
			registry,
			theme,
			i18n,
			media,
			services,
			editor: editorExtensions ?? undefined,
		};
		plugin.install(ctx);
		installed.add(plugin.name);
		installedPlugins.push(plugin);
	}

	if (options.plugins) {
		for (const plugin of options.plugins) {
			use(plugin);
		}
	}

	function setEditorExtensions(ext: EditorExtensionPoints): void {
		editorExtensions = ext;
		bus.emit("editor.ready", undefined);
		const ctx: PluginContext = {
			bus,
			registry,
			theme,
			i18n,
			media,
			services,
			editor: ext,
		};
		for (const plugin of installedPlugins) {
			plugin.onEditorReady?.(ctx);
		}
	}

	function css(): string {
		const vars = themeToCssVars(theme);
		const declarations = Object.entries(vars)
			.map(([k, v]) => `  ${k}: ${v};`)
			.join("\n");
		// The provider's @font-face/@import has to come first — CSS requires
		// @import before any other rule.
		const fontCss = fonts.stylesheet?.() ?? "";
		return `${fontCss ? `${fontCss}\n` : ""}:root {\n${declarations}\n}`;
	}

	function resolve(node: KivNode, ctx: ResolveContext) {
		return resolveNode(node, ctx);
	}

	return {
		bus,
		registry,
		theme,
		i18n,
		media,
		fonts,
		services,
		use,
		css,
		resolve,
		setEditorExtensions,
	};
}
