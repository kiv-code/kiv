import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [tailwindcss(), vue()],
	// This is a single-page kitchen-sink demo bundling every node type at
	// once — not a shipped library, so a bigger single chunk is fine; raise
	// the warning threshold instead of code-splitting a throwaway demo.
	build: {
		chunkSizeWarningLimit: 3000,
	},
});
