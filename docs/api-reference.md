# API pública

> 🚧 Pendiente de redactar. Alcance a continuación.

## Alcance de este documento

Un documento de referencia (no narrativo) listando, por paquete, exactamente qué
se considera API pública estable — es decir, qué puede usar un consumidor externo
con la expectativa de que un cambio ahí sea un breaking change real, vs. qué es
detalle interno.

### `@kivcode/engine`
Extraer del `export` real de `packages/engine/src/index.ts` y documentar cada
símbolo en una tabla: nombre, tipo (clase/función/tipo), una línea de qué hace,
link a la sección narrativa correspondiente (`engine.md`).

### `@kivcode/nodes`
Cada `*Node` exportado (schema), cada helper de campo compartido (`f.*` no
incluido, eso es de `@kivcode/engine`), constantes de escala (`SPACING`, `GAP`,
`RADIUS`, `SHADOW`, etc.) — documentar cuáles son seguras de usar directamente
desde fuera vs. cuáles son detalle de implementación de un nodo específico.

### `@kivcode/nodes-interactive`
Igual patrón, más `CONTENT_TEMPLATES`/`ContentTemplate` (ver `templates.md`).

### `@kivcode/vue`
Componentes exportados, `KivRenderer`/`KivNodeRenderer`, `defaultRegistry`,
claves de inyección (`KIV_EDITOR_MODE_KEY`, `KIV_BUS_KEY`, `KIV_MEDIA_KEY`,
`KIV_SERVICES_KEY`) — documentar qué valor tienen por default fuera de un
`KivRenderer`/`KivEditor` (importante para quien monte un nodo suelto sin el
árbol completo).

### `@kivcode/vue-editor`
`KivEditor`, `useEditorStore`/`EditorStore` (API completa, no solo el shape),
`EditorExtensions`, todas las claves de contexto exportadas.

## Convención de "estable" vs. "interno"

Definir explícitamente la regla antes de llenar las tablas: por ejemplo, "todo lo
exportado desde el `index.ts` de un paquete es público; cualquier import
profundo (`@kivcode/vue/src/...`) nunca es soportado" — esto ya es una regla del
proyecto (`CLAUDE.md`: "Closed exports maps — no deep imports"), este documento
solo la hace explícita para consumidores externos que no leen `CLAUDE.md`.
