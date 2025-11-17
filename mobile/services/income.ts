import Constants from 'expo-constants';

export type Income = {
  id: string;
  title: string;
  amount: number;
  date: string; // ISO datetime
  note?: string;
  account?: string;
  category?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
};

export type CreateIncomeInput = {
  title: string;
  amount: number;
  date: string;
  note?: string;
  account?: string;
  categoryId?: string;
};

export type UpdateIncomeInput = Partial<CreateIncomeInput>;

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
    throw new Error(`Failed to fetch incomes`);
  }
}

export async function getAllIncomes(): Promise<Income[]> {
  const data = await fetchJson('/incomes');
  return (Array.isArray(data) ? data : []) as Income[];
}

export async function getIncomeById(id: string): Promise<Income> {
  const data = await fetchJson(`/incomes/${id}`);
  return data as Income;
}

export async function createIncome(input: CreateIncomeInput): Promise<Income> {
  const created = await fetchJson('/incomes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return created as Income;
}

export async function updateIncome(id: string, input: UpdateIncomeInput): Promise<Income> {
  const updated = await fetchJson(`/incomes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return updated as Income;
}

export async function deleteIncome(id: string): Promise<void> {
  await fetchJson(`/incomes/${id}`, { method: 'DELETE' });
}
