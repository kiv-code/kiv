# Eventos

> 🚧 Pendiente de redactar. Alcance a continuación.

## Alcance de este documento

- Qué es el `EventBus` (`@kivcode/engine`) y cómo se comparte entre `EditorEngine`,
  `KivEditor` y cualquier plugin — un solo bus por instancia de editor, no uno
  por componente.
- Catálogo completo de eventos emitidos por el core (`node.created`,
  `node.propsChanged`, `node.flagsChanged`, `selection.changed`,
  `history.changed`, y cualquier otro confirmado en
  `packages/engine/src/editor/editor-engine.ts`) — payload exacto de cada uno.
- Eventos emitidos por nodos con estado propio (ejemplo real: `modal.opened`/
  `modal.closed` del nodo `modal`) — patrón para que un nodo nuevo con
  interacción propia declare y emita los suyos (`declare module "@kivcode/engine" {
  interface KivEventMap { ... } }`).
- Cómo un plugin externo se suscribe (`ctx.bus.on(...)`) desde
  `createEngine({ plugins })`.
- Cómo un consumidor fuera del sistema de plugins (por ejemplo, tu propio código
  de integración) se suscribe pasando su propio bus a `<KivEditor bus="...">`.
- Diferencia entre reaccionar a eventos (side effects: analytics, auto-guardado)
  vs. interceptar/prevenir una acción (no soportado hoy — documentar
  explícitamente esta limitación si sigue siendo cierta al momento de escribir
  esto, para que nadie intente `preventDefault()` un evento del bus).

## Referencias mientras se redacta

Código fuente: `packages/engine/src/plugin/` (tipos `EditorExtensionPoints`),
`packages/engine/src/editor/editor-engine.ts`, cualquier nodo que declare
`KivEventMap` (buscar `declare module "@kivcode/engine"` en `packages/vue/src/nodes/`).
