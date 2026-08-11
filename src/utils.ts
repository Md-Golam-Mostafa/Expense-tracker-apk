import { MonthSummary, Transaction } from './types';

/** Formats an amount as BDT, e.g. 1234.5 -> ৳1,234.50 */
export function formatBDT(amount: number): string {
  const negative = amount < 0;
  const abs = Math.abs(amount);
  const rounded = Math.round(abs * 100) / 100;
  const parts = rounded.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decPart = parts[1];
  const trailingZeros = decPart === '00';
  const formatted = trailingZeros ? intPart : `${intPart}.${decPart}`;
  return `${negative ? '-' : ''}৳${formatted}`;
}

export function formatBDTShort(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 10000000) {
    return `${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${(abs / 1000).toFixed(1)}k`;
  }
  return formatBDT(amount);
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Returns YYYY-MM-DD for a Date, using local time. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parses YYYY-MM-DD into a local Date. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Returns YYYY-MM for a Date or date key. */
export function monthKeyOf(dateOrKey: Date | string): string {
  const date = typeof dateOrKey === 'string' ? fromDateKey(dateOrKey) : dateOrKey;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(year: number, monthIndex: number): string {
  return `${MONTHS[monthIndex]} ${year}`;
}

export function weekdayShort(key: string): string {
  return WEEKDAYS_SHORT[fromDateKey(key).getDay()];
}

export function isToday(key: string): boolean {
  return key === toDateKey(new Date());
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/** Builds the list of YYYY-MM-DD keys for a given month (year, monthIndex). */
export function daysInMonth(year: number, monthIndex: number): string[] {
  const count = new Date(year, monthIndex + 1, 0).getDate();
  const days: string[] = [];
  for (let i = 1; i <= count; i++) {
    days.push(toDateKey(new Date(year, monthIndex, i)));
  }
  return days;
}

export function summaryForMonth(
  transactions: Transaction[],
  monthKey: string,
): MonthSummary {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    if (monthKeyOf(tx.date) !== monthKey) {
      continue;
    }
    if (tx.type === 'income') {
      income += tx.amount;
    } else {
      expense += tx.amount;
    }
  }
  return { income, expense, balance: income - expense };
}

/** Sorts transactions newest first, then by createdAt. */
export function sortTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? 1 : -1;
    }
    return b.createdAt - a.createdAt;
  });
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatLongDate(key: string): string {
  const d = fromDateKey(key);
  const weekday = WEEKDAYS_SHORT[d.getDay()];
  return `${weekday}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}
