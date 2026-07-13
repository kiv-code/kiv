import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		tailwindcss(),
		vue(),
		dts({
			tsconfigPath: "./tsconfig.json",
			exclude: ["**/*.test.ts", "**/*.test.vue"],
		}),
	],
	test: {
		environment: "happy-dom",
	},
	build: {
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			name: "KivEditor",
			fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
			formats: ["es"],
		},
		rollupOptions: {
			external: [
				"vue",
				"@kivcode/engine",
				"@kivcode/nodes",
				"@kivcode/nodes-interactive",
				"@kivcode/vue",
			],
			output: {
				globals: { vue: "Vue" },
			},
		},
	},
});
