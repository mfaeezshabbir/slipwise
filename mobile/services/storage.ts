let AsyncStorage: any = null;
try {
  // try to require AsyncStorage if available in the environment
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorage = require('@react-native-async-storage/async-storage');
} catch (e) {
  // ignore - we'll fallback to an in-memory store
  AsyncStorage = null;
}

const EXPENSES_KEY = 'slipwise:expenses';

const memoryStore: Record<string, string> = {};

async function storageGetItem(key: string) {
  if (AsyncStorage?.getItem) return AsyncStorage.getItem(key);
  return memoryStore[key] ?? null;
}

async function storageSetItem(key: string, value: string) {
  if (AsyncStorage?.setItem) return AsyncStorage.setItem(key, value);
  memoryStore[key] = value;
}

export async function loadJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await storageGetItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn('loadJson error', err);
    return null;
  }
}

export async function saveJson<T>(key: string, value: T): Promise<void> {
  try {
    await storageSetItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('saveJson error', err);
  }
}

export async function loadExpenses() {
  const data = await loadJson<any[]>(EXPENSES_KEY);
  return data ?? [];
}

export async function saveExpenses(items: any[]) {
  await saveJson(EXPENSES_KEY, items);
}
