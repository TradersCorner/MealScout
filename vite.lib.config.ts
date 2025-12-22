import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Library build config for exposing the SDK-style MealScoutApp
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, "client", "src", "MealScoutApp.tsx"),
      name: "MealScoutApp",
      formats: ["es", "cjs"],
      fileName: (format) => `mealscout-app.${format}.js`,
    },
    rollupOptions: {
      // React and ReactDOM are expected to be provided by the host app
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
});
