import { defaultExclude, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [react(), VitePWA()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: [...defaultExclude, "tests/rules/**"]
  },
  resolve: {
    alias: {
      "@": path.resolve(".")
    }
  }
});
