import type { ZodType } from "zod";

/** Qué control muestra el inspector para este field. */
export type FieldControl =
	| "text"
	| "textarea"
	| "number"
	| "select"
	| "boolean"
	| "color";

/** Descriptor de una propiedad de un nodo. */
export interface FieldDescriptor<T = unknown> {
	/** Validador Zod del valor base (sin envolver en responsive/locale). */
	schema: ZodType;
	/** Control que el inspector renderiza. */
	control: FieldControl;
	/** Valor por defecto al crear el nodo. */
	default?: T;
	/** Etiqueta visible en el inspector. */
	label?: string;
	/** Grupo/sección en el inspector (e.g. "Layout", "Typography", "Background"). */
	group?: string;
	/** Si true, el valor puede traducirse por locale. */
	localizable?: boolean;
	/** Si true, el valor puede variar por breakpoint. */
	responsive?: boolean;
	/** Opciones, solo para control 'select'. */
	options?: ReadonlyArray<{ label: string; value: T }>;
	/** Si true, el campo puede editarse inline en el canvas (click directo sobre el nodo). */
	inline?: boolean;
	/**
	 * Visibilidad condicional en el inspector: el campo solo se muestra si el
	 * prop `field` del nodo es igual a alguno de `equals`. Permite formularios
	 * dinámicos (e.g. mostrar campos de gradiente solo si backgroundType=gradient).
	 * No afecta al render ni al JSON — es puramente una pista para el inspector.
	 */
	showIf?: { field: string; equals: string | string[] };
}
