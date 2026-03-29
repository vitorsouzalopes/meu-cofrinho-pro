// src/lib/storage.ts
// Utilitários para persistência local (LocalStorage/IndexedDB)

export function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    if (val) return JSON.parse(val);
  } catch {}
  return fallback;
}

export function removeFromStorage(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

// IndexedDB pode ser adicionado para dados maiores (exemplo: idb-keyval)
