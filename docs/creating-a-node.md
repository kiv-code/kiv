# Crear un Node

> 🚧 Pendiente de redactar. Alcance y esqueleto del ejemplo a continuación.

## Alcance de este documento

Guía completa, paso a paso, con un ejemplo real de principio a fin (proponer:
un nodo "Badge" simple, ya identificado como faltante en el análisis de
integración con KMJK Events — buen primer ejemplo porque es genuinamente pequeño).

1. **Definir el schema** — `defineNode()` en `@kivcode/nodes` (o en tu propio paquete
   de plugin si el nodo es específico de tu dominio, ver
   [Migración](./migration.md#paso-3--cuándo-escribir-un-nodo-nuevo-vs-cuándo-no)):
   `type`, `category`, `label`, `icon`, `description`, `fields`, `slotConstraints`
   (si acepta hijos), `toHtml`.
2. **Reusar helpers de campo compartidos** antes de declarar un `FieldDescriptor`
   a mano — repasar el catálogo en `packages/nodes/src/*-field(s).ts` primero.
   Este es el punto de disciplina más importante: la auditoría de este proyecto
   encontró y corrigió múltiples casos de nodos reimplementando a mano lo que un
   helper ya resolvía — no repetir ese patrón.
3. **Registrar el nodo** — agregarlo a `ALL_NODES` (o al array equivalente de tu
   paquete de plugin) para que `registry.registerMany([...ALL_NODES])` lo
   incluya.
4. **Escribir el componente Vue** (`@kivcode/vue`) — un `.vue` por nodo, inyectando
   `KIV_EDITOR_MODE_KEY`/`KIV_BUS_KEY` si el nodo tiene interacción real
   (ver `ModalNode.vue` como referencia de un nodo con estado propio).
5. **`toHtml()` — mantenerlo en paridad exacta con el componente Vue.** Ejemplo
   real de por qué importa: un bug encontrado en esta misma auditoría donde el
   estilo de un ícono en `toHtml()` no coincidía con el renderizado Vue en vivo.
6. **Escribir tests** — como mínimo: "los defaults satisfacen el propio schema"
   (patrón ya existente en `packages/nodes/src/nodes.test.ts`), más un test de
   `toHtml()` por cada rama de comportamiento no trivial del nodo (ver el patrón
   agregado para `video`/`divider`/`link`/`icon`/`rich-text` en la Fase 5 de la
   auditoría — cada test ahí encontró o hubiera podido encontrar un bug real).
7. **Ícono en `NodeIcon.vue`** (`@kivcode/vue-editor`) — si el nodo no tiene un ícono
   dedicado, cae a un fallback genérico; documentar cuándo vale la pena agregar
   uno propio.

## Errores comunes a advertir explícitamente

- Olvidar `withDefaults()` en el componente Vue para props booleanas con
  default `true` — Vue coacciona un prop booleano omitido a `false`, no a
  `undefined`, si no tiene default explícito. Encontrado dos veces en la
  auditoría de este proyecto (`ContainerNode.vue` y `ModalNode.vue`) — merece
  mención explícita aquí para que no se repita una tercera vez.
- Declarar un campo con nombre distinto al que `toHtml()`/el componente Vue
  realmente leen (encontrado en los templates de contenido: nodos `icon` con
  props `name`/`size` en vez de `icon`/`iconSize`, silenciosamente sin efecto).

## Referencias mientras se redacta

Código fuente: cualquier archivo en `packages/nodes/src/content/` o
`packages/nodes/src/layout/` como referencia de un nodo ya completo.
