// src/lib/currencyformat.ts
export const formatGHS = (value: number, opts?: { fromPesewas?: boolean }) => {
  const v = opts?.fromPesewas ? value / 100 : value;
  try {
    const out = new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v);

    // If a host returns 'GHS 5,500.00' or the wrong symbol, force the GH₵ prefix.
    if (!out.includes('GH₵')) {
      const digits = out.replace(/[^\d.,-]/g, '');
      const withSep = Number(v).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `GH₵${withSep}`;
    }
    return out;
  } catch {
    const withSep = Number(v).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `GH₵${withSep}`;
  }
};
