import { z } from "zod";
import type { FieldDescriptor } from "./field";

interface BaseOptions<T> {
	default?: T;
	label?: string;
	group?: string;
	localizable?: boolean;
	responsive?: boolean;
	inline?: boolean;
	showIf?: { field: string; equals: string | string[] };
}

function text(opts: BaseOptions<string> = {}): FieldDescriptor<string> {
	return { schema: z.string(), control: "text", ...opts };
}

function textarea(opts: BaseOptions<string> = {}): FieldDescriptor<string> {
	return { schema: z.string(), control: "textarea", ...opts };
}

function number(opts: BaseOptions<number> = {}): FieldDescriptor<number> {
	return { schema: z.number(), control: "number", ...opts };
}

function boolean(opts: BaseOptions<boolean> = {}): FieldDescriptor<boolean> {
	return { schema: z.boolean(), control: "boolean", ...opts };
}

function color(opts: BaseOptions<string> = {}): FieldDescriptor<string> {
	return { schema: z.string(), control: "color", ...opts };
}

/** Select con opciones tipadas. Acepta valores sueltos o {label, value}. */
function select<const T extends string | number>(
	values: ReadonlyArray<T>,
	opts: BaseOptions<T> = {},
): FieldDescriptor<T> {
	return {
		schema: z.enum(values.map(String) as [string, ...string[]]),
		control: "select",
		options: values.map((v) => ({ label: String(v), value: v })),
		...opts,
	};
}

export const f = { text, textarea, number, boolean, color, select };
