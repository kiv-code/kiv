# Migración — integrar Kiv en un proyecto existente

Esta guía es el patrón **genérico y reusable** para integrar Kiv en cualquier
proyecto que ya tenga su propio sistema de páginas/contenido. Para un ejemplo
concreto y completo de este patrón aplicado a un proyecto real, ver el análisis y
plan de integración con KMJK Events (vive en el repo de ese proyecto, no aquí, ya
que es específico de ese consumidor — cada integración documenta sus propias
particularidades en su propio repo, siguiendo este patrón).

## Principio rector: Kiv nunca es dueño de tu dato

Si ya tienes contenido almacenado (páginas, bloques, lo que sea) en un formato
propio, **la respuesta casi nunca es migrar ese contenido al formato de Kiv de
forma destructiva.** En su lugar:

1. Construye un **adaptador de lectura**: tu formato → `KivDocument`.
2. Construye un **adaptador de escritura**: `KivDocument` → tu formato (el mismo
   formato de siempre, en la misma tabla/columna de siempre).
3. Kiv edita/renderiza a través de esos adaptadores. Tu base de datos nunca
   necesita un `ALTER`/migración destructiva de datos existentes.
4. El sistema viejo y el nuevo (Kiv) pueden convivir indefinidamente — incluso
   simultáneamente sobre el mismo registro, en momentos distintos — porque ambos
   leen/escriben el mismo formato de almacenamiento real.

Esto convierte cualquier integración en algo **reversible en cualquier momento**:
apagar la ruta/feature-flag que expone Kiv deja tu sistema exactamente como estaba,
porque nunca dejó de ser la fuente de verdad.

## Paso 1 — Mapea tu modelo de contenido al modelo de Kiv

Antes de escribir un adaptador, entiende qué tan cerca está tu formato del modelo
de Kiv:

| Tu formato tiene... | Se traduce a... |
|---|---|
| Una lista plana de "bloques" con `type` + props | Nodos hoja de `@kivcode/nodes` (uno por tipo, ver tabla de equivalencias abajo) |
| Contenedores con columnas/grillas | `section`/`grid`/`column` (ya existen en `@kivcode/nodes`, mapeo casi directo) |
| "Secciones predefinidas" opacas con su propio componente de render fijo | Ver "Nodos opacos de compatibilidad" más abajo — **no las decompongas de entrada** |
| Texto localizado como `{ locale: value }` inline | Probablemente compatible casi 1:1 con `Localizable<T>` de Kiv — confirmar el shape exacto antes de asumirlo |
| Un popup/modal de página | El nodo `modal` de `@kivcode/nodes-interactive` |
| Un tipo de contenido sin ningún análogo en `@kivcode/nodes` | Ver "Cuándo escribir un nodo nuevo" más abajo |

## Paso 2 — Nodos opacos de compatibilidad (para contenido "predefinido" opaco)

Si tu sistema actual tiene secciones/widgets con un componente de render fijo y
propio (piensa: "Hero", "Pricing", "Testimonios" — cada uno con su CSS/lógica ya
construida y probada en producción), **no los reescribas como árboles de nodos
Kiv decompuestos en la primera fase.** En su lugar, define un nodo Kiv "opaco" por
cada uno, cuyo componente Vue simplemente envuelve tu componente ya existente:

```ts
// nodo opaco — mismo shape de props que tu formulario de edición actual
defineNode({
  type: "mi-app-hero",
  category: "mi-app",
  label: "Hero",
  fields: { /* portar el shape de campos de tu formulario actual */ },
});
```

```vue
<!-- el componente NO reescribe nada — reusa el que ya tienes -->
<script setup lang="ts">
import MiHeroExistente from "@/components/MiHeroExistente.vue";
const props = defineProps<Record<string, unknown>>();
</script>
<template><MiHeroExistente v-bind="props" /></template>
```

Esto te da edición dentro de Kiv (Inspector, historial, selección) con **cero
riesgo visual** — el HTML/CSS resultante es literalmente el mismo componente. Solo
decompones a nodos nativos de Kiv el contenido que ya era "libre" en tu sistema
anterior (grillas/columnas/bloques sueltos) — ese es el que se beneficia
inmediatamente de edición completamente flexible.

## Paso 3 — Cuándo escribir un nodo nuevo vs. cuándo no

- Si el contenido es genérico y probablemente útil fuera de tu proyecto (una
  tarjeta de persona, un badge, un contador) → considera proponerlo a `@kivcode/nodes`
  directamente, para que cualquier otro proyecto que integre Kiv se beneficie.
- Si el contenido está atado a datos/lógica de backend específicos de tu dominio
  (un formulario dinámico ligado a un modelo de tu base de datos, por ejemplo) →
  escríbelo como un nodo de **tu propio paquete de plugin** (no lo subas a
  `@kivcode/nodes`), ver [Crear un Node](./creating-a-node.md).

## Paso 4 — El puente de tema

Si tu proyecto ya tiene un sistema de diseño/theming propio (tokens de marca,
modo claro/oscuro, white-label por cliente, etc.), no dejes que Kiv inyecte su
propio tema por defecto compitiendo con el tuyo. Traduce tu tema ya resuelto a la
forma que espera `@kivcode/engine` una vez, en un solo punto de integración — nunca
nodo por nodo.

## Paso 5 — El puente de medios

`@kivcode/engine` expone una interfaz `MediaProvider` pluggable pensada exactamente
para esto — implementa un adaptador delgado sobre tu endpoint de subida de
archivos existente en vez de construir un flujo de subida nuevo.

## Paso 6 — Multi-tenencia / scoping (si aplica)

Kiv no tiene ningún concepto de "tenant", "organización" o "espacio de trabajo" —
y **no debería tenerlo nunca en el core**. Todo el scoping de datos ocurre en tu
capa de adaptador/controlador, antes de construir el `KivDocument` (cargas la fila
correcta ya filtrada) y después de guardarlo (escribes sobre esa misma fila ya
resuelta). Si tu proyecto es multi-tenant, revisa que el binding/autorización de
la ruta que expone el editor de Kiv esté correctamente scopeada — ese es un
problema de tu capa de rutas, no de Kiv.

## Paso 7 — Rollout incremental

Patrón recomendado, en este orden:

1. **Fase de adaptador puro** — sin UI nueva, solo el adaptador de lectura/
   escritura con tests de round-trip (`tu formato → KivDocument → tu formato`
   debe ser idéntico) contra datos reales, no solo fixtures sintéticas.
2. **Fase de renderizado** — reemplaza el renderizado (no la edición) por
   `@kivcode/vue`/`renderToHtml()` detrás de un flag, comparando visualmente contra tu
   pipeline actual antes de exponerlo.
3. **Fase de editor opt-in** — nueva ruta/flag que monta `@kivcode/vue-editor` sobre
   el documento adaptado, conviviendo con tu editor viejo.
4. **Fase de paridad de Inspector** — portar cada campo de tus formularios de
   edición actuales a `FieldDescriptor`s, hasta que el Inspector genérico de Kiv
   cubra el 100% de lo editable hoy.
5. **Fase de templates** — ofrecer la Block Library de Kiv para contenido nuevo.
6. **Rollout progresivo** — flag por unidad (tenant/cliente/sitio), nunca global
   de entrada.
7. **Retiro del editor viejo** — solo cuando el nuevo lleva un período sin
   incidentes acordado con el equipo. El adaptador puede seguir viviendo para
   siempre sin costo real — no es obligatorio migrar el formato de almacenamiento
   en sí, solo el editor que lo produce.

## Anti-patrones a evitar

- ❌ Migrar el formato de almacenamiento existente a `KivDocument` de forma
  destructiva "para simplificar" — el ahorro de código no vale el riesgo sobre
  datos de producción reales.
- ❌ Reescribir secciones/widgets ya probados en producción como árboles de nodos
  decompuestos en la primera fase — usa nodos opacos primero (Paso 2), decompón
  después si de verdad aporta valor.
- ❌ Dejar que Kiv y tu sistema de theming existente inyecten CSS vars/tokens en
  paralelo sin puente — terminan compitiendo y el resultado visual se vuelve
  impredecible.
- ❌ Saltarse los tests de round-trip del adaptador "porque el shape parece
  simple" — el shape real de producción casi siempre tiene combinaciones que una
  fixture sintética no contempla.
