# Plugins

> 🚧 Pendiente de redactar. Alcance a continuación.

## Alcance de este documento

- Qué es un plugin en Kiv — un paquete que se pasa a `createEngine({ plugins:
  [...] })` y recibe un `PluginContext` (`editor`, `media`, `services`, `bus`).
- Los dos plugins reales existentes como referencia de patrón:
  `@kivcode/plugin-seo` y `@kivcode/plugin-a11y` (leer su código como los dos ejemplos
  "de producción"; `@kivcode/plugin-analytics` es deliberadamente un ejemplo/demo
  minimalista, útil para el primer contacto pero no representativo de un plugin
  real).
- Qué puede hacer un plugin hoy: registrar controles de campo custom, botones de
  toolbar, items de paleta, suscribirse al `EventBus` — y qué NO puede hacer
  (documentar los límites reales, no los aspiracionales).
- Cómo empaquetar y distribuir un plugin propio (convención de nombre, qué debe
  exportar como mínimo).
- Diferencia entre "escribir un nodo nuevo" (ver
  [Crear un Node](./creating-a-node.md)) y "escribir un plugin" — un plugin no
  necesariamente trae nodos nuevos, y un paquete de nodos nuevos no
  necesariamente necesita ser un plugin formal (puede ser simplemente un paquete
  de `@kivcode/nodes`-compatible que se registra a mano).

## Referencias mientras se redacta

Código fuente: `packages/plugin-seo/`, `packages/plugin-a11y/`,
`packages/plugin-analytics/` (como contraejemplo de "demo, no núcleo" — ver
`migration.md` para por qué no se integra tal cual en un proyecto consumidor),
`packages/engine/src/plugin/`.
