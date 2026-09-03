export const version = "0.0.0";
export {
	cloneNodeTree,
	deserializeNode,
	serializeNode,
} from "./clipboard";
export {
	type AddNodeInput,
	addNode,
	cloneDocument,
	type DocumentMutations,
	duplicateNode,
	EditorEngine,
	type EditorEngineOptions,
	findNode,
	HistoryManager,
	type HistoryMeta,
	type HistoryOptions,
	type MoveNodeInput,
	moveNode,
	type NodeLocation,
	nodeIdExists,
	removeNode,
	renameNode,
	type SelectionListener,
	SelectionState,
	setNodeFlags,
	updateNodeProps,
	updateSeoMeta,
} from "./editor";
export {
	type CreateEngineOptions,
	createEngine,
	type KivEngine,
} from "./engine";
export {
	createEventBus,
	type ErrorHandler,
	type EventBus,
	type EventHandler,
	type KivEventMap,
	type WildcardHandler,
} from "./events";
export {
	DEFAULT_FONT_WEIGHTS,
	type FontProvider,
	fontWeights,
	type KivFont,
	resolveFontStack,
	SYSTEM_FONTS,
	systemFontProvider,
} from "./fonts";
export {
	buildLocaleFallbackChain,
	validateI18nConfig,
} from "./i18n";
export type {
	ImageTransform,
	MediaAsset,
	MediaListQuery,
	MediaProvider,
	UploadOptions,
} from "./media";
export {
	CURRENT_SCHEMA_VERSION,
	type Migration,
	migrateDocument,
	migrations,
} from "./migrations";
export type {
	ComponentDef,
	EditorExtensionPoints,
	InspectorTab,
	KivPlugin,
	PaletteItem,
	PluginContext,
	ShortcutDef,
	ToolbarButton,
} from "./plugin";
export { createRegistry, Registry } from "./registry";
export { type RenderContext, type RenderOptions, renderToHtml } from "./render";
export {
	isLocalized,
	isResponsive,
	type ResolveContext,
	resolveLocalized,
	resolveNode,
	resolveProps,
	resolveResponsive,
} from "./resolver";
export {
	type CompiledNode,
	defineNode,
	type FieldControl,
	type FieldDescriptor,
	type FieldMap,
	f,
	type InferProps,
	type NodeDefinition,
	type ToHtml,
	type ToHtmlContext,
} from "./schema";
export type {
	ApiClient,
	AuthProvider,
	AuthUser,
	RouterProvider,
	ServicesContainer,
	StorageProvider,
} from "./services";
export { BUILT_IN_TEMPLATES, type PageTemplate } from "./templates";
export {
	defaultTheme,
	resolveTheme,
	type ThemeOverride,
	type ThemeTokens,
	themeToCssVars,
	tokenRef,
} from "./theme";
export type {
	Breakpoint,
	I18nConfig,
	KivDocument,
	KivNode,
	Locale,
	Localizable,
	LocalizedObject,
	Responsive,
	ResponsiveObject,
	SeoMeta,
} from "./types";
