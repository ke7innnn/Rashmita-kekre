export interface NormativeRomPreset {
  region: string;
  movement: string;
  normalDegrees: number;
}

export const NORMATIVE_ROM_PRESETS: NormativeRomPreset[] = [
  // Cervical
  { region: 'Cervical', movement: 'Flexion', normalDegrees: 45 },
  { region: 'Cervical', movement: 'Extension', normalDegrees: 45 },
  { region: 'Cervical', movement: 'Lateral Flexion Right', normalDegrees: 45 },
  { region: 'Cervical', movement: 'Lateral Flexion Left', normalDegrees: 45 },
  { region: 'Cervical', movement: 'Rotation Right', normalDegrees: 80 },
  { region: 'Cervical', movement: 'Rotation Left', normalDegrees: 80 },

  // Shoulder
  { region: 'Shoulder', movement: 'Flexion', normalDegrees: 180 },
  { region: 'Shoulder', movement: 'Extension', normalDegrees: 60 },
  { region: 'Shoulder', movement: 'Abduction', normalDegrees: 180 },
  { region: 'Shoulder', movement: 'Internal Rotation', normalDegrees: 70 },
  { region: 'Shoulder', movement: 'External Rotation', normalDegrees: 90 },

  // Elbow
  { region: 'Elbow', movement: 'Flexion', normalDegrees: 150 },
  { region: 'Elbow', movement: 'Extension', normalDegrees: 0 },
  { region: 'Elbow', movement: 'Pronation', normalDegrees: 80 },
  { region: 'Elbow', movement: 'Supination', normalDegrees: 80 },

  // Wrist/Hand
  { region: 'Wrist/Hand', movement: 'Flexion', normalDegrees: 80 },
  { region: 'Wrist/Hand', movement: 'Extension', normalDegrees: 70 },
  { region: 'Wrist/Hand', movement: 'Radial Deviation', normalDegrees: 20 },
  { region: 'Wrist/Hand', movement: 'Ulnar Deviation', normalDegrees: 30 },

  // Lumbar
  { region: 'Lumbar', movement: 'Flexion', normalDegrees: 60 },
  { region: 'Lumbar', movement: 'Extension', normalDegrees: 25 },
  { region: 'Lumbar', movement: 'Lateral Flexion Right', normalDegrees: 25 },
  { region: 'Lumbar', movement: 'Lateral Flexion Left', normalDegrees: 25 },
  { region: 'Lumbar', movement: 'Rotation Right', normalDegrees: 45 },
  { region: 'Lumbar', movement: 'Rotation Left', normalDegrees: 45 },

  // Hip
  { region: 'Hip', movement: 'Flexion', normalDegrees: 120 },
  { region: 'Hip', movement: 'Extension', normalDegrees: 30 },
  { region: 'Hip', movement: 'Abduction', normalDegrees: 45 },
  { region: 'Hip', movement: 'Adduction', normalDegrees: 30 },
  { region: 'Hip', movement: 'Internal Rotation', normalDegrees: 45 },
  { region: 'Hip', movement: 'External Rotation', normalDegrees: 45 },

  // Knee
  { region: 'Knee', movement: 'Flexion', normalDegrees: 135 },
  { region: 'Knee', movement: 'Extension', normalDegrees: 0 },

  // Ankle/Foot
  { region: 'Ankle/Foot', movement: 'Dorsiflexion', normalDegrees: 20 },
  { region: 'Ankle/Foot', movement: 'Plantarflexion', normalDegrees: 50 },
  { region: 'Ankle/Foot', movement: 'Inversion', normalDegrees: 35 },
  { region: 'Ankle/Foot', movement: 'Eversion', normalDegrees: 15 },
];

export interface SpecialTestPreset {
  name: string;
  region: string;
}

export const SPECIAL_TESTS_LIBRARY: SpecialTestPreset[] = [
  // Cervical
  { name: "Spurling's Test", region: 'Cervical' },
  { name: "Distraction Test", region: 'Cervical' },
  { name: "Sharp-Purser Test", region: 'Cervical' },

  // Shoulder
  { name: "Neer Impingement Test", region: 'Shoulder' },
  { name: "Hawkins-Kennedy Test", region: 'Shoulder' },
  { name: "Empty Can (Jobe) Test", region: 'Shoulder' },
  { name: "Apprehension Test", region: 'Shoulder' },
  { name: "Speed's Test", region: 'Shoulder' },
  { name: "Yergason's Test", region: 'Shoulder' },

  // Elbow
  { name: "Cozen's Test (Tennis Elbow)", region: 'Elbow' },
  { name: "Golfer's Elbow Test", region: 'Elbow' },
  { name: "Tinel's Sign at Elbow", region: 'Elbow' },

  // Wrist/Hand
  { name: "Phalen's Test", region: 'Wrist/Hand' },
  { name: "Tinel's Sign at Wrist", region: 'Wrist/Hand' },
  { name: "Finkelstein's Test", region: 'Wrist/Hand' },

  // Lumbar
  { name: "Straight Leg Raise (SLR) / Lasegue", region: 'Lumbar' },
  { name: "Slump Test", region: 'Lumbar' },
  { name: "Kemp's Test", region: 'Lumbar' },
  { name: "Prone Instability Test", region: 'Lumbar' },

  // Hip
  { name: "FABER (Patrick's) Test", region: 'Hip' },
  { name: "FADIR Test", region: 'Hip' },
  { name: "Trendelenburg Test", region: 'Hip' },
  { name: "Thomas Test", region: 'Hip' },

  // Knee
  { name: "Lachman Test", region: 'Knee' },
  { name: "Anterior Drawer Test", region: 'Knee' },
  { name: "Posterior Drawer Test", region: 'Knee' },
  { name: "McMurray Test", region: 'Knee' },
  { name: "Valgus Stress Test", region: 'Knee' },
  { name: "Varus Stress Test", region: 'Knee' },

  // Ankle/Foot
  { name: "Anterior Drawer Test (Ankle)", region: 'Ankle/Foot' },
  { name: "Talar Tilt Test", region: 'Ankle/Foot' },
  { name: "Thompson Squeeze Test", region: 'Ankle/Foot' },
];

export const COMMON_CONDITION_TERMS = [
  { name: 'Adhesive Capsulitis (Frozen Shoulder)', region: 'Shoulder' },
  { name: 'Rotator Cuff Tendinopathy', region: 'Shoulder' },
  { name: 'Subacromial Impingement Syndrome', region: 'Shoulder' },
  { name: 'Cervical Radiculopathy', region: 'Cervical' },
  { name: 'Cervicogenic Headache', region: 'Cervical' },
  { name: 'Lumbar Disc Herniation / Sciatica', region: 'Lumbar' },
  { name: 'Mechanical Lower Back Pain', region: 'Lumbar' },
  { name: 'Knee Osteoarthritis', region: 'Knee' },
  { name: 'Patellofemoral Pain Syndrome (PFPS)', region: 'Knee' },
  { name: 'ACL Sprain / Reconstruction', region: 'Knee' },
  { name: 'Lateral Epicondylitis (Tennis Elbow)', region: 'Elbow' },
  { name: 'Plantar Fasciitis', region: 'Ankle/Foot' },
  { name: 'Temporomandibular Joint (TMJ) Dysfunction', region: 'Head/face' },
];
