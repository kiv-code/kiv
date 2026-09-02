---
"@kivcode/engine": patch
---

Drop the unused `@vue/reactivity` dependency. The engine is framework-agnostic
and now backs a React renderer as well as the Vue one; its built output imports
nothing but `zod`. The dependency only forced an extra copy of
`@vue/reactivity` into consumers' `node_modules` whenever their own Vue
resolved below the declared `^3.5.38`.
