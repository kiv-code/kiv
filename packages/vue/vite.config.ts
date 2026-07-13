import { resolve } from "node:path";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		vue(),
		dts({
			tsconfigPath: "./tsconfig.json",
			// Test files have no reason to ship type declarations in the
			// published package — they're not part of the public API.
			exclude: ["**/*.test.ts", "**/*.test.vue"],
		}),
	],
	test: {
		environment: "happy-dom",
	},
	build: {
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			name: "KivVue",
			fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
			formats: ["es"],
		},
		rollupOptions: {
			external: ["vue", "@kivcode/engine", "@kivcode/nodes"],
			output: {
				globals: {
					vue: "Vue",
				},
			},
		},
	},
});
