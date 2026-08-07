# Health 360 CRM: Digital Initial Assessment Documentation

## 1. System Overview

The Digital Initial Assessment system provides structured, queryable evaluation forms for Dr. Rashmita Karvir Kekre's physiotherapy clinic. It eliminates raw paper forms while delivering automatic normative ROM/MMT comparisons, red-flag safety interlocks, reassessment baseline comparisons, and PDF record exports.

---

## 2. Field-to-Column Map

| Form Step | UI Field Name | Input Type | Prisma Model & Column | Type / Enum |
| :--- | :--- | :--- | :--- | :--- |
| 1. Profile | Patient Relation | Select / Link | `Assessment.patientId` | `String` (FK → `Patient`) |
| 1. Profile | Assessment Type | Segmented | `Assessment.type` | `INITIAL`, `REASSESSMENT`, `DISCHARGE` |
| 1. Profile | Occupation Category | Dropdown | `Assessment.occupationCategory` | `SEDENTARY_DESK`, `MANUAL_LABOUR`, etc. |
| 1. Profile | Occupation Detail | Text + Dictation | `Assessment.occupation` | `String?` |
| 1. Profile | Provisional Diagnosis | Text | `Assessment.provisionalDiagnosis` | `String?` |
| 2. Subjective | Chief Complaint | Text + Dictation | `Assessment.chiefComplaint` | `String?` |
| 2. Subjective | Onset Type | Segmented | `Assessment.onset` | `ACUTE`, `SUB_ACUTE`, `CHRONIC` |
| 2. Subjective | Onset Date | Date | `Assessment.onsetDate` | `DateTime?` |
| 2. Subjective | Pain Site / Radiation | SVG Body Chart | `Assessment.painSiteRegions` | `String?` (JSON array of regions & side) |
| 2. Subjective | Pain VAS Profile | Tap Scale (0–10) | `Assessment.vasRest`, `vasActivity`, `vasBest`, `vasWorst` | `Int?` (0–10) |
| 3. Red Flags | Unexplained Weight Loss | Tap Yes / No | `Assessment.redFlagWeightLoss` | `Boolean` |
| 3. Red Flags | Bowel / Bladder Dysfunction | Tap Yes / No | `Assessment.redFlagBowelBladder` | `Boolean` |
| 3. Red Flags | Saddle Anaesthesia | Tap Yes / No | `Assessment.redFlagSaddleAnaesthesia` | `Boolean` |
| 3. Red Flags | Night Pain | Tap Yes / No | `Assessment.redFlagNightPain` | `Boolean` |
| 3. Red Flags | Decision Note | Text + Dictation | `Assessment.redFlagDecisionNote` | `String?` |
| 3. Red Flags | Acknowledgement | Checkbox | `Assessment.redFlagAcknowledgedAt` | `DateTime?` |
| 4. Objective | Posture / Alignment | Segmented | `Assessment.posture` | `NORMAL`, `ALTERED` |
| 4. Objective | Gait Pattern | Dropdown | `Assessment.gait` | `NORMAL`, `ANTALGIC`, `DEVIATED`, `NON_AMBULATORY` |
| 4. Objective | Tenderness Grade | Dropdown | `Assessment.tendernessGrade` | `NONE`, `GRADE_I`, `GRADE_II`, `GRADE_III`, `GRADE_IV` |
| 5. ROM / MMT | Joint Movement Grid | Structured Table | `RomMeasurement` child rows | `aromRight`, `aromLeft`, `promRight`, `promLeft`, `mmtRight`, `mmtLeft` (`Int?`) |
| 6. Tests | Orthopedic Tests | Test Library | `SpecialTestResult` child rows | `side`, `result` (`POSITIVE`/`NEGATIVE`), `note` |
| 7. Diagnosis | PT Clinical Diagnosis | Text + Dictation | `Assessment.ptDiagnosis` | `String?` |
| 7. Diagnosis | Prognosis Rating | Segmented | `Assessment.prognosis` | `EXCELLENT`, `GOOD`, `FAIR`, `POOR` |
| 8. Goals | Short & Long Goals | Repeating Rows | `AssessmentGoal` child rows | `horizon` (`SHORT`/`LONG`), `text`, `targetValue`, `targetDate` |

---

## 3. Red Flag Safety Interlock Rules & Clinical Boundary

1. **Mandatory Step & Zero Pre-selection**: All 4 red-flag items (unexplained weight loss, bowel/bladder dysfunction, saddle anaesthesia, night pain) must be explicitly answered Yes or No. No default selection is permitted.
2. **Completion Lock**: Answering `YES` to any red flag displays a non-dismissible warning banner and **blocks completion/signing** of the assessment until:
   - Clinician checks the timestamped acknowledgement (`redFlagAcknowledgedAt`).
   - Clinician enters a non-empty decision note (`redFlagDecisionNote`).
3. **Hard Boundary Validator**: The system surfaces clinician input only and will NEVER generate medical diagnostic advice or referral directives. `validateAssessmentOutput()` in `src/lib/assessments/clinicalValidator.ts` enforces this constraint at the API layer.

---

## 4. Normative ROM Value Sources

Normative ROM reference values are seeded from standard orthopedic reference literature (*Magee Orthopedic Physical Assessment, 7th Edition*):
- **Cervical**: Flexion 45°, Extension 45°, Lateral Flexion 45°, Rotation 80°
- **Shoulder**: Flexion 180°, Extension 60°, Abduction 180°, Internal Rotation 70°, External Rotation 90°
- **Elbow**: Flexion 150°, Extension 0°, Pronation 80°, Supination 80°
- **Lumbar**: Flexion 60°, Extension 25°, Lateral Flexion 25°, Rotation 45°
- **Hip**: Flexion 120°, Extension 30°, Abduction 45°, Adduction 30°, Rotation 45°
- **Knee**: Flexion 135°, Extension 0°
- **Ankle**: Dorsiflexion 20°, Plantarflexion 50°, Inversion 35°, Eversion 15°

---

## 5. How to Add a Region Preset

To add a new body region preset (e.g. `Temporomandibular Joint (TMJ)`):

1. **Open** `src/lib/assessments/seedData.ts`.
2. **Add normative entries** to `NORMATIVE_ROM_PRESETS`:

```ts
{ region: 'TMJ', movement: 'Depression / Opening', normalDegrees: 40 },
{ region: 'TMJ', movement: 'Protrusion', normalDegrees: 7 },
{ region: 'TMJ', movement: 'Lateral Excursion', normalDegrees: 10 },
```

3. **Add region button** to `REGION_PRESETS` in `src/components/assessments/RomGrid.tsx`.

---

## 6. How to Add a Special Test to the Library

To add a new orthopedic special test (e.g. `O'Brien Active Compression Test`):

1. **Open** `src/lib/assessments/seedData.ts`.
2. **Add test entry** to `SPECIAL_TESTS_LIBRARY`:

```ts
{ name: "O'Brien Active Compression Test", region: 'Shoulder' },
```

3. The test will automatically appear under the Shoulder category filter in `SpecialTestsPicker.tsx`. Custom tests added by clinicians during assessment entry are also saved with `isCustom = true`.
