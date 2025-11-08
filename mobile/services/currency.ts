// Use the optional @mfaeezshabbir/world-currencies package exclusively.
// If the package is not available at runtime, functions return safe defaults (code / empty list).
export const DEFAULT_CURRENCY_CODE = 'PKR';
export const DEFAULT_CURRENCY_SYMBOL = 'Rs';

export function getSymbolForCurrency(code: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-member-access
    const wc = require('@mfaeezshabbir/world-currencies');
    if (!wc) throw new Error('no wc');

    if (typeof wc.getCurrencyByCode === 'function') {
      const entry = wc.getCurrencyByCode(code);
      if (entry && entry.symbol) return entry.symbol;
    }

    if (typeof wc.getAllCurrencies === 'function') {
      const list = wc.getAllCurrencies();
      if (Array.isArray(list)) {
        const found = list.find(
          (c: any) => (c.code || '').toLowerCase() === (code || '').toLowerCase()
        );
        if (found && found.symbol) return found.symbol;
      }
    }
  } catch (e) {
    // package not present or API different — fall through to return code
  }

  // Do not use an internal manual mapping; fall back to returning the code itself.
  return code;
}

export function getAllCurrencies(): Array<{ code: string; name: string; symbol?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const wc = require('@mfaeezshabbir/world-currencies');
    if (wc && typeof wc.getAllCurrencies === 'function') {
      const list = wc.getAllCurrencies();
      if (Array.isArray(list)) {
        return list.map((c: any) => ({
          code: c.code || '',
          name: c.currency || c.country || '',
          symbol: c.symbol || '',
        }));
      }
    }
  } catch (e) {
    // package not present — return empty list
  }

  return [];
}
