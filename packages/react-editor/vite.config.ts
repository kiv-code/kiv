import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		react(),
		dts({
			tsconfigPath: "./tsconfig.json",
			exclude: ["**/*.test.ts", "**/*.test.tsx"],
		}),
	],
	test: {
		environment: "happy-dom",
	},
	build: {
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			name: "KivReactEditor",
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
				"@kivcode/nodes-interactive",
				"@kivcode/react",
			],
			output: {
				// See packages/react/vite.config.ts for why this is explicit —
				// there's no Vue-SFC-style automatic style extraction in React.
				assetFileNames: "react-editor.css",
			},
		},
	},
});
