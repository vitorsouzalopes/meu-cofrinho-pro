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
    // Lovable tagger is off by default; set VITE_LOVABLE=true only if explicitly required.
    {
      name: 'sw-version-inject',
      apply: 'build',
      closeBundle() {
        // Inject build version into service-worker.js after build
        const fs = require('fs');
        const swPath = path.resolve(__dirname, 'dist/service-worker.js');
        if (fs.existsSync(swPath)) {
          let content = fs.readFileSync(swPath, 'utf-8');
          content = content.replace('__BUILD_VERSION__', `${Date.now()}`);
          fs.writeFileSync(swPath, content);
        }
      },
    },
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
