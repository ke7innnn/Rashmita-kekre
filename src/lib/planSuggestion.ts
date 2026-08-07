/**
 * Plan Suggestion Helper based on Modality Count
 * 
 * Rules:
 * - 1 modality: "Elite" (1 modality + exercises)
 * - 2 modalities: "Gold" (2 modalities + exercises)
 * - 3+ modalities: "Diamond" (2+ modalities + exercises)
 * - 0 modalities: null (no suggestion, user picks manually)
 */

export interface TreatmentPlanBasic {
  id: string;
  name: string;
  minModalities: number | null;
  maxModalities: number | null;
  perSessionRate: number | string | any;
  packageRate: number | string | any;
}

export function suggestPlanFromModalities<T extends TreatmentPlanBasic>(
  modalities: string[] | string | null | undefined,
  plans: T[]
): T | null {
  if (!plans || plans.length === 0) return null;

  const modStr = Array.isArray(modalities) ? modalities.join(' ').toLowerCase() : (modalities || '').toLowerCase();

  if (modStr.includes('cst') || modStr.includes('craniosacral')) {
    const cst = plans.find(p => p.name.toLowerCase().includes('cst') || p.name.toLowerCase().includes('craniosacral'));
    if (cst) return cst;
  }

  // Always suggest the active Gold plan (or first active plan)
  const gold = plans.find(p => p.name.toLowerCase() === 'gold');
  return gold || plans[0] || null;
}
