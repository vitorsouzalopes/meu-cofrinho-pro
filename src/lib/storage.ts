// src/lib/storage.ts
// Utilitários para persistência local (LocalStorage/IndexedDB)

export function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Não foi possível salvar no armazenamento local (${key}).`, error);
  }
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    if (val) return JSON.parse(val);
  } catch (error) {
    console.warn(`Não foi possível ler o armazenamento local (${key}).`, error);
  }
  return fallback;
}

export function removeFromStorage(key: string) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Não foi possível remover do armazenamento local (${key}).`, error);
  }
}

// IndexedDB pode ser adicionado para dados maiores (exemplo: idb-keyval)
