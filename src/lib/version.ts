// Auto-generated at build time by Vite define
export const APP_VERSION = __APP_VERSION__;
export const VERSION_KEY = 'cofrinho_app_version';

/**
 * Checks if app was updated since last load.
 * If yes, clears all caches and forces a clean reload.
 */
export async function checkForUpdates(): Promise<boolean> {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  
  if (storedVersion && storedVersion !== APP_VERSION) {
    console.log(`[Update] ${storedVersion} → ${APP_VERSION}. Clearing caches...`);
    
    // Clear all Cache Storage
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }

    // Force SW update
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        if (reg.waiting) {
          reg.waiting.postMessage('SKIP_WAITING');
        }
        await reg.update();
      }
    }

    localStorage.setItem(VERSION_KEY, APP_VERSION);
    return true; // updated
  }

  if (!storedVersion) {
    localStorage.setItem(VERSION_KEY, APP_VERSION);
  }

  return false;
}

declare global {
  const __APP_VERSION__: string;
}
