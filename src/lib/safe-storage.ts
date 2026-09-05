// Wrapper for localStorage with safety checks and consistent prefix
const PREFIX = 'cofrinho:';

export const safeStorage = {
  get: <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(`${PREFIX}${key}`);
      if (!item) return fallback;
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`[Storage] Error reading key "${key}":`, error);
      return fallback;
    }
  },

  set: (key: string, value: any): void => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(`${PREFIX}${key}`, stringValue);
    } catch (error) {
      console.error(`[Storage] Error writing key "${key}":`, error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(`${PREFIX}${key}`);
    } catch (error) {
      console.error(`[Storage] Error removing key "${key}":`, error);
    }
  },

  clear: (): void => {
    try {
      // Only clear items with our prefix to avoid breaking other things
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch (error) {
      console.error('[Storage] Error clearing storage:', error);
    }
  }
};
