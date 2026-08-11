export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  note: string;
  /** Local date key in the form YYYY-MM-DD */
  date: string;
  /** Unix ms timestamp, used for stable ordering */
  createdAt: number;
}

export interface Category {
  id: string;
  label: string;
  emoji: string;
  type: TransactionType;
}

export interface MonthSummary {
  income: number;
  expense: number;
  balance: number;
}
