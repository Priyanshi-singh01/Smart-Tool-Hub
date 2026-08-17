/**
 * storage.js — the ONLY module allowed to touch localStorage for
 * dashboard-level concerns (favorites, recent tools, theme).
 * Tool modules must never read/write these keys directly; they
 * receive read helpers via context and call the exported functions
 * below only through app.js -> context.
 */

const KEYS = {
  favorites: 'sth:favorites',
  recent: 'sth:recent',
  theme: 'sth:theme',
};

const MAX_RECENT = 5;

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error('[storage] read failed for', key, err);
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error('[storage] write failed for', key, err);
    return false;
  }
}

export const storage = {
  getFavorites() {
    return readJSON(KEYS.favorites, []);
  },
  isFavorite(toolId) {
    return storage.getFavorites().includes(toolId);
  },
  addFavorite(toolId) {
    const favs = storage.getFavorites();
    if (!favs.includes(toolId)) {
      favs.push(toolId);
      writeJSON(KEYS.favorites, favs);
    }
  },
  removeFavorite(toolId) {
    const favs = storage.getFavorites().filter((id) => id !== toolId);
    writeJSON(KEYS.favorites, favs);
  },
  toggleFavorite(toolId) {
    if (storage.isFavorite(toolId)) {
      storage.removeFavorite(toolId);
      return false;
    }
    storage.addFavorite(toolId);
    return true;
  },

  getRecentTools() {
    return readJSON(KEYS.recent, []);
  },
  addRecentTool(toolId) {
    let recent = storage.getRecentTools().filter((id) => id !== toolId);
    recent.unshift(toolId);
    recent = recent.slice(0, MAX_RECENT);
    writeJSON(KEYS.recent, recent);
  },

  getTheme() {
    return readJSON(KEYS.theme, 'light');
  },
  setTheme(theme) {
    writeJSON(KEYS.theme, theme);
  },
};
