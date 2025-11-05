import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type Expense = {
  id: string;
  title: string;
  amount: number;
  date: string; // ISO datetime
  note?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateExpenseInput = {
  title: string;
  amount: number;
  date: string;
  note?: string;
};

export type UpdateExpenseInput = Partial<CreateExpenseInput>;

const BASE_URL = Constants.expoConfig?.extra?.apiUrl || process.env.API_URL;

async function fetchJson(path: string, opts: any = {}) {
  const url = `${BASE_URL}${path}`;

  try {
    const res = await fetch(url, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...opts.headers,
      },
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    return res.status === 204 ? null : JSON.parse(text);
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to ${opts.method || 'GET'} ${path}: ${message}`);
  }
}

export async function getAllExpenses(): Promise<Expense[]> {
  const data = await fetchJson('/expenses');
  return (Array.isArray(data) ? data : []) as Expense[];
}

export async function getExpenseById(id: string): Promise<Expense> {
  const data = await fetchJson(`/expenses/${id}`);
  return data as Expense;
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const created = await fetchJson('/expenses', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return created as Expense;
}

export async function updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense> {
  const updated = await fetchJson(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return updated as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  await fetchJson(`/expenses/${id}`, { method: 'DELETE' });
}
