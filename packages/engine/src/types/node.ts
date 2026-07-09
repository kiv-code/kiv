import type { Responsive } from "./values";

export interface KivNode {
	/** Identificador único dentro del documento. */
	id: string;
	/** Tipo registrado: 'section', 'heading', o uno custom como 'hero-banner'. */
	type: string;
	/** Propiedades del nodo. El resolver las convierte en props planas. */
	props: Record<string, unknown>;
	/** Hijos organizados por slot nombrado. */
	slots?: Record<string, KivNode[]>;
	/** Datos de plugins. NO afecta al render. */
	meta?: Record<string, unknown>;
	/** Si true, el editor bloquea la selección/edición/drag de este nodo. */
	locked?: boolean;
	/** Visibilidad del nodo, opcionalmente por breakpoint. Por defecto visible. */
	visible?: Responsive<boolean>;
}
