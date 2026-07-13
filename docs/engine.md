# Engine

> 🚧 Pendiente de redactar. Alcance definido a continuación — completar es la
> continuación natural de este esqueleto.

## Alcance de este documento

- El document model (`KivDocument`, `KivNode`, slots, ids) con ejemplos de JSON
  real.
- `defineNode()` y `CompiledNode` — qué produce, cómo se relaciona con
  `Registry`.
- `FieldDescriptor` y los helpers `f.*` — catálogo completo de tipos de campo
  (text, number, boolean, select, color, responsive, localizable) con ejemplos.
- `EditorEngine`: `SelectionState`, `HistoryManager` (batching, `startBatch`/
  `endBatch`, límite de profundidad), `EventBus` y el catálogo de eventos que
  emite (`node.*`, `selection.changed`, `history.changed`).
- `createEngine()` — todas las opciones (`media`, `services`, `plugins`, tema) con
  un ejemplo end-to-end.
- `renderToHtml()` — cómo y cuándo usarlo (SSR/export/email), diferencias con el
  render de `@kivcode/vue`.
- `MediaProvider`/`ServicesContainer` — contratos completos con un ejemplo de
  implementación real (no solo el tipo).
- Resolución `Responsive<T>` → `Localizable<T>`: orden exacto, comportamiento de
  fallback cuando falta un breakpoint/locale.

## Referencias mientras se redacta

Código fuente: `packages/engine/src/`. Ver también `architecture.md` para el
resumen de alto nivel ya escrito.
