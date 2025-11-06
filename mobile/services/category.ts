import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.apiUrl || process.env.API_URL;

async function fetchJson(path: string, opts: any = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  return res.status === 204 ? null : JSON.parse(text);
}

export async function getCategories(): Promise<Array<{ id: string; name: string }>> {
  const data = await fetchJson('/categories');
  return Array.isArray(data) ? data : [];
}

export async function createCategory(name: string) {
  const created = await fetchJson('/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return created;
}
