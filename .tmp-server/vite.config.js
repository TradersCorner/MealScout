import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
    define: {
        __BUILD_ID__: JSON.stringify(Date.now().toString(36)),
    },
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            "@shared": path.resolve(__dirname, "..", "shared"),
            "@assets": path.resolve(__dirname, "..", "attached_assets"),
        },
    },
    root: path.resolve(__dirname),
    build: {
        outDir: path.resolve(__dirname, "..", "dist/public"),
        emptyOutDir: true,
    },
    server: {
        port: 5174,
        proxy: {
            "/api": {
                target: "http://localhost:5200",
                changeOrigin: true,
            },
            "/socket.io": {
                target: "http://localhost:5200",
                changeOrigin: true,
                ws: true,
            },
        },
        fs: {
            strict: true,
            deny: ["**/.*"],
        },
    },
});
