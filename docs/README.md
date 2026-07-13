# Documentación de Kiv

Kiv es un motor de edición visual headless, JSON-driven y basado en plugins — el
objetivo es un editor visuaVl reutilizable (estilo Elementor/Framer/Webflow) que
cualquier aplicación pueda integrar sobre su propio contenido, sin acoplarse a un
framework de UI específico más allá de Vue 3 (React planeado a futuro).

Esta carpeta es la fuente de verdad para usar Kiv **fuera** de este monorepo — en
cualquier proyecto nuevo o existente.

## Índice

| Documento                                                           | Para qué sirve                                                                                                            | Estado       |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------ |
| [Instalación](./installation.md)                                    | Cómo instalar Kiv desde cero (monorepo local o futuro paquete npm publicado).                                             | ✅ Escrito   |
| [Arquitectura](./architecture.md)                                   | Cómo está organizado internamente — capas, flujo de dependencias, reglas invariantes.                                     | ✅ Escrito   |
| [Migración](./migration.md)                                         | Cómo integrar Kiv en un proyecto **existente** sin perder compatibilidad con su contenido actual — patrón de adaptadores. | ✅ Escrito   |
| [Engine](./engine.md)                                               | Cómo funciona `@kivcode/engine` — document model, registry, schema de campos, historial, plugins.                             | 🚧 Pendiente |
| [Editor](./editor.md)                                               | Cómo extender `@kivcode/vue-editor` — extension points, controles de campo custom, paneles.                                   | 🚧 Pendiente |
| [Crear un Node](./creating-a-node.md)                               | Guía completa paso a paso para definir un nodo nuevo en `@kivcode/nodes`.                                                     | 🚧 Pendiente |
| [Crear un control de Inspector](./creating-an-inspector-control.md) | Guía completa para un control de campo custom (`pluginControl`).                                                          | 🚧 Pendiente |
| [Sistema de Templates](./templates.md)                              | Cómo crear templates de página completa y templates de bloque de contenido.                                               | 🚧 Pendiente |
| [API pública](./api-reference.md)                                   | Qué clases/funciones son la superficie pública de cada paquete.                                                           | 🚧 Pendiente |
| [Eventos](./events.md)                                              | Cómo reaccionar a cambios del editor vía el `EventBus`.                                                                   | 🚧 Pendiente |
| [Plugins](./plugins.md)                                             | Cómo extender Kiv sin tocar el núcleo (`createEngine({ plugins })`).                                                      | 🚧 Pendiente |
| [Buenas prácticas](./best-practices.md)                             | Qué hacer y qué evitar al construir sobre Kiv.                                                                            | 🚧 Pendiente |
| [Ejemplos](./examples.md)                                           | Casos reales de uso, referenciando integraciones concretas.                                                               | 🚧 Pendiente |
| [Troubleshooting](./troubleshooting.md)                             | Problemas comunes y sus soluciones.                                                                                       | 🚧 Pendiente |

## Convención de este directorio

- Cada documento es independiente y enlazable — no asumas que el lector leyó los
  anteriores en orden, pero sí puedes enlazar a ellos.
- Los documentos marcados 🚧 tienen ya su esqueleto (encabezados + alcance
  definido) — completarlos es la continuación natural de este trabajo.
- Cuando una integración concreta (por ejemplo, KMJK Events) descubra que Kiv le
  falta algo, ese hallazgo se documenta en el **repo de esa integración**, no aquí
  — este directorio describe a Kiv como producto, no las particularidades de un
  consumidor específico. Ver `migration.md` para el patrón que separa ambas cosas.
