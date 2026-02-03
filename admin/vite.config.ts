import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [react()];

  if (mode === "development") {
    try {
      const { componentTagger } = await import("lovable-tagger");
      plugins.push(componentTagger());
    } catch {
      // Optional dev-only plugin; skip when not installed.
    }
  }

  return {
    server: {
      host: "::",
      port: 9000,
      proxy: {
        "/api": {
          target: "http://api-gateway:8080",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      global: "globalThis",
    },
  };
});
