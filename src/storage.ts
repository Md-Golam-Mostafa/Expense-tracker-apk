import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from './types';

const STORAGE_KEY = '@expense_tracker/transactions_v1';

export async function loadTransactions(): Promise<Transaction[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
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
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.warn('Failed to save transactions', err);
  }
}
