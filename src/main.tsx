import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { checkForUpdates } from "./lib/version";

console.log("[Main] App entry point reached");

// --- Hard Reset Logic (Testing only) ---
const INIT_VERSION = 'v1.0.4_final_reset';
if (localStorage.getItem('cofrinho_init_check') !== INIT_VERSION) {
  localStorage.clear();
  localStorage.setItem('cofrinho_init_check', INIT_VERSION);
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);

  // RENDER IMMEDIATELY - Do not block on network/updates
  root.render(<App />);

  // Run update check in background
  if (!Capacitor.isNativePlatform()) {
    checkForUpdates().then((updated) => {
      if (updated) {
        console.log("[Update] App updated, reloading...");
        window.location.reload();
      }
    }).catch(console.error);
  }
}

// Capacitor Platform setup
if (Capacitor.isNativePlatform()) {
  // Disable SW on native
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });

  // Handle Deep Links
  CapacitorApp.addListener("appUrlOpen", (event) => {
    try {
      const url = new URL(event.url);
      const path = `${url.pathname}${url.search}${url.hash}`;
      if (path && path !== "/") {
        window.location.href = path;
      }
    } catch (error) {
      console.error("Deep Link Error:", error);
    }
  });
} else if ('serviceWorker' in navigator) {
  // Register SW for Web PWA only
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(console.error);
  });
}
