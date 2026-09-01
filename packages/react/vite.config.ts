import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		react(),
		dts({
			tsconfigPath: "./tsconfig.json",
			// Test files have no reason to ship type declarations in the
			// published package — they're not part of the public API.
			exclude: ["**/*.test.ts", "**/*.test.tsx"],
		}),
	],
	test: {
		environment: "happy-dom",
	},
	build: {
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			name: "KivReact",
			fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
			formats: ["es"],
		},
		rollupOptions: {
			external: [
				"react",
				"react-dom",
				"react/jsx-runtime",
				"@kivcode/engine",
				"@kivcode/nodes",
			],
			output: {
				// Vue's SFC `<style scoped>` blocks get extracted automatically;
				// React has no such mechanism, so src/style.css is imported
				// explicitly from src/index.ts and named here to match this
				// package's "./style" export (mirroring the dist/<pkg>.css
				// convention every sibling package already uses).
				assetFileNames: "react.css",
			},
		},
	},
});
