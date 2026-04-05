import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// Lovable tagger disabled by default; enable with VITE_LOVABLE=true when needed.

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(`${Date.now()}`),
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
}));
