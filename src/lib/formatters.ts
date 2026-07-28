/**
 * Money Formatting Utilities for Health 360 CRM
 * Hard Requirement: Indian grouping (Intl.NumberFormat('en-IN')), ₹ currency symbol, tabular-nums.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number | string | { toString(): string } | null | undefined): string {
  if (amount === null || amount === undefined) {
    return inrFormatter.format(0);
  }

  const num = typeof amount === 'number' ? amount : parseFloat(amount.toString());
  if (isNaN(num)) {
    return inrFormatter.format(0);
  }

  return inrFormatter.format(num);
}

export function formatCurrencyCompact(amount: number | string | { toString(): string } | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '₹0';
  }

  const num = typeof amount === 'number' ? amount : parseFloat(amount.toString());
  if (isNaN(num)) {
    return '₹0';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}
