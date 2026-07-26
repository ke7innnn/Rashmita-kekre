/**
 * Health 360 CRM — Currency & Number Formatters
 * Uses en-IN Indian Number Grouping (₹1,23,456.00)
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format any number as Indian Rupee string (e.g., 123456 -> "₹1,23,456.00")
 */
export function formatINR(amount: number | string | null | undefined): string {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(numeric)) return '₹0.00';
  return inrFormatter.format(numeric);
}

/**
 * Format date in clean Indian clinic format (e.g. 26/07/2026)
 */
export function formatDateIN(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
