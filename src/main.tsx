import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { checkForUpdates } from "./lib/version";

// --- Hard Reset Logic for Testing ---
const INIT_VERSION = 'v1.0.2_init'; // Bump this to force a reset
if (localStorage.getItem('cofrinho_init_check') !== INIT_VERSION) {
  console.log("[Init] First run of new version detected. Cleaning local storage...");
  localStorage.clear();
  localStorage.setItem('cofrinho_init_check', INIT_VERSION);
}

// Show update splash before React mounts
function showUpdateSplash() {
  const root = document.getElementById("root")!;
  root.innerHTML = `
    <div style="
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100vh; background: #0A0E1A;
      color: white; font-family: system-ui, sans-serif; gap: 16px;
    ">
      <div style="
        width: 48px; height: 48px; border: 3px solid rgba(212, 160, 23, 0.2);
        border-top-color: #D4A017; border-radius: 50%;
        animation: spin 0.8s linear infinite;
      "></div>
      <p style="font-size: 18px; font-weight: 600; margin: 0;">Atualizando Cofrinho PRO...</p>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    </div>
  `;
}

const RELOAD_GUARD_KEY = 'cofrinho_last_reload';
const now = Date.now();
const lastReload = Number(localStorage.getItem(RELOAD_GUARD_KEY) || '0');
const canReload = now - lastReload > 10_000;

const renderApp = () => {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(<App />);
  }
};

checkForUpdates().then((updated) => {
  if (updated && canReload) {
    localStorage.setItem(RELOAD_GUARD_KEY, String(now));
    showUpdateSplash();
    setTimeout(() => window.location.reload(), 1500);
    return;
  }
  renderApp();
}).catch((err) => {
  console.error("Update check failed:", err);
  renderApp();
});

const isNative = Capacitor.isNativePlatform();
if (isNative) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

if (isNative) {
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
