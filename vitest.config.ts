import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test-utils/setup.ts"],
		// Testes ficam num `__tests__` ao lado do arquivo que cobrem.
		include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
	},
});
