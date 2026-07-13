# Ejemplos

> 🚧 Pendiente de redactar. Alcance a continuación.

## Alcance de este documento

Casos reales de uso, no sintéticos — cada ejemplo debe apuntar a código real
existente (en este repo o en un consumidor), nunca a un fragmento inventado sin
verificar que corre.

Candidatos ya identificados para esta sección:

1. **Levantar el editor completo desde cero** — apuntando a
   `apps/demos/vue/src/App.vue` como referencia (aclarando que ese archivo es
   parte del demo interno de Kiv, no algo que un consumidor copie tal cual — ver
   [Migración](./migration.md) sobre qué no integrar de `apps/demos/`).
2. **Exportar una página a HTML estático** (`renderToHtml()`) — flujo real del
   botón "Export HTML" del demo.
3. **Un nodo con estado propio** completo — `modal` (`@kivcode/nodes-interactive`)
   como referencia, incluyendo auto-open y el patrón de placeholder en modo
   editor (agregado en esta auditoría) como ejemplo de "UX de configuración que
   se explica sola dentro del propio canvas".
4. **Integrar Kiv en un proyecto con contenido existente** — una vez la
   integración con KMJK Events tenga al menos su Fase 0-1 completa, referenciar
   el adaptador real como el ejemplo de referencia de
   [Migración](./migration.md).
5. **Un plugin real de punta a punta** — usando `@kivcode/plugin-seo` o
   `@kivcode/plugin-a11y` como caso de estudio (no `@kivcode/plugin-analytics`, que es
   deliberadamente minimalista).

## Referencias mientras se redacta

`apps/demos/vue/` (para inspiración de flujo, no para copiar literal),
`PROGRESS.md` (historial de qué se construyó y por qué, útil como fuente de
ejemplos ya narrados).
