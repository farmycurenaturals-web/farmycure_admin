/** Indian Rupees — single place for admin money display (matches store pricing in INR). */
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatINR(value) {
  const n = Number(value);
  return inr.format(Number.isFinite(n) ? n : 0);
}

export const CURRENCY_CODE = 'INR';
