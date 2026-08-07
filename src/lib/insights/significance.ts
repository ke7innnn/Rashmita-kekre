/**
 * Small-sample guardrail helper.
 * Enforces statistical significance thresholds (minimum denominator = 20 events)
 * to prevent volatile noise from generating misleading insights on small sample sizes.
 */
export function passesSignificance(
  denominator: number,
  minRequired: number = 20
): boolean {
  if (typeof denominator !== 'number' || isNaN(denominator)) {
    return false;
  }
  return denominator >= minRequired;
}

export function calculatePercentageChange(
  baseline: number,
  current: number,
  denominator: number,
  minDenominator: number = 20
): { pctChange: number; isSignificant: boolean } {
  if (!passesSignificance(denominator, minDenominator) || baseline <= 0) {
    return { pctChange: 0, isSignificant: false };
  }

  const change = ((current - baseline) / baseline) * 100;
  return {
    pctChange: Math.round(change * 10) / 10,
    isSignificant: true,
  };
}
