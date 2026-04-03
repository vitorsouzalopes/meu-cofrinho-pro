import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Guard: never register SW in iframes or Lovable preview
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("lovable.app");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
} else if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('SW registrado:', reg))
      .catch(err => console.error('Erro SW:', err));
  });
}

if (Capacitor.isNativePlatform()) {
  CapacitorApp.addListener("appUrlOpen", (event) => {
    try {
      const url = new URL(event.url);
      const path = `${url.pathname}${url.search}${url.hash}`;
      if (path && path !== "/") {
        window.location.href = path;
      }
    } catch (error) {
      console.error("Failed to parse app URL:", error);
    }
  });
}
