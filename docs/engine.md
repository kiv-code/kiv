# Engine

`@kivcode/engine` es el núcleo headless de Kiv: modelo de documento, registro de
nodos, esquema de campos, motor de edición (selección + historial), bus de
eventos, sistema de plugins, resolución de temas y `renderToHtml()`. No importa
ningún framework de UI — su única dependencia real es `@vue/reactivity`, usada
internamente para el motor de edición, no para renderizar nada.

Todo lo que exporta este paquete se importa desde el punto de entrada público:

```ts
import { createEngine, defineNode, f, renderToHtml } from "@kivcode/engine";
```

Nunca desde una ruta interna (`@kivcode/engine/src/...`) — eso no es soportado.

## El document model

Un documento Kiv es JSON puro: un árbol de `KivNode` con metadata de idioma y
SEO a nivel de documento.

```ts
interface KivDocument {
  schemaVersion: number; // habilita migraciones — nunca se quita
  root: KivNode;          // normalmente de tipo "page"
  i18n: I18nConfig;       // { default, supported, fallback? }
  theme?: Record<string, unknown>;
  seo?: SeoMeta;           // ver @kivcode/plugin-seo
}

interface KivNode {
  id: string;
  type: string;                          // "section", "heading", "hero-banner"...
  props: Record<string, unknown>;
  slots?: Record<string, KivNode[]>;     // hijos organizados por slot nombrado
  meta?: Record<string, unknown>;        // datos de plugin, no afecta el render
  locked?: boolean;                      // bloquea selección/edición en el editor
  visible?: Responsive<boolean>;
}
```

Ejemplo mínimo de documento:

```json
{
  "schemaVersion": 3,
  "i18n": { "default": "es", "supported": ["es", "en"] },
  "root": {
    "id": "root",
    "type": "page",
    "props": {},
    "slots": {
      "default": [
        {
          "id": "hero-heading",
          "type": "heading",
          "props": { "text": { "$t": { "es": "Bienvenido", "en": "Welcome" } } }
        }
      ]
    }
  }
}
```

La API pública del producto **es esta forma JSON**, no las clases internas del
engine — cualquier integración debería poder razonar sobre un documento leyendo
su JSON, no el código fuente.

### Migraciones de schema

`schemaVersion` sube cada vez que la forma de un documento cambia de manera
incompatible (un nuevo campo requerido, un renombre de prop). El engine expone:

```ts
import { CURRENT_SCHEMA_VERSION, migrateDocument, migrations } from "@kivcode/engine";

const upToDate = migrateDocument(oldDocument);
```

`migrateDocument()` aplica en orden las migraciones necesarias hasta llevar el
documento a `CURRENT_SCHEMA_VERSION`. Un consumidor que persiste documentos debe
pasarlos por `migrateDocument()` al cargarlos, no solo al escribirlos — así un
documento guardado con una versión vieja de Kiv se sigue abriendo tras un
`pnpm update`. Ver [Troubleshooting](./troubleshooting.md) para el caso de una
migración que falla.

## Registry

El `Registry` es un mapa `type → CompiledNode`. Es donde vive "qué tipos de
nodo existen" para una instancia de engine/editor — nunca es un singleton
global.

```ts
import { createRegistry } from "@kivcode/engine";
import { ALL_NODES } from "@kivcode/nodes";

const registry = createRegistry();
registry.registerMany(ALL_NODES);

registry.get("heading");   // CompiledNode | undefined
registry.has("heading");   // boolean
registry.types();          // string[]
registry.all();            // CompiledNode[] — para construir una paleta
```

`register()` lanza si el tipo ya existe — evita que un nodo se pise en
silencio por un registro duplicado (por ejemplo, dos plugins registrando el
mismo `type` por accidente).

## `defineNode()` y `CompiledNode`

Un nodo se define con `defineNode()`, que compila un `NodeDefinition` (campos +
metadata de editor) a un `CompiledNode` (con un `schema` Zod derivado y los
`defaults` extraídos de cada campo):

```ts
interface NodeDefinition<F extends FieldMap = FieldMap> {
  type: string;
  fields: F;
  category?: string;
  label?: string;
  icon?: string;
  description?: string;
  slotConstraints?: Record<string, string[]>; // qué tipos acepta cada slot
  toHtml?: ToHtml;                              // ver renderToHtml() abajo
}
```

`defineNode()` no valida nada por sí solo — produce `schema` (un `z.object`
cuyas claves son opcionales, derivadas de `field.schema` de cada
`FieldDescriptor`) y `defaults` (los valores `default` declarados). El
`Registry` no ejecuta esta validación automáticamente en cada mutación; está
disponible para quien quiera validar un documento explícitamente (por ejemplo,
antes de persistirlo).

Ver [Crear un Node](./creating-a-node.md) para la guía completa paso a paso, y
[Buenas prácticas](./best-practices.md) para el catálogo de helpers de campo
compartidos que conviene revisar antes de escribir un `FieldDescriptor` a mano.

## `FieldDescriptor` y los helpers `f.*`

Cada prop editable de un nodo se declara como un `FieldDescriptor`:

```ts
interface FieldDescriptor<T = unknown> {
  schema: ZodType;                 // validador del valor base
  control: FieldControl;           // "text" | "textarea" | "number" | "select" | "boolean" | "color"
  default?: T;
  label?: string;
  group?: string;                  // sección del inspector: "Layout", "Typography"...
  localizable?: boolean;           // el valor puede variar por locale
  responsive?: boolean;            // el valor puede variar por breakpoint
  options?: ReadonlyArray<{ label: string; value: T }>; // solo para "select"
  inline?: boolean;                // editable directo en el canvas
  showIf?: { field: string; equals: string | string[] };
  placeholder?: string;
  hint?: string;
  required?: boolean;
  hidden?: boolean;
  pluginControl?: string;          // override: usar un control custom registrado
  sliderUnits?: ReadonlyArray<{ unit: string; min: number; max: number; step?: number }>;
  spacingScale?: Readonly<Record<string, string>>;
  allowAuto?: boolean;
  autoLabel?: string;
}
```

`@kivcode/engine` exporta el helper `f` con constructores para los tipos base:

```ts
import { f } from "@kivcode/engine";

const fields = {
  text: f.text({ label: "Texto", default: "Hola" }),
  description: f.textarea({ label: "Descripción" }),
  size: f.number({ label: "Tamaño", default: 16 }),
  visible: f.boolean({ label: "Visible", default: true }),
  bg: f.color({ label: "Color de fondo" }),
  align: f.select(["left", "center", "right"] as const, { label: "Alineación", default: "left" }),
};
```

`f.select()` acepta valores planos (`["left", "center", "right"]`) y deriva las
`options` del inspector automáticamente (`label` = el propio valor como
string). `localizable` y `responsive` no son constructores separados — son
flags sobre cualquier `FieldDescriptor`; el resolver es quien interpreta el
valor guardado como `Responsive<T>`/`Localizable<T>` cuando corresponde (ver
más abajo).

`@kivcode/nodes` agrega, encima de estos, helpers de campo compuestos
(`typographyFields`, `spacingField`, `sizeField`, etc.) para conceptos que se
repiten entre nodos — catalogados en
[Crear un Node](./creating-a-node.md#helpers-de-campo-compartidos).

## Resolución `Responsive<T>` → `Localizable<T>`

Son **dos ejes independientes**, nunca mezclados en un único wrapper:

```ts
type ResponsiveObject<T> = { base: T; sm?: T; md?: T; lg?: T; xl?: T };
type Responsive<T> = T | ResponsiveObject<T>;

interface LocalizedObject<T> { $t: Record<Locale, T> }
type Localizable<T> = T | LocalizedObject<T>;
```

Un valor guardado puede ser un valor simple, un `ResponsiveObject`, o un
`LocalizedObject` — nunca ambos anidados por convención del propio wrapper (un
campo puede en teoría guardar `{ base: { $t: {...} } }`, pero eso es un detalle
de cómo cada axis interpreta "un valor", no un tercer wrapper combinado).

`resolveProps()` aplica ambos ejes **en orden fijo: responsive primero, luego
locale**:

```ts
import { resolveProps } from "@kivcode/engine";

const flatProps = resolveProps(node.props, {
  breakpoint: "md",
  locale: "en",
  fallbackLocale: "es",
});
```

- **Responsive**: mobile-first. Si `breakpoint` es `"md"` y el valor solo
  define `base` y `lg`, se resuelve el valor de `base` (camina hacia abajo
  desde el breakpoint pedido hasta encontrar el primero definido; si ninguno
  aplica, cae a `base`).
- **Localizable**: si el locale pedido no está en `$t`, cae a `fallbackLocale`
  si está presente; si tampoco, usa la primera traducción disponible en el
  objeto (para que el render nunca quede vacío por una traducción faltante).

`isResponsive()`/`isLocalized()` son los guards que distinguen "esto es un
wrapper" de "esto es un valor real que casualmente tiene una key `base` o
`$t`" (chequean que sea un objeto plano con esa key).

## `EventBus`

Ver [Eventos](./events.md) para el catálogo completo. En resumen: `createEventBus()`
produce un bus con `emit`/`on`/`once`/`off`/`clear`, soporte de wildcard por
namespace (`"node.*"`) y wildcard global (`"*"`), y aislamiento de errores
(un handler que lanza no rompe a los demás — se enruta a `onError` si se
configuró). El tipo de eventos (`KivEventMap`) es extensible por module
augmentation, así un nodo con estado propio o un plugin externo puede declarar
sus propios eventos tipados.

## Sistema de plugins

Ver [Plugins](./plugins.md) para la guía completa. En resumen: un plugin es
`{ name, install(ctx), onEditorReady?(ctx) }`, y se instala pasándolo a
`createEngine({ plugins: [...] })`. `ctx` (`PluginContext`) trae
`{ bus, registry, theme, i18n, media?, services, editor? }` — `editor` solo
está presente una vez que un editor montado llamó `engine.setEditorExtensions()`.

## `createEngine()`

```ts
interface CreateEngineOptions {
  theme?: ThemeOverride;
  i18n?: I18nConfig;
  plugins?: KivPlugin[];
  nodes?: CompiledNode[];              // se registran automáticamente
  media?: { provider: MediaProvider };
  fonts?: { provider: FontProvider };  // sin este, solo se ofrecen sans/serif/mono del sistema
  services?: ServicesContainer;
}
```

Ejemplo end-to-end:

```ts
import { createEngine } from "@kivcode/engine";
import { ALL_NODES } from "@kivcode/nodes";
import { seoPlugin } from "@kivcode/plugin-seo";
import { myMediaProvider } from "./my-media-provider";
import { myFontProvider } from "./my-font-provider";

const engine = createEngine({
  nodes: ALL_NODES,
  media: { provider: myMediaProvider },
  fonts: { provider: myFontProvider },
  plugins: [seoPlugin({ origin: "https://miapp.com" })],
  theme: { colors: { primary: "#1d4ed8" } },
});

engine.bus.on("node.propsChanged", (payload) => {
  console.log("cambió", payload);
});

const html = document.createElement("style");
html.textContent = engine.css(); // variables CSS del tema + @font-face/@import de fonts
document.head.appendChild(html);
```

`engine` (`KivEngine`) expone: `bus`, `registry`, `theme` (tokens ya resueltos,
merge de `defaultTheme` + `theme` override), `i18n`, `media` (el provider crudo,
si se configuró), `fonts` (siempre presente — `systemFontProvider` por
default), `services`, `use(plugin)` (instalar un plugin después de crear el
engine), `css()` (CSS de tema + fuentes, listo para inyectar en un `<style>`),
`resolve(node, ctx)` (atajo a `resolveNode()`) y `setEditorExtensions(ext)`
(lo llama internamente `@kivcode/vue-editor`/`@kivcode/react-editor` al montar — dispara
`onEditorReady` en todos los plugins instalados).

## `renderToHtml()`

Recorre un `KivDocument` y produce un string HTML estático, sin Vue/React/DOM —
pensado para SSR, export a archivo, o email:

```ts
import { renderToHtml } from "@kivcode/engine";

const html = renderToHtml(document, {
  registry,
  locale: "es",       // default: document.i18n.default
  breakpoint: "base",  // default: "base"
});
```

Cada nodo se renderiza llamando a su `toHtml(props, children, ctx)` (`props` ya
resueltos vía `resolveProps`, `children` es un mapa `slot → HTML concatenado de
esos hijos`). Un tipo registrado sin `toHtml` cae a un `<div data-kiv-type="..."
data-kiv-node-id="...">` inerte con sus hijos dentro, en vez de fallar — así un
nodo a medio implementar no rompe el export completo, aunque tampoco produce
el HTML "real" hasta que se le escriba un `toHtml`.

`renderToHtml()` no es lo mismo que el render de `@kivcode/vue`/`@kivcode/react`: no
hay hidratación, interactividad, ni componentes — es HTML plano con estilos
inline resueltos por `toHtml`. Es la vía correcta cuando el consumidor
necesita el documento fuera de una app Vue/React (un email, un PDF, una copia
estática servida sin JS).

## `MediaProvider` y `FontProvider`

Estos son los dos contratos de "provider" que un consumidor implementa e
inyecta vía `createEngine({ media, fonts })` — el engine nunca sabe nada de S3,
Cloudinary, o qué tipografías carga la app.

### `MediaProvider`

```ts
interface MediaProvider {
  upload(file: File, opts?: UploadOptions): Promise<MediaAsset>;
  resolve(src: string, transforms?: ImageTransform): string;
  delete(url: string): Promise<void>;
  list?(query?: MediaListQuery): Promise<MediaAsset[]>; // opcional
}

interface MediaAsset {
  id: string;
  url: string;
  type: "image" | "video" | "file";
  width?: number;
  height?: number;
  filename?: string; // nombre real subido — para inferir ícono/extensión
  alt?: string;       // texto de accesibilidad/SEO, editable por el usuario
  meta?: Record<string, unknown>;
}
```

`list()` es opcional a propósito: un provider que solo soporta subida/resolve
directos (sin biblioteca enumerable) puede omitirlo — el media browser del
editor cae a una vista de solo-subida cuando falta.

Ejemplo mínimo (adaptador sobre un backend propio):

```ts
const myMediaProvider: MediaProvider = {
  async upload(file, opts) {
    const form = new FormData();
    form.append("file", file);
    if (opts?.folder) form.append("folder", opts.folder);
    const res = await fetch("/api/media", { method: "POST", body: form });
    const data = await res.json();
    return { id: data.id, url: data.url, type: "image", filename: file.name };
  },
  resolve(src, transforms) {
    if (!transforms) return src;
    const params = new URLSearchParams();
    if (transforms.width) params.set("w", String(transforms.width));
    if (transforms.format) params.set("f", transforms.format);
    return `${src}?${params}`;
  },
  async delete(url) {
    await fetch(`/api/media?url=${encodeURIComponent(url)}`, { method: "DELETE" });
  },
};
```

### `FontProvider`

```ts
interface KivFont {
  id: string;               // identificador estable guardado en el documento
  label: string;             // nombre mostrado en el picker
  stack: string;              // valor CSS real, ej. '"Montserrat", sans-serif'
  weights: number[];          // solo los pesos que la familia realmente tiene
  italic?: boolean;
  category?: "sans" | "serif" | "mono" | "display" | "handwriting";
}

interface FontProvider {
  list(): KivFont[];
  stylesheet?(): string; // CSS/@import/@font-face que la página necesita, si aplica
}
```

`list()` es síncrono a propósito: qué fuentes trae un proyecto es una decisión
de build-time, no contenido de usuario, y el picker la necesita de inmediato
para filtrar pesos disponibles. Un documento guarda el `id` del `KivFont`
(`"montserrat"`, o un rol semántico como `"heading"`), nunca el stack crudo —
así cambiar la tipografía de marca en un solo lugar re-renderiza todos los
nodos que usan ese rol.

```ts
const myFontProvider: FontProvider = {
  list: () => [
    { id: "heading", label: "Poppins", stack: '"Poppins", sans-serif', weights: [500, 600, 700] },
    { id: "body", label: "Inter", stack: '"Inter", sans-serif', weights: [400, 500] },
  ],
  stylesheet: () => `@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500&display=swap");`,
};
```

Sin un `fonts.provider` configurado, `engine.fonts` cae a `systemFontProvider`
(`SYSTEM_FONTS`: `sans`/`serif`/`mono` genéricos) — nunca inventa una
tipografía que el proyecto no declaró. Ver
[Troubleshooting](./troubleshooting.md#elegí-una-fuente-pero-no-cambió-nada-visualmente)
para el error más común relacionado con fuentes.

## Ver también

- [Arquitectura](./architecture.md) — resumen de alto nivel de todos los paquetes.
- [Crear un Node](./creating-a-node.md) — cómo usar `defineNode()`/`f.*` en la práctica.
- [Eventos](./events.md) y [Plugins](./plugins.md) — detalle de `EventBus` y `KivPlugin`.
- [API pública](./api-reference.md) — tabla completa de exports de `@kivcode/engine`.
