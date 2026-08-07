/**
 * Assessment Clinical Boundary Validator
 * Enforces hard security rules preventing automated diagnostic or medical treatment advice.
 */

const PROHIBITED_CLINICAL_ADVICE_PATTERNS = [
  /\bconsider\s+referral\s+to\b/i,
  /\bsuspect\s+(cauda\s+equina|malignancy|fracture|stroke)\b/i,
  /\brecommend\s+(imaging|mri|xray|ct\s+scan|surgery)\b/i,
  /\bthis\s+may\s+indicate\b/i,
  /\bsuggested\s+treatment\s+protocol\b/i,
  /\bprescribe\s+(medication|rehab\s+protocol)\b/i,
  /\bclinical\s+diagnosis\s+is\b/i,
];

export interface AssessmentValidationResult {
  isValid: boolean;
  prohibitedPatternMatched?: string;
  errorMessage?: string;
}

export function validateAssessmentOutput(text: string): AssessmentValidationResult {
  if (!text || typeof text !== 'string') {
    return { isValid: true };
  }

  for (const pattern of PROHIBITED_CLINICAL_ADVICE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        isValid: false,
        prohibitedPatternMatched: match[0],
        errorMessage: `Output violates safety boundary by asserting clinical advice: "${match[0]}". The system must only surface clinician input.`
      };
    }
  }

  return { isValid: true };
}
