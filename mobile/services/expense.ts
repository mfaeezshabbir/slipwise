import { loadExpenses, saveExpenses } from './storage';

export type Expense = {
  id: string;
  vendor: string;
  amount: number;
  date: string; // ISO
  category?: string;
  notes?: string;
};

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

async function fetchJson(path: string, opts: any = {}) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}

export async function getAllExpenses(): Promise<Expense[]> {
  try {
    const data = await fetchJson('/expenses');
    return data as Expense[];
  } catch (err) {
    // fallback to local storage
    return await loadExpenses();
  }
}

export async function addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
  try {
    const created = await fetchJson('/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    return created as Expense;
  } catch (err) {
    // fallback: persist locally
    const items = await loadExpenses();
    const newItem: Expense = { id: Date.now().toString(), ...expense } as Expense;
    items.unshift(newItem);
    await saveExpenses(items);
    return newItem;
  }
}

export async function clearExpenses() {
  try {
    await fetchJson('/expenses', { method: 'DELETE' });
  } catch (err) {
    await saveExpenses([]);
  }
}
