import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// Lovable tagger disabled by default; enable with VITE_LOVABLE=true when needed.

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    // Lovable tagger is off by default; set VITE_LOVABLE=true only if explicitly required.
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
