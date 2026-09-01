import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	// This is a single-page kitchen-sink demo bundling every node type at
	// once — not a shipped library, so a bigger single chunk is fine; raise
	// the warning threshold instead of code-splitting a throwaway demo.
	build: {
		chunkSizeWarningLimit: 3000,
	},
});
