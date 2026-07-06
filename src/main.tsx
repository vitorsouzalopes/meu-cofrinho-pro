import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { checkForUpdates } from "./lib/version";

// Show update splash before React mounts
function showUpdateSplash() {
  const root = document.getElementById("root")!;
  root.innerHTML = `
    <div style="
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100vh; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white; font-family: system-ui, sans-serif; gap: 16px;
    ">
      <div style="
        width: 48px; height: 48px; border: 3px solid rgba(255,255,255,0.2);
        border-top-color: #22d3ee; border-radius: 50%;
        animation: spin 0.8s linear infinite;
      "></div>
      <p style="font-size: 18px; font-weight: 600; margin: 0;">Atualizando...</p>
      <p style="font-size: 14px; color: rgba(255,255,255,0.6); margin: 0;">Uma nova versão foi detectada</p>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    </div>
  `;
}

// Guard against infinite reload: max 1 reload per 10 seconds
const RELOAD_GUARD_KEY = 'cofrinho_last_reload';
const now = Date.now();
const lastReload = Number(localStorage.getItem(RELOAD_GUARD_KEY) || '0');
const canReload = now - lastReload > 10_000;

// Initialize app without blocking on update check
const renderApp = () => {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(<App />);
  }
};

// Check for updates in a non-blocking way
checkForUpdates().then((updated) => {
  if (updated && canReload) {
    localStorage.setItem(RELOAD_GUARD_KEY, String(now));
    showUpdateSplash();
    setTimeout(() => window.location.reload(), 1500);
    return;
  }
  renderApp();
}).catch((err) => {
  console.error("Update check failed, rendering app anyway:", err);
  renderApp();
});

// Guard: never register SW in iframes, Lovable preview, or Native Capacitor
const isNative = Capacitor.isNativePlatform();
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("lovable.app");

if (isPreviewHost || isInIframe || isNative) {
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
