import { HighScoreRecord } from '../types';

const STORAGE_KEY = 'pazhamchollu_high_scores';
const COINS_KEY = 'pazhamchollu_coins';

// In-memory fallback if localStorage is restricted (e.g., cross-origin iframe)
let memoryScores: HighScoreRecord = {};
let memoryCoins = 0;

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Access denied / restricted
    }
    return null;
  },
  setItem(key: string, value: string): boolean {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        window.localStorage.setItem(key, value);
        return true;
      }
    } catch {
      // Access denied / restricted
    }
    return false;
  },
};

export function getHighScores(): HighScoreRecord {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        memoryScores = { ...memoryScores, ...parsed };
      }
    }
  } catch {
    // Ignore parse or storage errors
  }
  return { ...memoryScores };
}

export function saveHighScore(gameId: string, score: number): boolean {
  try {
    const current = getHighScores();
    const oldScore = current[gameId] || 0;
    if (score > oldScore) {
      current[gameId] = score;
      memoryScores[gameId] = score;
      safeStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      return true; // New record
    }
    return false;
  } catch {
    memoryScores[gameId] = Math.max(memoryScores[gameId] || 0, score);
    return false;
  }
}

export function getCoins(): number {
  try {
    const raw = safeStorage.getItem(COINS_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed)) {
        memoryCoins = parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return memoryCoins;
}

export function addCoins(amount: number): number {
  try {
    const cur = getCoins();
    const next = cur + amount;
    memoryCoins = next;
    safeStorage.setItem(COINS_KEY, next.toString());
    return next;
  } catch {
    memoryCoins += amount;
    return memoryCoins;
  }
}

