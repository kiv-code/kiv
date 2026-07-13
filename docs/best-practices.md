# Buenas prácticas

> 🚧 Pendiente de redactar en forma narrativa completa — la lista siguiente ya es
> sustancia real extraída de la auditoría de este proyecto (commits recientes:
> `checkpoint:`, `fix(editor):`, `refactor(nodes):`, `feat(editor):`,
> `test(nodes):`), no un placeholder genérico. Expandir cada punto con ejemplo de
> código es el trabajo pendiente.

## Hacer

- **Una sola fuente de verdad para cada concepto de campo.** Antes de escribir un
  `FieldDescriptor` a mano, revisar si ya existe un helper compartido
  (`packages/nodes/src/*-field(s).ts`) que lo resuelva. Si dos nodos necesitan
  "casi lo mismo", extender el helper con una opción, no duplicar.
- **`withDefaults()` en cualquier prop booleana con default `true`.** Vue
  coacciona un prop booleano omitido a `false` (no `undefined`) si no tiene
  default explícito — encontrado dos veces en este proyecto
  (`ContainerNode.vue`, `ModalNode.vue`), ambas veces silenciosamente rompiendo
  el comportamiento por defecto.
- **Mantener `toHtml()` y el componente Vue en paridad exacta.** Son dos
  implementaciones del mismo nodo — un cambio visual en una sin la otra es un bug
  de export/SSR silencioso.
- **Ids deterministas en cualquier código que construya un árbol de nodos
  programáticamente** (templates, migraciones, seeds) — nunca `Date.now()` ni
  contadores globales entre llamadas. La unicidad al insertar se resuelve en el
  punto de inserción (`cloneNodeTree()`), no en la construcción del árbol.
- **Batchear mutaciones continuas** (drag, sliders, color pickers) con
  `startBatch()`/`endBatch()` (o el composable `useContinuousEdit`) para que un
  gesto sea un solo paso de undo.
- **Verificar en navegador, no solo con tests.** Varios bugs reales de esta
  auditoría (ícono de trigger del modal nunca renderizado, nodo invisible en el
  canvas del editor con auto-open) solo eran detectables abriendo el editor real
  — el typecheck y los tests pasaban limpios en ambos casos.

## Evitar

- **No dupliques el Inspector.** El Inspector de Kiv es deliberadamente único y
  genérico — la tentación de "un panel especial para este nodo" casi siempre se
  resuelve mejor con un control de campo custom (`pluginControl`).
- **No hardcodees CSS que ya existe como escala/token compartido** (`SPACING`,
  `RADIUS`, `SHADOW`, `GAP` en `@kivcode/nodes`) — usa la escala, no el valor mágico.
- **No metas lógica de negocio específica de un consumidor en `@kivcode/nodes`.** Un
  nodo atado a datos/backend de un proyecto específico vive en el paquete de ese
  proyecto (ver [Migración](./migration.md)), no en el núcleo.
- **No asumas que un prop pasado a un template/nodo realmente se usa** — la
  auditoría encontró varios templates de contenido pasando props que el nodo
  destino simplemente ignoraba (`action`/`color` en vez de `href`/`textColor`,
  `height` en un nodo que solo tiene `width`+`aspectRatio`). Verificar contra el
  `fields` real del nodo, no contra lo que "suena razonable".
- **No migres datos de producción de forma destructiva** al integrar Kiv en un
  proyecto existente — ver el principio rector completo en
  [Migración](./migration.md).
