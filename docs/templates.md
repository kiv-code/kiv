# Sistema de Templates

> 🚧 Pendiente de redactar. Alcance a continuación.

## Alcance de este documento

Kiv tiene **dos sistemas de templates distintos** — este documento debe dejar
clara la diferencia desde la primera línea, es la fuente de confusión más
probable:

### 1. Templates de página completa (`@kivcode/engine`)

- `PageTemplate` (`id`, `name`, `description`, `category`, `thumbnail`, un
  `KivDocument` completo) — reemplazan el documento entero al aplicarse.
- `BUILT_IN_TEMPLATES` — catálogo actual (blank, landing, about, contact,
  blog-post).
- UI: `KivTemplateBrowser.vue`, aplicado vía `store.loadDocument()` (un solo paso
  de undo).
- **Cómo agregar uno nuevo**: estructura de archivo recomendada, convención de ids
  determinísticos y semánticos por nodo (ver `packages/engine/src/templates/built-in.ts`
  como referencia de estilo — cada nodo tiene un id legible, no generado
  aleatoriamente).

### 2. Templates de bloque de contenido (`@kivcode/nodes-interactive`)

- `ContentTemplate` (`id`, `label`, `description`, `category`, `icon`, `create()`
  que devuelve un subárbol `KivNode`) — se **insertan** junto a la selección
  actual, no reemplazan el documento.
- `CONTENT_TEMPLATES` — catálogo actual de 20 bloques (Hero, Header, Feature
  Grid, CTA Banner, Banner, Testimonials, Logo Cloud, FAQ, Pricing, Comparison,
  Stats, Cards, Callout, Gallery, Timeline, Contact, Newsletter, Footer, Agenda/
  Schedule, Team Grid).
- UI: `KivBlockLibrary.vue`, insertado vía `cloneNodeTree()` +
  `insertNodeNearSelection()`.
- **Por qué son composición pura, nunca lógica nueva**: cada `ContentTemplate`
  debe construirse exclusivamente combinando nodos ya existentes de
  `@kivcode/nodes`/`@kivcode/nodes-interactive` — si un template "necesita" un concepto
  que ningún nodo cubre, la respuesta es escribir el nodo que falta primero (ver
  [Crear un Node](./creating-a-node.md)), nunca improvisar props ad-hoc dentro
  del template que ningún nodo real interpreta (bug real encontrado y corregido en
  esta auditoría: props `action`/`color`/`height`/`name` en varios templates que
  los nodos correspondientes simplemente no leían).
- **Ids deterministas** — cada `create()` debe producir el mismo árbol cada vez
  que se llama (mismo patrón que los templates de página): nada de `Date.now()`
  ni contadores globales que persistan entre llamadas. La unicidad real al
  insertar se resuelve con `cloneNodeTree()` en el punto de inserción, no dentro
  del propio template.
- **Cómo agregar uno nuevo** — checklist paso a paso con un ejemplo completo.
- **Categorías** — cómo se derivan (`category` en `ContentTemplate`) y cómo se
  filtran en `KivBlockLibrary.vue`; qué hacer si necesitas una categoría nueva.

## Referencias mientras se redacta

Código fuente: `packages/engine/src/templates/`,
`packages/nodes-interactive/src/templates/`,
`packages/vue-editor/src/components/KivTemplateBrowser.vue`,
`packages/vue-editor/src/components/KivBlockLibrary.vue`.
