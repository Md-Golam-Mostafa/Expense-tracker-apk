import { Transaction } from './types';

/**
 * Web persistence backed by localStorage.
 * Metro resolves this file (storage.web.ts) when bundling for --platform web;
 * native builds use storage.ts (AsyncStorage).
 */

const STORAGE_KEY = '@expense_tracker/transactions_v1';

// `window`/`Storage` are not in RN's TS lib; access localStorage via globalThis.
interface LocalStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const getLocalStorage = (): LocalStorageLike => {
  const g = globalThis as unknown as { localStorage?: LocalStorageLike };
  if (!g.localStorage) {
    throw new Error('localStorage is not available');
  }
  return g.localStorage;
};

export async function loadTransactions(): Promise<Transaction[]> {
  try {
    const raw = getLocalStorage().getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as Transaction[];
  } catch (err) {
    console.warn('Failed to load transactions', err);
    return [];
  }
}

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  try {
    getLocalStorage().setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.warn('Failed to save transactions', err);
  }
}
