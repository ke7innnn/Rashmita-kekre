/**
 * Clinical Boundary Validator
 * Hard security rule ensuring AI insights stay strictly in operations, scheduling,
 * retention, and revenue — and NEVER suggest clinical treatment changes.
 */

const FORBIDDEN_CLINICAL_PATTERNS = [
  /\bchange\s+(dosage|dose|medication|drug|prescription)\b/i,
  /\bswitch\s+(modality|treatment\s+protocol|therapy\s+type)\b/i,
  /\balter\s+(exercise|rehab)\s+(progression|sets|reps|protocol)\b/i,
  /\bdiagnose\b/i,
  /\bnew\s+diagnosis\b/i,
  /\bincrease\s+reps\b/i,
  /\bdecrease\s+sets\b/i,
  /\bprescribe\b/i,
  /\bstop\s+physiotherapy\b/i,
  /\bclinical\s+contraindication\b/i,
];

export interface ValidationResult {
  isValid: boolean;
  violationReason?: string;
  matchedTerm?: string;
}

export function validateClinicalBoundary(text: string): ValidationResult {
  if (!text || typeof text !== 'string') {
    return { isValid: true };
  }

  for (const pattern of FORBIDDEN_CLINICAL_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        isValid: false,
        violationReason: `Text violates clinical boundary constraint by attempting to direct medical/clinical treatment: "${match[0]}"`,
        matchedTerm: match[0],
      };
    }
  }

  return { isValid: true };
}

export function sanitizeTextForClinicalBoundary(text: string): string {
  const result = validateClinicalBoundary(text);
  if (!result.isValid) {
    return text.replace(
      new RegExp(result.matchedTerm || '', 'gi'),
      'patient contact / re-engagement call'
    );
  }
  return text;
}
