export interface ScaleDefinition {
  id: string;
  name: string;
  categories: string[];
  description: string;
  scoreDirection: 'lower_better' | 'higher_better' | 'categorical';
  questions: Array<{
    id: string;
    text: string;
    type: 'select' | 'radio' | 'number' | 'text' | 'slider' | 'checklist';
    options?: Array<{ label: string; value: number }>;
    min?: number;
    max?: number;
    defaultValue?: any;
    placeholder?: string;
  }>;
  calculateScore: (answers: Record<string, any>) => { score: number | string; maxScore?: number | string; percent?: number };
  getInterpretation: (score: number | string, percent?: number) => string;
}

// Compact helper to create standard rating questions
const createRadioOptions = (max: number, labels: Record<number, string> = {}) => {
  return Array.from({ length: max + 1 }, (_, i) => ({
    label: labels[i] ? `${i} - ${labels[i]}` : i.toString(),
    value: i
  }));
};

export const SCALES: ScaleDefinition[] = [
  // ==========================================
  // 1. PAIN
  // ==========================================
  {
    id: 'NPRS',
    name: 'NPRS (Numeric Pain Rating Scale)',
    categories: ['Pain'],
    description: 'Standard 0-10 numeric scale to rate current pain level.',
    scoreDirection: 'lower_better',
    questions: [
      {
        id: 'intensity',
        text: 'Select current pain intensity (0 = No Pain, 10 = Worst Pain Imaginable):',
        type: 'radio',
        options: createRadioOptions(10, { 0: 'No Pain', 5: 'Moderate Pain', 10: 'Worst Pain' })
      }
    ],
    calculateScore: (ans) => ({ score: ans.intensity ?? 0, maxScore: 10 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s === 0) return 'No Pain';
      if (s <= 3) return 'Mild Pain';
      if (s <= 6) return 'Moderate Pain';
      return 'Severe Pain';
    }
  },
  {
    id: 'VAS',
    name: 'VAS (Visual Analog Scale)',
    categories: ['Pain'],
    description: 'Visual scale (0-100 mm) to measure pain intensity.',
    scoreDirection: 'lower_better',
    questions: [
      {
        id: 'intensity',
        text: 'Pain level on 0-100 scale (0 = No Pain, 100 = Worst Pain Imaginable):',
        type: 'slider',
        min: 0,
        max: 100,
        defaultValue: 0
      }
    ],
    calculateScore: (ans) => ({ score: ans.intensity ?? 0, maxScore: 100 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s === 0) return 'No Pain';
      if (s <= 4) return 'None';
      if (s <= 44) return 'Mild Pain';
      if (s <= 74) return 'Moderate Pain';
      return 'Severe Pain';
    }
  },
  {
    id: 'VRS',
    name: 'VRS (Verbal Rating Scale)',
    categories: ['Pain'],
    description: 'Pain intensity rated using descriptive verbal adjectives.',
    scoreDirection: 'lower_better',
    questions: [
      {
        id: 'pain_descriptor',
        text: 'Choose the word that best describes your pain right now:',
        type: 'select',
        options: [
          { label: '0 - No Pain', value: 0 },
          { label: '1 - Mild Pain', value: 1 },
          { label: '2 - Moderate Pain', value: 2 },
          { label: '3 - Severe Pain', value: 3 }
        ]
      }
    ],
    calculateScore: (ans) => ({ score: ans.pain_descriptor ?? 0, maxScore: 3 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s === 0) return 'No Pain';
      if (s === 1) return 'Mild Pain';
      if (s === 2) return 'Moderate Pain';
      return 'Severe Pain';
    }
  },
  {
    id: 'WongBakerFACES',
    name: 'Wong-Baker FACES Pain Rating Scale',
    categories: ['Pain', 'Pediatric'],
    description: 'Pain assessment tool using facial expressions, ideal for pediatric or non-verbal patients.',
    scoreDirection: 'lower_better',
    questions: [
      {
        id: 'face_rating',
        text: 'Select the face that matches the pain level:',
        type: 'radio',
        options: [
          { label: '0 - No Hurt (Smiling Face)', value: 0 },
          { label: '2 - Hurts Little Bit', value: 2 },
          { label: '4 - Hurts Little More', value: 4 },
          { label: '6 - Hurts Even More', value: 6 },
          { label: '8 - Hurts Whole Lot', value: 8 },
          { label: '10 - Hurts Worst (Crying Face)', value: 10 }
        ]
      }
    ],
    calculateScore: (ans) => ({ score: ans.face_rating ?? 0, maxScore: 10 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s === 0) return 'No Hurt';
      if (s <= 4) return 'Mild Pain';
      if (s <= 8) return 'Moderate/Severe Pain';
      return 'Worst Pain';
    }
  },

  // ==========================================
  // 2. SPINE
  // ==========================================
  {
    id: 'NDI',
    name: 'NDI (Neck Disability Index)',
    categories: ['Spine'],
    description: '10-item questionnaire measuring neck pain and daily function.',
    scoreDirection: 'lower_better',
    questions: [
      {
        id: 'q1',
        text: '1. Pain Intensity',
        type: 'select',
        options: [
          { label: '0 - No pain at the moment', value: 0 },
          { label: '1 - Pain is very mild at the moment', value: 1 },
          { label: '2 - Pain is moderate at the moment', value: 2 },
          { label: '3 - Pain is fairly severe at the moment', value: 3 },
          { label: '4 - Pain is very severe at the moment', value: 4 },
          { label: '5 - Pain is the worst imaginable', value: 5 }
        ]
      },
      {
        id: 'q2',
        text: '2. Personal Care (Washing, Dressing, etc.)',
        type: 'select',
        options: [
          { label: '0 - Normal self care without extra pain', value: 0 },
          { label: '1 - Normal self care but it causes extra pain', value: 1 },
          { label: '2 - Painful to look after myself, slow and careful', value: 2 },
          { label: '3 - Need some help but manage most self care', value: 3 },
          { label: '4 - Need help every day in most aspects of self care', value: 4 },
          { label: '5 - Cannot get dressed, wash with difficulty, stay in bed', value: 5 }
        ]
      },
      {
        id: 'q3',
        text: '3. Lifting',
        type: 'select',
        options: [
          { label: '0 - Lift heavy weights without extra pain', value: 0 },
          { label: '1 - Lift heavy weights but it gives extra pain', value: 1 },
          { label: '2 - Pain prevents lifting heavy weights off floor, but can manage if conveniently positioned', value: 2 },
          { label: '3 - Pain prevents lifting heavy weights, but light/medium convenient', value: 3 },
          { label: '4 - Lift only very light weights', value: 4 },
          { label: '5 - Cannot lift or carry anything at all', value: 5 }
        ]
      },
      {
        id: 'q4',
        text: '4. Reading',
        type: 'select',
        options: [
          { label: '0 - Read as much as I want with no neck pain', value: 0 },
          { label: '1 - Read as much as I want with slight neck pain', value: 1 },
          { label: '2 - Read as much as I want with moderate neck pain', value: 2 },
          { label: '3 - Cannot read as much as I want because of moderate neck pain', value: 3 },
          { label: '4 - Hardly read at all because of severe neck pain', value: 4 },
          { label: '5 - Cannot read at all', value: 5 }
        ]
      },
      {
        id: 'q5',
        text: '5. Headaches',
        type: 'select',
        options: [
          { label: '0 - No headaches at all', value: 0 },
          { label: '1 - Slight headaches which come infrequently', value: 1 },
          { label: '2 - Moderate headaches which come infrequently', value: 2 },
          { label: '3 - Moderate headaches which come frequently', value: 3 },
          { label: '4 - Severe headaches which come frequently', value: 4 },
          { label: '5 - Headaches almost all the time', value: 5 }
        ]
      },
      {
        id: 'q6',
        text: '6. Concentration',
        type: 'select',
        options: [
          { label: '0 - Concentrate fully with no difficulty', value: 0 },
          { label: '1 - Concentrate fully with slight difficulty', value: 1 },
          { label: '2 - Fair degree of difficulty in concentrating', value: 2 },
          { label: '3 - Lot of difficulty in concentrating', value: 3 },
          { label: '4 - Great deal of difficulty in concentrating', value: 4 },
          { label: '5 - Cannot concentrate at all', value: 5 }
        ]
      },
      {
        id: 'q7',
        text: '7. Work',
        type: 'select',
        options: [
          { label: '0 - Do as much work as I want to', value: 0 },
          { label: '1 - Only do my usual work, but no more', value: 1 },
          { label: '2 - Do most of my usual work, but no more', value: 2 },
          { label: '3 - Cannot do my usual work', value: 3 },
          { label: '4 - Hardly do any work at all', value: 4 },
          { label: '5 - Cannot do any work at all', value: 5 }
        ]
      },
      {
        id: 'q8',
        text: '8. Driving',
        type: 'select',
        options: [
          { label: '0 - Drive my car without any neck pain', value: 0 },
          { label: '1 - Drive as long as I want with slight neck pain', value: 1 },
          { label: '2 - Drive as long as I want with moderate neck pain', value: 2 },
          { label: '3 - Cannot drive as long as I want because of moderate neck pain', value: 3 },
          { label: '4 - Hardly drive at all because of severe neck pain', value: 4 },
          { label: '5 - Cannot drive my car at all', value: 5 }
        ]
      },
      {
        id: 'q9',
        text: '9. Sleeping',
        type: 'select',
        options: [
          { label: '0 - No trouble sleeping', value: 0 },
          { label: '1 - Sleep slightly disturbed (less than 1 hr sleepless)', value: 1 },
          { label: '2 - Sleep mildly disturbed (1-2 hrs sleepless)', value: 2 },
          { label: '3 - Sleep moderately disturbed (2-3 hrs sleepless)', value: 3 },
          { label: '4 - Sleep greatly disturbed (3-5 hrs sleepless)', value: 4 },
          { label: '5 - Sleep completely disturbed (5-7 hrs sleepless)', value: 5 }
        ]
      },
      {
        id: 'q10',
        text: '10. Recreation',
        type: 'select',
        options: [
          { label: '0 - Engage in all recreation with no neck pain', value: 0 },
          { label: '1 - Engage in all recreation with some neck pain', value: 1 },
          { label: '2 - Engage in most, but not all, usual recreation due to neck pain', value: 2 },
          { label: '3 - Engage in few usual recreation due to neck pain', value: 3 },
          { label: '4 - Hardly do any recreation due to neck pain', value: 4 },
          { label: '5 - Cannot engage in any recreation activities at all', value: 5 }
        ]
      }
    ],
    calculateScore: (ans) => {
      let sum = 0;
      let count = 0;
      for (let i = 1; i <= 10; i++) {
        if (ans[`q${i}`] !== undefined && ans[`q${i}`] !== '') {
          sum += Number(ans[`q${i}`]);
          count++;
        }
      }
      const maxPossible = count * 5;
      const percent = maxPossible > 0 ? Math.round((sum / maxPossible) * 100) : 0;
      return { score: sum, maxScore: 50, percent };
    },
    getInterpretation: (_, percent) => {
      const pct = percent ?? 0;
      if (pct <= 8) return 'No Disability';
      if (pct <= 28) return 'Mild Disability';
      if (pct <= 48) return 'Moderate Disability';
      if (pct <= 68) return 'Severe Disability';
      return 'Complete Disability';
    }
  },
  {
    id: 'ODI',
    name: 'ODI (Oswestry Disability Index)',
    categories: ['Spine'],
    description: 'Outcome measure for low back pain and disability.',
    scoreDirection: 'lower_better',
    questions: [
      {
        id: 'q1',
        text: '1. Pain Intensity',
        type: 'select',
        options: [
          { label: '0 - Tolerate pain without pain killers', value: 0 },
          { label: '1 - Pain bad but manage without pain killers', value: 1 },
          { label: '2 - Pain killers give complete relief', value: 2 },
          { label: '3 - Pain killers give moderate relief', value: 3 },
          { label: '4 - Pain killers give very little relief', value: 4 },
          { label: '5 - Pain killers have no effect, do not use them', value: 5 }
        ]
      },
      {
        id: 'q2',
        text: '2. Personal Care (Washing, Dressing, etc.)',
        type: 'select',
        options: [
          { label: '0 - Normal self care without causing extra pain', value: 0 },
          { label: '1 - Normal self care but it causes extra pain', value: 1 },
          { label: '2 - Painful to look after myself, slow and careful', value: 2 },
          { label: '3 - Need some help but manage most self care', value: 3 },
          { label: '4 - Need help every day in most aspects of self care', value: 4 },
          { label: '5 - Do not get dressed, wash with difficulty, stay in bed', value: 5 }
        ]
      },
      {
        id: 'q3',
        text: '3. Lifting',
        type: 'select',
        options: [
          { label: '0 - Lift heavy weights without extra pain', value: 0 },
          { label: '1 - Lift heavy weights but it gives extra pain', value: 1 },
          { label: '2 - Pain prevents lifting heavy weights off floor, but can manage if conveniently positioned', value: 2 },
          { label: '3 - Pain prevents lifting heavy weights, but light/medium convenient', value: 3 },
          { label: '4 - Lift only very light weights', value: 4 },
          { label: '5 - Cannot lift or carry anything at all', value: 5 }
        ]
      },
      {
        id: 'q4',
        text: '4. Walking',
        type: 'select',
        options: [
          { label: '0 - Pain does not prevent me walking any distance', value: 0 },
          { label: '1 - Pain prevents walking more than 1 mile', value: 1 },
          { label: '2 - Pain prevents walking more than 1/2 mile', value: 2 },
          { label: '3 - Pain prevents walking more than 100 yards', value: 3 },
          { label: '4 - Can only walk using a stick or crutches', value: 4 },
          { label: '5 - In bed most of time, crawl to toilet', value: 5 }
        ]
      },
      {
        id: 'q5',
        text: '5. Sitting',
        type: 'select',
        options: [
          { label: '0 - Sit in any chair as long as I like', value: 0 },
          { label: '1 - Sit in my favourite chair as long as I like', value: 1 },
          { label: '2 - Pain prevents sitting more than 1 hour', value: 2 },
          { label: '3 - Pain prevents sitting more than 30 minutes', value: 3 },
          { label: '4 - Pain prevents sitting more than 10 minutes', value: 4 },
          { label: '5 - Pain prevents sitting at all', value: 5 }
        ]
      },
      {
        id: 'q6',
        text: '6. Standing',
        type: 'select',
        options: [
          { label: '0 - Stand as long as I want without extra pain', value: 0 },
          { label: '1 - Stand as long as I want but it gives extra pain', value: 1 },
          { label: '2 - Pain prevents standing for more than 1 hour', value: 2 },
          { label: '3 - Pain prevents standing for more than 30 minutes', value: 3 },
          { label: '4 - Pain prevents standing for more than 10 minutes', value: 4 },
          { label: '5 - Pain prevents standing at all', value: 5 }
        ]
      },
      {
        id: 'q7',
        text: '7. Sleeping',
        type: 'select',
        options: [
          { label: '0 - Sleep never disturbed by pain', value: 0 },
          { label: '1 - Sleep occasionally disturbed by pain', value: 1 },
          { label: '2 - Because of pain I get less than 6 hours sleep', value: 2 },
          { label: '3 - Because of pain I get less than 4 hours sleep', value: 3 },
          { label: '4 - Because of pain I get less than 2 hours sleep', value: 4 },
          { label: '5 - Pain prevents sleeping at all', value: 5 }
        ]
      },
      {
        id: 'q8',
        text: '8. Sex Life (If applicable)',
        type: 'select',
        options: [
          { label: '0 - Sex life normal, causes no extra pain', value: 0 },
          { label: '1 - Sex life normal, causes some extra pain', value: 1 },
          { label: '2 - Sex life nearly normal but is very painful', value: 2 },
          { label: '3 - Sex life severely restricted by pain', value: 3 },
          { label: '4 - Sex life nearly absent because of pain', value: 4 },
          { label: '5 - Pain prevents any sex life at all', value: 5 }
        ]
      },
      {
        id: 'q9',
        text: '9. Social Life',
        type: 'select',
        options: [
          { label: '0 - Social life normal, no extra pain', value: 0 },
          { label: '1 - Social life normal, increases degree of pain', value: 1 },
          { label: '2 - Pain limits energetic social interests', value: 2 },
          { label: '3 - Pain restricted social life, do not go out often', value: 3 },
          { label: '4 - Pain restricted social life to my home', value: 4 },
          { label: '5 - No social life because of pain', value: 5 }
        ]
      },
      {
        id: 'q10',
        text: '10. Traveling',
        type: 'select',
        options: [
          { label: '0 - Travel anywhere without pain', value: 0 },
          { label: '1 - Travel anywhere but it gives extra pain', value: 1 },
          { label: '2 - Pain bad, manage journeys over 2 hours', value: 2 },
          { label: '3 - Pain restricts journeys to less than 1 hour', value: 3 },
          { label: '4 - Pain restricts journeys to less than 30 minutes', value: 4 },
          { label: '5 - Pain prevents traveling except for treatment', value: 5 }
        ]
      }
    ],
    calculateScore: (ans) => {
      let sum = 0;
      let count = 0;
      for (let i = 1; i <= 10; i++) {
        if (ans[`q${i}`] !== undefined && ans[`q${i}`] !== '') {
          sum += Number(ans[`q${i}`]);
          count++;
        }
      }
      const maxPossible = count * 5;
      const percent = maxPossible > 0 ? Math.round((sum / maxPossible) * 100) : 0;
      return { score: sum, maxScore: 50, percent };
    },
    getInterpretation: (_, percent) => {
      const pct = percent ?? 0;
      if (pct <= 20) return 'Minimal Disability';
      if (pct <= 40) return 'Moderate Disability';
      if (pct <= 60) return 'Severe Disability';
      if (pct <= 80) return 'Crippled';
      return 'Bed-Bound or Exaggerating';
    }
  },
  {
    id: 'RMDQ',
    name: 'Roland-Morris Disability Questionnaire (RMDQ)',
    categories: ['Spine'],
    description: '24-item checklist to assess physical disability due to low back pain.',
    scoreDirection: 'lower_better',
    questions: [
      {
        id: 'items',
        text: 'Select the statements that apply to you today:',
        type: 'checklist',
        defaultValue: [],
        options: [
          { label: '1. I stay at home most of the time because of my back.', value: 1 },
          { label: '2. I change positions frequently to try and get my back comfortable.', value: 2 },
          { label: '3. I walk more slowly than usual because of my back.', value: 3 },
          { label: '4. Because of my back, I am not doing any of the jobs that I usually do around the house.', value: 4 },
          { label: '5. Because of my back, I use a handrail to get upstairs.', value: 5 },
          { label: '6. Because of my back, I lie down to rest more often.', value: 6 },
          { label: '7. Because of my back, I have to hold on to something to get out of an easy chair.', value: 7 },
          { label: '8. Because of my back, I try to get other people to do things for me.', value: 8 },
          { label: '9. I get dressed more slowly than usual because of my back.', value: 9 },
          { label: '10. I only stand up for short periods of time because of my back.', value: 10 },
          { label: '11. Because of my back, I try not to bend or kneel down.', value: 11 },
          { label: '12. I find it difficult to get out of a chair or keep still.', value: 12 },
          { label: '13. My back is painful almost all the time.', value: 13 },
          { label: '14. I find it difficult to turn over in bed.', value: 14 },
          { label: '15. My appetite is not very good because of my back pain.', value: 15 },
          { label: '16. I have trouble putting on my socks (or stockings) because of the pain in my back.', value: 16 },
          { label: '17. I only walk short distances because of my back pain.', value: 17 },
          { label: '18. I sleep less well because of my back.', value: 18 },
          { label: '19. Because of my back pain, I get dressed with help from someone else.', value: 19 },
          { label: '20. I sit down for most of the day because of my back.', value: 20 },
          { label: '21. I avoid heavy jobs around the house because of my back.', value: 21 },
          { label: '22. Because of my back pain, I am more irritable and bad tempered with people than usual.', value: 22 },
          { label: '23. Because of my back, I go upstairs more slowly than usual.', value: 23 },
          { label: '24. I stay in bed most of the time because of my back.', value: 24 }
        ]
      }
    ],
    calculateScore: (ans) => {
      const checked = Array.isArray(ans.items) ? ans.items : [];
      return { score: checked.length, maxScore: 24 };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s <= 4) return 'Mild disability';
      if (s <= 12) return 'Moderate disability';
      if (s <= 20) return 'Severe disability';
      return 'Very severe disability';
    }
  },

  // ==========================================
  // 3. SHOULDER / UPPER LIMB
  // ==========================================
  {
    id: 'SPADI',
    name: 'SPADI (Shoulder Pain and Disability Index)',
    categories: ['Shoulder'],
    description: '13-item scale assessing shoulder pain (5 items) and disability (8 items).',
    scoreDirection: 'lower_better',
    questions: [
      { id: 'p1', text: 'Pain 1: At its worst', type: 'select', options: createRadioOptions(10, { 0: 'No Pain', 10: 'Worst Pain' }) },
      { id: 'p2', text: 'Pain 2: Lying on the involved side', type: 'select', options: createRadioOptions(10) },
      { id: 'p3', text: 'Pain 3: Reaching for something on a high shelf', type: 'select', options: createRadioOptions(10) },
      { id: 'p4', text: 'Pain 4: Touching the back of your neck', type: 'select', options: createRadioOptions(10) },
      { id: 'p5', text: 'Pain 5: Pushing with the involved arm', type: 'select', options: createRadioOptions(10) },
      { id: 'd1', text: 'Disability 1: Washing your hair', type: 'select', options: createRadioOptions(10, { 0: 'No Difficulty', 10: 'Unable' }) },
      { id: 'd2', text: 'Disability 2: Washing your back', type: 'select', options: createRadioOptions(10) },
      { id: 'd3', text: 'Disability 3: Putting on an undershirt or pullover', type: 'select', options: createRadioOptions(10) },
      { id: 'd4', text: 'Disability 4: Putting on a buttoned shirt', type: 'select', options: createRadioOptions(10) },
      { id: 'd5', text: 'Disability 5: Putting on pants', type: 'select', options: createRadioOptions(10) },
      { id: 'd6', text: 'Disability 6: Zipping or buttoning clothes', type: 'select', options: createRadioOptions(10) },
      { id: 'd7', text: 'Disability 7: Carrying a heavy object (10 lbs / 4.5 kg)', type: 'select', options: createRadioOptions(10) },
      { id: 'd8', text: 'Disability 8: Removing object from back pocket', type: 'select', options: createRadioOptions(10) }
    ],
    calculateScore: (ans) => {
      let painSum = 0;
      let painCount = 0;
      for (let i = 1; i <= 5; i++) {
        if (ans[`p${i}`] !== undefined && ans[`p${i}`] !== '') {
          painSum += Number(ans[`p${i}`]);
          painCount++;
        }
      }
      let disSum = 0;
      let disCount = 0;
      for (let i = 1; i <= 8; i++) {
        if (ans[`d${i}`] !== undefined && ans[`d${i}`] !== '') {
          disSum += Number(ans[`d${i}`]);
          disCount++;
        }
      }
      const painPct = painCount > 0 ? (painSum / (painCount * 10)) * 100 : 0;
      const disPct = disCount > 0 ? (disSum / (disCount * 10)) * 100 : 0;
      const total = Math.round((painPct + disPct) / 2);
      return { score: total, maxScore: 100, percent: total };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s <= 30) return 'Low Shoulder Impairment';
      if (s <= 60) return 'Moderate Shoulder Impairment';
      return 'Severe Shoulder Impairment';
    }
  },
  {
    id: 'DASH',
    name: 'DASH (Disabilities of the Arm, Shoulder, and Hand)',
    categories: ['Shoulder', 'General Function'],
    description: '30-item questionnaire measuring physical function and symptoms in upper extremity disorders.',
    scoreDirection: 'lower_better',
    questions: [
      {
        id: 'total_score_input',
        text: 'Clinician: Input the sum of all 30 questions (each rated 1 to 5):',
        type: 'number',
        min: 30,
        max: 150,
        defaultValue: 30
      }
    ],
    calculateScore: (ans) => {
      const sum = Number(ans.total_score_input ?? 30);
      // Formula: ((sum / 30) - 1) * 25
      const score = Math.round(((sum / 30) - 1) * 25);
      return { score, maxScore: 100, percent: score };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s <= 15) return 'Minimal Disability';
      if (s <= 40) return 'Moderate Disability';
      return 'Severe Upper Limb Disability';
    }
  },
  {
    id: 'QuickDASH',
    name: 'QuickDASH Outcome Measure',
    categories: ['Shoulder', 'General Function', 'Sports'],
    description: '11-item questionnaire measuring function and symptoms of upper-limb disorders.',
    scoreDirection: 'lower_better',
    questions: Array.from({ length: 11 }, (_, idx) => {
      const labels = [
        '1. Open a tight or new jar',
        '2. Do heavy household chores (e.g., wash walls, floors)',
        '3. Carry a shopping bag or briefcase',
        '4. Wash your back',
        '5. Use a knife to cut food',
        '6. Recreational activities requiring force/impact',
        '7. Social activities limitation due to arm/hand problem',
        '8. Limit in work or other daily activities due to arm/hand problem',
        '9. Arm, shoulder or hand pain intensity',
        '10. Tingling (needles and pins) in arm, shoulder or hand',
        '11. Difficulty sleeping due to arm, shoulder or hand pain'
      ];
      return {
        id: `q${idx + 1}`,
        text: labels[idx],
        type: 'select',
        options: [
          { label: '1 - No difficulty / None', value: 1 },
          { label: '2 - Mild difficulty / Mild', value: 2 },
          { label: '3 - Moderate difficulty / Moderate', value: 3 },
          { label: '4 - Severe difficulty / Severe', value: 4 },
          { label: '5 - Unable / Extreme', value: 5 }
        ]
      };
    }),
    calculateScore: (ans) => {
      let sum = 0;
      let count = 0;
      for (let i = 1; i <= 11; i++) {
        if (ans[`q${i}`] !== undefined && ans[`q${i}`] !== '') {
          sum += Number(ans[`q${i}`]);
          count++;
        }
      }
      if (count < 10) return { score: 'Insufficient data (min 10 items)', maxScore: 100 };
      const score = Math.round(((sum / count) - 1) * 25);
      return { score, maxScore: 100, percent: score };
    },
    getInterpretation: (score) => {
      if (typeof score === 'string') return score;
      if (score <= 15) return 'Minimal Disability';
      if (score <= 40) return 'Moderate Disability';
      return 'Severe Upper Limb Disability';
    }
  },
  {
    id: 'ASES',
    name: 'ASES Shoulder Score',
    categories: ['Shoulder'],
    description: 'ASES clinical score evaluating shoulder pain (50%) and activities of daily living (50%).',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'pain_vas',
        text: 'Pain Score (VAS 0-10, where 10 is worst pain):',
        type: 'slider',
        min: 0,
        max: 10,
        defaultValue: 0
      },
      {
        id: 'adl_sum',
        text: 'Sum of 10 ADL activities (each rated 0 = unable, to 3 = normal):',
        type: 'number',
        min: 0,
        max: 30,
        defaultValue: 30
      }
    ],
    calculateScore: (ans) => {
      const painVal = Number(ans.pain_vas ?? 0);
      const adlVal = Number(ans.adl_sum ?? 30);
      // Formula: ((10 - Pain VAS) * 5) + (ADL Sum * 5 / 3)
      const score = Math.round(((10 - painVal) * 5) + (adlVal * (5 / 3)));
      return { score, maxScore: 100, percent: score };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 80) return 'Excellent Shoulder Function';
      if (s >= 60) return 'Good Function';
      if (s >= 40) return 'Fair Function';
      return 'Poor Shoulder Function';
    }
  },

  // ==========================================
  // 4. KNEE
  // ==========================================
  {
    id: 'KOOS',
    name: 'KOOS Joint Survey (Knee Osteoarthritis)',
    categories: ['Knee'],
    description: 'Outcome measure for knee injury and knee osteoarthritis.',
    scoreDirection: 'higher_better',
    questions: [
      { id: 'q1', text: '1. How often do you experience knee pain?', type: 'select', options: [{ label: '0 - Never', value: 0 }, { label: '1 - Monthly', value: 1 }, { label: '2 - Weekly', value: 2 }, { label: '3 - Daily', value: 3 }, { label: '4 - Always', value: 4 }] },
      { id: 'q2', text: '2. Has your knee been swollen or felt full?', type: 'select', options: [{ label: '0 - Never', value: 0 }, { label: '1 - Rarely', value: 1 }, { label: '2 - Sometimes', value: 2 }, { label: '3 - Often', value: 3 }, { label: '4 - Always', value: 4 }] },
      { id: 'q3', text: '3. Difficulty rising from sitting to standing due to your knee?', type: 'select', options: [{ label: '0 - None', value: 0 }, { label: '1 - Mild', value: 1 }, { label: '2 - Moderate', value: 2 }, { label: '3 - Severe', value: 3 }, { label: '4 - Extreme', value: 4 }] },
      { id: 'q4', text: '4. Difficulty squatting down due to your knee?', type: 'select', options: [{ label: '0 - None', value: 0 }, { label: '1 - Mild', value: 1 }, { label: '2 - Moderate', value: 2 }, { label: '3 - Severe', value: 3 }, { label: '4 - Extreme', value: 4 }] },
      { id: 'q5', text: '5. How much do you trust your knee? (stability)', type: 'select', options: [{ label: '0 - Fully', value: 0 }, { label: '1 - Mostly', value: 1 }, { label: '2 - Weekly', value: 2 }, { label: '3 - Daily', value: 3 }, { label: '4 - Always', value: 4 }] }
    ],
    calculateScore: (ans) => {
      let sum = 0;
      for (let i = 1; i <= 5; i++) sum += Number(ans[`q${i}`] ?? 0);
      const score = Math.round(100 - (sum / 20) * 100);
      return { score, maxScore: 100, percent: score };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 80) return 'Good Knee Function';
      if (s >= 50) return 'Moderate Knee Limitations';
      return 'Severe Knee Impairment';
    }
  },
  {
    id: 'WOMAC',
    name: 'WOMAC Osteoarthritis Index',
    categories: ['Knee', 'Hip'],
    description: 'Outcome measure for knee and hip osteoarthritis pain, stiffness, and function.',
    scoreDirection: 'lower_better',
    questions: [
      { id: 'p1', text: 'Pain 1: Walking on flat ground', type: 'select', options: [{ label: '0 - None', value: 0 }, { label: '1 - Mild', value: 1 }, { label: '2 - Moderate', value: 2 }, { label: '3 - Severe', value: 3 }, { label: '4 - Extreme', value: 4 }] },
      { id: 'p2', text: 'Pain 2: Going up or down stairs', type: 'select', options: [{ label: '0 - None', value: 0 }, { label: '1 - Mild', value: 1 }, { label: '2 - Moderate', value: 2 }, { label: '3 - Severe', value: 3 }, { label: '4 - Extreme', value: 4 }] },
      { id: 'p3', text: 'Pain 3: At night while in bed', type: 'select', options: [{ label: '0 - None', value: 0 }, { label: '1 - Mild', value: 1 }, { label: '2 - Moderate', value: 2 }, { label: '3 - Severe', value: 3 }, { label: '4 - Extreme', value: 4 }] },
      { id: 's1', text: 'Stiffness 1: First waking in morning', type: 'select', options: [{ label: '0 - None', value: 0 }, { label: '1 - Mild', value: 1 }, { label: '2 - Moderate', value: 2 }, { label: '3 - Severe', value: 3 }, { label: '4 - Extreme', value: 4 }] },
      { id: 's2', text: 'Stiffness 2: Later in the day after sitting/lying', type: 'select', options: [{ label: '0 - None', value: 0 }, { label: '1 - Mild', value: 1 }, { label: '2 - Moderate', value: 2 }, { label: '3 - Severe', value: 3 }, { label: '4 - Extreme', value: 4 }] },
      { id: 'f1', text: 'Function 1: Descending stairs', type: 'select', options: [{ label: '0 - None', value: 0 }, { label: '1 - Mild', value: 1 }, { label: '2 - Moderate', value: 2 }, { label: '3 - Severe', value: 3 }, { label: '4 - Extreme', value: 4 }] },
      { id: 'f2', text: 'Function 2: Ascending stairs', type: 'select', options: [{ label: '0 - None', value: 0 }, { label: '1 - Mild', value: 1 }, { label: '2 - Moderate', value: 2 }, { label: '3 - Severe', value: 3 }, { label: '4 - Extreme', value: 4 }] },
      { id: 'f3', text: 'Function 3: Rising from sitting', type: 'select', options: [{ label: '0 - None', value: 0 }, { label: '1 - Mild', value: 1 }, { label: '2 - Moderate', value: 2 }, { label: '3 - Severe', value: 3 }, { label: '4 - Extreme', value: 4 }] }
    ],
    calculateScore: (ans) => {
      const keys = ['p1', 'p2', 'p3', 's1', 's2', 'f1', 'f2', 'f3'];
      let sum = 0;
      keys.forEach(k => { sum += Number(ans[k] ?? 0); });
      const percent = Math.round((sum / 32) * 100);
      return { score: sum, maxScore: 32, percent };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s <= 8) return 'Mild Osteoarthritis Severity';
      if (s <= 18) return 'Moderate Osteoarthritis Severity';
      return 'Severe Osteoarthritis Severity';
    }
  },
  {
    id: 'OxfordKnee',
    name: 'Oxford Knee Score (OKS)',
    categories: ['Knee'],
    description: '12-item questionnaire measuring joint pain and function for knee replacement candidates.',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'total_score_input',
        text: 'Clinician: Sum of all 12 items (each scored 0 = severe difficulty, to 4 = no difficulty):',
        type: 'number',
        min: 0,
        max: 48,
        defaultValue: 48
      }
    ],
    calculateScore: (ans) => ({ score: ans.total_score_input ?? 48, maxScore: 48 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s <= 19) return 'Severe Knee Arthritis / Impairment';
      if (s <= 29) return 'Moderate Knee Limitations';
      if (s <= 39) return 'Mild to Moderate Joint Issues';
      return 'Satisfactory / Good Joint Function';
    }
  },
  {
    id: 'Lysholm',
    name: 'Lysholm Knee Scoring Scale',
    categories: ['Knee'],
    description: '8-item instrument to evaluate knee ligament injuries and instability.',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'limp',
        text: '1. Limp',
        type: 'select',
        options: [
          { label: '5 - None', value: 5 },
          { label: '3 - Slight or periodical', value: 3 },
          { label: '0 - Constant', value: 0 }
        ]
      },
      {
        id: 'support',
        text: '2. Support Needed',
        type: 'select',
        options: [
          { label: '5 - None', value: 5 },
          { label: '2 - Stick or crutch', value: 2 },
          { label: '0 - Weight-bearing impossible', value: 0 }
        ]
      },
      {
        id: 'locking',
        text: '3. Locking Sensation',
        type: 'select',
        options: [
          { label: '15 - No locking or catching', value: 15 },
          { label: '10 - Catching but no locking', value: 10 },
          { label: '6 - Locking occasionally', value: 6 },
          { label: '2 - Locking frequently', value: 2 },
          { label: '0 - Locked on examination', value: 0 }
        ]
      },
      {
        id: 'instability',
        text: '4. Instability (giving way)',
        type: 'select',
        options: [
          { label: '25 - Never gives way', value: 25 },
          { label: '20 - Rarely during athletics/heavy work', value: 20 },
          { label: '15 - Frequently during athletics/heavy work', value: 15 },
          { label: '10 - Occasionally during daily activities', value: 10 },
          { label: '5 - Frequently during daily activities', value: 5 },
          { label: '0 - Every step', value: 0 }
        ]
      },
      {
        id: 'pain',
        text: '5. Pain',
        type: 'select',
        options: [
          { label: '25 - None', value: 25 },
          { label: '20 - Inconstant and slight during severe exertion', value: 20 },
          { label: '15 - Marked during severe exertion', value: 15 },
          { label: '10 - Marked during or after walking > 2km', value: 10 },
          { label: '5 - Marked during or after walking < 2km', value: 5 },
          { label: '0 - Constant', value: 0 }
        ]
      },
      {
        id: 'swelling',
        text: '6. Swelling',
        type: 'select',
        options: [
          { label: '10 - None', value: 10 },
          { label: '6 - On severe exertion', value: 6 },
          { label: '2 - On ordinary exertion', value: 2 },
          { label: '0 - Constant', value: 0 }
        ]
      },
      {
        id: 'stairs',
        text: '7. Climbing Stairs',
        type: 'select',
        options: [
          { label: '10 - No problem', value: 10 },
          { label: '6 - Slightly impaired', value: 6 },
          { label: '2 - One step at a time', value: 2 },
          { label: '0 - Impossible', value: 0 }
        ]
      },
      {
        id: 'squatting',
        text: '8. Squatting',
        type: 'select',
        options: [
          { label: '5 - No problem', value: 5 },
          { label: '4 - Slightly impaired', value: 4 },
          { label: '2 - Not beyond 90 degrees', value: 2 },
          { label: '0 - Impossible', value: 0 }
        ]
      }
    ],
    calculateScore: (ans) => {
      const keys = ['limp', 'support', 'locking', 'instability', 'pain', 'swelling', 'stairs', 'squatting'];
      let sum = 0;
      keys.forEach(k => { sum += Number(ans[k] ?? 0); });
      return { score: sum, maxScore: 100, percent: sum };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s < 65) return 'Poor Knee Condition';
      if (s <= 83) return 'Fair';
      if (s <= 90) return 'Good';
      return 'Excellent';
    }
  },
  {
    id: 'IKDC',
    name: 'IKDC Subjective Knee Evaluation Form',
    categories: ['Knee', 'Sports'],
    description: 'Measures subjective symptoms, function, and sports activity level.',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'ikdc_sum',
        text: 'Clinician: Sum of all completed items (each scored 0 to 4 points):',
        type: 'number',
        min: 0,
        max: 80,
        defaultValue: 80
      },
      {
        id: 'items_answered',
        text: 'Number of items answered (max 18):',
        type: 'number',
        min: 1,
        max: 18,
        defaultValue: 18
      }
    ],
    calculateScore: (ans) => {
      const sum = Number(ans.ikdc_sum ?? 80);
      const count = Number(ans.items_answered ?? 18);
      const maxPossible = count * 4;
      const score = maxPossible > 0 ? Math.round((sum / maxPossible) * 100) : 0;
      return { score, maxScore: 100, percent: score };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 80) return 'High function / Minimal symptoms';
      if (s >= 50) return 'Moderate knee dysfunction';
      return 'Severe knee dysfunction';
    }
  },

  // ==========================================
  // 5. HIP
  // ==========================================
  {
    id: 'HOOS',
    name: 'HOOS Joint Survey (Hip Osteoarthritis)',
    categories: ['Hip'],
    description: 'Hip disability and osteoarthritis outcome measure.',
    scoreDirection: 'higher_better',
    questions: [
      { id: 'q1', text: '1. How often do you experience hip pain?', type: 'select', options: [{ label: '0 - Never', value: 0 }, { label: '1 - Monthly', value: 1 }, { label: '2 - Weekly', value: 2 }, { label: '3 - Daily', value: 3 }, { label: '4 - Always', value: 4 }] },
      { id: 'q2', text: '2. Has your hip grinding or clicking been felt?', type: 'select', options: [{ label: '0 - Never', value: 0 }, { label: '1 - Rarely', value: 1 }, { label: '2 - Sometimes', value: 2 }, { label: '3 - Often', value: 3 }, { label: '4 - Always', value: 4 }] },
      { id: 'q3', text: '3. Difficulty putting on socks or shoes due to your hip?', type: 'select', options: [{ label: '0 - None', value: 0 }, { label: '1 - Mild', value: 1 }, { label: '2 - Moderate', value: 2 }, { label: '3 - Severe', value: 3 }, { label: '4 - Extreme', value: 4 }] },
      { id: 'q4', text: '4. Difficulty running or quick turns due to your hip?', type: 'select', options: [{ label: '0 - None', value: 0 }, { label: '1 - Mild', value: 1 }, { label: '2 - Moderate', value: 2 }, { label: '3 - Severe', value: 3 }, { label: '4 - Extreme', value: 4 }] },
      { id: 'q5', text: '5. How much has your hip pain affected your lifestyle?', type: 'select', options: [{ label: '0 - Not at all', value: 0 }, { label: '1 - Slightly', value: 1 }, { label: '2 - Moderately', value: 2 }, { label: '3 - Severely', value: 3 }, { label: '4 - Extremely', value: 4 }] }
    ],
    calculateScore: (ans) => {
      let sum = 0;
      for (let i = 1; i <= 5; i++) sum += Number(ans[`q${i}`] ?? 0);
      const score = Math.round(100 - (sum / 20) * 100);
      return { score, maxScore: 100, percent: score };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 80) return 'Good Hip Function';
      if (s >= 50) return 'Moderate Hip Limitations';
      return 'Severe Hip Impairment';
    }
  },
  {
    id: 'HHS',
    name: 'Harris Hip Score',
    categories: ['Hip'],
    description: 'Clinician-administered questionnaire assessing hip function, pain, and ROM.',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'pain',
        text: 'Pain Level',
        type: 'select',
        options: [
          { label: '44 - None / Ignorable', value: 44 },
          { label: '30 - Slight / Mild', value: 30 },
          { label: '20 - Moderate / Tolerable', value: 20 },
          { label: '10 - Marked / Severe', value: 10 },
          { label: '0 - Disabled', value: 0 }
        ]
      },
      {
        id: 'limp',
        text: 'Gait: Limp',
        type: 'select',
        options: [
          { label: '11 - None', value: 11 },
          { label: '8 - Slight', value: 8 },
          { label: '5 - Moderate', value: 5 },
          { label: '0 - Severe / Constant', value: 0 }
        ]
      },
      {
        id: 'support',
        text: 'Gait: Support Needed',
        type: 'select',
        options: [
          { label: '11 - None', value: 11 },
          { label: '7 - Cane for long walks', value: 7 },
          { label: '5 - Cane constantly', value: 5 },
          { label: '2 - Two canes / Crutches', value: 2 },
          { label: '0 - Unable to walk', value: 0 }
        ]
      },
      {
        id: 'stairs',
        text: 'Activities: Climbing Stairs',
        type: 'select',
        options: [
          { label: '4 - Normally without railing', value: 4 },
          { label: '2 - With railing / slowly', value: 2 },
          { label: '0 - Impossible', value: 0 }
        ]
      },
      {
        id: 'socks',
        text: 'Activities: Socks and Shoes',
        type: 'select',
        options: [
          { label: '4 - Easy without difficulty', value: 4 },
          { label: '2 - With difficulty', value: 2 },
          { label: '0 - Impossible', value: 0 }
        ]
      }
    ],
    calculateScore: (ans) => {
      const keys = ['pain', 'limp', 'support', 'stairs', 'socks'];
      let sum = 0;
      keys.forEach(k => { sum += Number(ans[k] ?? 0); });
      return { score: sum, maxScore: 74 };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s < 50) return 'Poor';
      if (s < 60) return 'Fair';
      if (s < 70) return 'Good';
      return 'Excellent';
    }
  },

  // ==========================================
  // 6. ANKLE / FOOT
  // ==========================================
  {
    id: 'FAAM',
    name: 'FAAM (Foot and Ankle Ability Measure)',
    categories: ['Ankle/Foot'],
    description: 'Self-report questionnaire assessing physical function for foot and ankle disorders.',
    scoreDirection: 'higher_better',
    questions: [
      { id: 'q1', text: '1. Standing on flat ground', type: 'select', options: [{ label: '4 - No difficulty', value: 4 }, { label: '3 - Slight', value: 3 }, { label: '2 - Moderate', value: 2 }, { label: '1 - Severe', value: 1 }, { label: '0 - Unable to do', value: 0 }] },
      { id: 'q2', text: '2. Walking on even ground', type: 'select', options: [{ label: '4 - No difficulty', value: 4 }, { label: '3 - Slight', value: 3 }, { label: '2 - Moderate', value: 2 }, { label: '1 - Severe', value: 1 }, { label: '0 - Unable to do', value: 0 }] },
      { id: 'q3', text: '3. Walking on uneven ground', type: 'select', options: [{ label: '4 - No difficulty', value: 4 }, { label: '3 - Slight', value: 3 }, { label: '2 - Moderate', value: 2 }, { label: '1 - Severe', value: 1 }, { label: '0 - Unable to do', value: 0 }] },
      { id: 'q4', text: '4. Climbing stairs', type: 'select', options: [{ label: '4 - No difficulty', value: 4 }, { label: '3 - Slight', value: 3 }, { label: '2 - Moderate', value: 2 }, { label: '1 - Severe', value: 1 }, { label: '0 - Unable to do', value: 0 }] },
      { id: 'q5', text: '5. Squatting', type: 'select', options: [{ label: '4 - No difficulty', value: 4 }, { label: '3 - Slight', value: 3 }, { label: '2 - Moderate', value: 2 }, { label: '1 - Severe', value: 1 }, { label: '0 - Unable to do', value: 0 }] }
    ],
    calculateScore: (ans) => {
      let sum = 0;
      for (let i = 1; i <= 5; i++) sum += Number(ans[`q${i}`] ?? 0);
      const pct = Math.round((sum / 20) * 100);
      return { score: sum, maxScore: 20, percent: pct };
    },
    getInterpretation: (_, percent) => {
      const p = percent ?? 0;
      if (p >= 85) return 'Full/Near Normal Function';
      if (p >= 50) return 'Moderate Dysfunction';
      return 'Severe Dysfunction';
    }
  },
  {
    id: 'AOFAS',
    name: 'AOFAS Clinical Rating Scale',
    categories: ['Ankle/Foot'],
    description: 'Standard clinical scale combining pain (40%), function (50%), and alignment (10%).',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'pain',
        text: 'Pain (40 pts max):',
        type: 'select',
        options: [
          { label: '40 - None / Ignorable', value: 40 },
          { label: '30 - Mild / Occasional', value: 30 },
          { label: '20 - Moderate / Daily', value: 20 },
          { label: '0 - Severe / Constant', value: 0 }
        ]
      },
      {
        id: 'function_val',
        text: 'Function sum score (50 pts max):',
        type: 'number',
        min: 0,
        max: 50,
        defaultValue: 50
      },
      {
        id: 'alignment',
        text: 'Alignment (10 pts max):',
        type: 'select',
        options: [
          { label: '10 - Good (normal plantigrade)', value: 10 },
          { label: '5 - Fair (some malalignment)', value: 5 },
          { label: '0 - Poor (severe malalignment)', value: 0 }
        ]
      }
    ],
    calculateScore: (ans) => {
      const pain = Number(ans.pain ?? 40);
      const func = Number(ans.function_val ?? 50);
      const align = Number(ans.alignment ?? 10);
      const sum = pain + func + align;
      return { score: sum, maxScore: 100, percent: sum };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 90) return 'Excellent outcome';
      if (s >= 80) return 'Good outcome';
      if (s >= 70) return 'Fair';
      return 'Poor clinical status';
    }
  },
  {
    id: 'FFI',
    name: 'Foot Function Index (FFI)',
    categories: ['Ankle/Foot'],
    description: 'Outcome measure assessing foot pain, disability, and activity limitation.',
    scoreDirection: 'lower_better',
    questions: [
      {
        id: 'pain_avg',
        text: 'Average Pain Score (0 = No pain, 10 = Worst pain imaginable):',
        type: 'slider',
        min: 0,
        max: 10,
        defaultValue: 0
      },
      {
        id: 'disability_avg',
        text: 'Average Disability Score (0 = No difficulty, 10 = Unable to perform):',
        type: 'slider',
        min: 0,
        max: 10,
        defaultValue: 0
      }
    ],
    calculateScore: (ans) => {
      const pain = Number(ans.pain_avg ?? 0);
      const dis = Number(ans.disability_avg ?? 0);
      // Normalized to percentage
      const total = Math.round(((pain + dis) / 20) * 100);
      return { score: total, maxScore: 100, percent: total };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s <= 20) return 'Minimal limitations';
      if (s <= 50) return 'Moderate impairment';
      return 'Severe foot disability';
    }
  },

  // ==========================================
  // 7. GENERAL MSK / FUNCTION
  // ==========================================
  {
    id: 'PSFS',
    name: 'PSFS (Patient-Specific Functional Scale)',
    categories: ['General Function'],
    description: 'Patient-selected functional activities rated on difficulty level.',
    scoreDirection: 'higher_better',
    questions: [
      { id: 'act1_name', text: 'Activity 1 Name:', type: 'text', placeholder: 'e.g. Walking up stairs' },
      { id: 'act1_val', text: 'Activity 1 Rating (0 = Unable, 10 = Normal):', type: 'slider', min: 0, max: 10, defaultValue: 5 },
      { id: 'act2_name', text: 'Activity 2 Name:', type: 'text', placeholder: 'e.g. Bending down' },
      { id: 'act2_val', text: 'Activity 2 Rating (0 = Unable, 10 = Normal):', type: 'slider', min: 0, max: 10, defaultValue: 5 }
    ],
    calculateScore: (ans) => {
      let sum = 0;
      let count = 0;
      if (ans.act1_name) { sum += Number(ans.act1_val ?? 5); count++; }
      if (ans.act2_name) { sum += Number(ans.act2_val ?? 5); count++; }
      const avg = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
      return { score: avg, maxScore: 10 };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 8) return 'High function';
      if (s >= 4) return 'Moderate restriction';
      return 'Severe functional restriction';
    }
  },
  {
    id: 'SF36',
    name: 'SF-36 Health Survey (Physical)',
    categories: ['General Function'],
    description: '36-item questionnaire evaluating quality of life and physical wellness.',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'physical_score',
        text: 'Clinician: Input calculated Physical Functioning scale (0 to 100):',
        type: 'slider',
        min: 0,
        max: 100,
        defaultValue: 50
      }
    ],
    calculateScore: (ans) => ({ score: ans.physical_score ?? 50, maxScore: 100, percent: ans.physical_score ?? 50 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 80) return 'Excellent Health Quality';
      if (s >= 50) return 'Moderate Function';
      return 'Poor Quality of Life / Severe Limitations';
    }
  },

  // ==========================================
  // 8. NEUROLOGICAL
  // ==========================================
  {
    id: 'NIHSS',
    name: 'NIH Stroke Scale',
    categories: ['Neurological'],
    description: 'Standardized tool to describe stroke severity.',
    scoreDirection: 'lower_better',
    questions: [
      { id: 'q1', text: '1. Level of Consciousness (LOC)', type: 'select', options: [{ label: '0 - Alert', value: 0 }, { label: '1 - Not alert, minor stimulation', value: 1 }, { label: '2 - Not alert, repeated stimulation', value: 2 }, { label: '3 - Responds only with reflex', value: 3 }] },
      { id: 'q2', text: '2. Best Gaze', type: 'select', options: [{ label: '0 - Normal', value: 0 }, { label: '1 - Partial gaze palsy', value: 1 }, { label: '2 - Forced deviation', value: 2 }] },
      { id: 'q3', text: '3. Visual Fields', type: 'select', options: [{ label: '0 - No visual loss', value: 0 }, { label: '1 - Partial hemianopia', value: 1 }, { label: '2 - Complete hemianopia', value: 2 }, { label: '3 - Bilateral hemianopia', value: 3 }] }
    ],
    calculateScore: (ans) => {
      let sum = 0;
      for (let i = 1; i <= 3; i++) sum += Number(ans[`q${i}`] ?? 0);
      return { score: sum, maxScore: 8 };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s === 0) return 'No stroke symptoms';
      if (s <= 2) return 'Minor stroke';
      if (s <= 5) return 'Moderate stroke';
      return 'Severe stroke severity';
    }
  },
  {
    id: 'FuglMeyer',
    name: 'Fugl-Meyer Assessment (Motor)',
    categories: ['Neurological'],
    description: 'Sensorimotor impairment index evaluating recovery after stroke.',
    scoreDirection: 'higher_better',
    questions: [
      { id: 'q1', text: 'Reflex activity (flexor/extensor)', type: 'select', options: [{ label: '0 - No reflex elicited', value: 0 }, { label: '2 - Reflex activity elicited fully', value: 2 }] },
      { id: 'q2', text: 'Flexor synergetic movement', type: 'select', options: [{ label: '0 - Cannot perform', value: 0 }, { label: '1 - Performs partially', value: 1 }, { label: '2 - Performs fully', value: 2 }] },
      { id: 'q3', text: 'Extensor synergetic movement', type: 'select', options: [{ label: '0 - Cannot perform', value: 0 }, { label: '1 - Performs partially', value: 1 }, { label: '2 - Performs fully', value: 2 }] }
    ],
    calculateScore: (ans) => {
      let sum = 0;
      for (let i = 1; i <= 3; i++) sum += Number(ans[`q${i}`] ?? 0);
      return { score: sum, maxScore: 6 };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 5) return 'Good motor recovery';
      if (s >= 3) return 'Moderate impairment';
      return 'Severe motor deficit';
    }
  },
  {
    id: 'Ashworth',
    name: 'Modified Ashworth Scale',
    categories: ['Neurological'],
    description: 'Scale measuring muscle spasticity and tone.',
    scoreDirection: 'categorical',
    questions: [
      {
        id: 'grade',
        text: 'Select Spasticity/Muscle Tone Grade:',
        type: 'select',
        options: [
          { label: '0 - No increase in muscle tone', value: 0 },
          { label: '1 - Slight increase in tone (catch & release)', value: 1 },
          { label: '1.5 - Slight increase in tone (minimal resistance)', value: 2 },
          { label: '2 - Marked increase in tone through most ROM', value: 3 },
          { label: '3 - Considerable increase in tone (passive movement difficult)', value: 4 },
          { label: '4 - Affected part rigid in flexion/extension', value: 5 }
        ]
      }
    ],
    calculateScore: (ans) => {
      const val = ans.grade ?? 0;
      const grades = ['0', '1', '1+', '2', '3', '4'];
      return { score: grades[val] ?? '0' };
    },
    getInterpretation: (score) => {
      if (score === '0') return 'Normal muscle tone';
      if (score === '1' || score === '1+') return 'Mild spasticity';
      if (score === '2' || score === '3') return 'Moderate spasticity';
      return 'Severe spasticity / contracture';
    }
  },
  {
    id: 'Tardieu',
    name: 'Modified Tardieu Scale (MTS)',
    categories: ['Neurological'],
    description: 'Quantifies spasticity by evaluating muscle response to passive stretch at varying speeds.',
    scoreDirection: 'categorical',
    questions: [
      {
        id: 'reaction_quality',
        text: 'Quality of Muscle Reaction (0 to 5):',
        type: 'select',
        options: [
          { label: '0 - No resistance through passive range', value: 0 },
          { label: '1 - Slight resistance at catch point, no clear catch', value: 1 },
          { label: '2 - Clear catch at precise angle, followed by release', value: 2 },
          { label: '3 - Fatigable clonus (<10 secs) occurring at precise angle', value: 3 },
          { label: '4 - Infatigable clonus (>10 secs) occurring at precise angle', value: 4 },
          { label: '5 - Joint is immobile / contracture', value: 5 }
        ]
      },
      { id: 'r1_angle', text: 'R1 Angle (Angle of catch/clonus in degrees):', type: 'number', placeholder: 'e.g. 45' },
      { id: 'r2_angle', text: 'R2 Angle (Full passive ROM in degrees):', type: 'number', placeholder: 'e.g. 90' }
    ],
    calculateScore: (ans) => {
      const r1 = Number(ans.r1_angle ?? 0);
      const r2 = Number(ans.r2_angle ?? 0);
      const diff = r2 - r1;
      return { score: `Quality: ${ans.reaction_quality ?? 0} (R2-R1: ${diff}°)` };
    },
    getInterpretation: (score) => {
      const scoreStr = String(score);
      if (scoreStr.includes('Quality: 0') || scoreStr.includes('Quality: 1')) return 'Normal / minimal spasticity';
      if (scoreStr.includes('Quality: 2')) return 'Moderate spasticity';
      return 'Significant spastic dynamic component or contracture';
    }
  },
  {
    id: 'Berg',
    name: 'Berg Balance Scale',
    categories: ['Balance', 'Neurological', 'Geriatric'],
    description: '14-item objective measure assessing static balance and fall risk.',
    scoreDirection: 'higher_better',
    questions: [
      { id: 'q1', text: '1. Sitting to standing', type: 'select', options: [{ label: '4 - Able to stand without assist', value: 4 }, { label: '3 - Able to stand with hands', value: 3 }, { label: '2 - Stand using hands after multiple attempts', value: 2 }, { label: '1 - Needs minimal aid', value: 1 }, { label: '0 - Needs mod/max aid', value: 0 }] },
      { id: 'q2', text: '2. Standing unsupported', type: 'select', options: [{ label: '4 - Able to stand safely 2 mins', value: 4 }, { label: '3 - Stand 2 mins with supervision', value: 3 }, { label: '2 - Stand 30 secs unsupported', value: 2 }, { label: '1 - Multiple attempts stand 30 secs', value: 1 }, { label: '0 - Unable to stand', value: 0 }] },
      { id: 'q3', text: '3. Sitting unsupported', type: 'select', options: [{ label: '4 - Able to sit safely 2 mins', value: 4 }, { label: '3 - Sit 2 mins under supervision', value: 3 }, { label: '2 - Sit 30 secs', value: 2 }, { label: '1 - Sit 10 secs', value: 1 }, { label: '0 - Needs support', value: 0 }] },
      { id: 'q4', text: '4. Standing to sitting', type: 'select', options: [{ label: '4 - Sits safely with minimal use of hands', value: 4 }, { label: '3 - Controls descent using hands', value: 3 }, { label: '2 - Uses back of legs against chair', value: 2 }, { label: '1 - Sits independently but uncontrolled descent', value: 1 }, { label: '0 - Needs aid to sit', value: 0 }] }
    ],
    calculateScore: (ans) => {
      let sum = 0;
      for (let i = 1; i <= 4; i++) sum += Number(ans[`q${i}`] ?? 0);
      return { score: sum, maxScore: 16 };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 12) return 'Low Fall Risk';
      if (s >= 6) return 'Medium Fall Risk';
      return 'High Fall Risk';
    }
  },
  {
    id: 'Tinetti',
    name: 'Tinetti / POMA Balance & Gait Scale',
    categories: ['Balance', 'Neurological', 'Geriatric'],
    description: 'Performance-Oriented Mobility Assessment measuring static balance and gait quality.',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'balance_score',
        text: 'Balance section total score (out of 16):',
        type: 'number',
        min: 0,
        max: 16,
        defaultValue: 16
      },
      {
        id: 'gait_score',
        text: 'Gait section total score (out of 12):',
        type: 'number',
        min: 0,
        max: 12,
        defaultValue: 12
      }
    ],
    calculateScore: (ans) => {
      const bal = Number(ans.balance_score ?? 16);
      const gait = Number(ans.gait_score ?? 12);
      return { score: bal + gait, maxScore: 28 };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 24) return 'Low Fall Risk';
      if (s >= 19) return 'Medium Fall Risk';
      return 'High Fall Risk (Frail)';
    }
  },
  {
    id: 'FAC',
    name: 'Functional Ambulation Classification (FAC)',
    categories: ['Neurological'],
    description: '6-point scale to assess level of physical support required during walking.',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'ambulation_grade',
        text: 'Choose current ambulation level:',
        type: 'select',
        options: [
          { label: '0 - Non-functional (Cannot walk or requires 2 assistants)', value: 0 },
          { label: '1 - Continuous manual contact (Requires continuous help of 1 person)', value: 1 },
          { label: '2 - Intermittent manual support (Requires continuous or intermittent contact)', value: 2 },
          { label: '3 - Verbal supervision (Requires supervision, no physical contact)', value: 3 },
          { label: '4 - Independent on level ground (Needs assistance on stairs/slopes)', value: 4 },
          { label: '5 - Fully Independent (Walks anywhere safely)', value: 5 }
        ]
      }
    ],
    calculateScore: (ans) => ({ score: ans.ambulation_grade ?? 5, maxScore: 5 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s === 5) return 'Fully Independent Walk';
      if (s >= 3) return 'Supervised / Level Independent';
      return 'Dependent Ambulation';
    }
  },
  {
    id: 'Barthel',
    name: 'Barthel Index of Activities of Daily Living',
    categories: ['Neurological', 'Geriatric'],
    description: '10-item questionnaire measuring independence in basic ADLs (mobility, personal care).',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'adl_sum',
        text: 'Clinician: Sum of all 10 Barthel items (total score ranges from 0 to 100):',
        type: 'number',
        min: 0,
        max: 100,
        defaultValue: 100
      }
    ],
    calculateScore: (ans) => ({ score: ans.adl_sum ?? 100, maxScore: 100, percent: ans.adl_sum ?? 100 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s === 100) return 'Fully Independent';
      if (s >= 60) return 'Mild Dependency';
      if (s >= 40) return 'Moderate Dependency';
      return 'Severe ADL Dependency';
    }
  },
  {
    id: 'mRS',
    name: 'Modified Rankin Scale (mRS)',
    categories: ['Neurological'],
    description: 'Measuring degree of disability or dependence in patients who suffered a stroke.',
    scoreDirection: 'lower_better',
    questions: [
      {
        id: 'grade',
        text: 'Select Disability Grade:',
        type: 'select',
        options: [
          { label: '0 - No symptoms at all', value: 0 },
          { label: '1 - No significant disability despite symptoms; able to carry out all usual duties', value: 1 },
          { label: '2 - Slight disability; unable to carry out all previous activities, but able to look after own affairs', value: 2 },
          { label: '3 - Moderate disability; requiring some help, but able to walk without assistance', value: 3 },
          { label: '4 - Moderately severe disability; unable to walk without assistance and unable to attend to own bodily needs', value: 4 },
          { label: '5 - Severe disability; bedridden, incontinent and requiring constant nursing care', value: 5 },
          { label: '6 - Dead', value: 6 }
        ]
      }
    ],
    calculateScore: (ans) => ({ score: ans.grade ?? 0, maxScore: 6 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s <= 1) return 'No/Minimal Disability';
      if (s <= 3) return 'Moderate Independent Disability';
      return 'Severe Dependency / Dead';
    }
  },
  {
    id: 'MDS_UPDRS',
    name: 'MDS-UPDRS (Motor Subscale)',
    categories: ['Neurological'],
    description: 'Unified Parkinson Disease Rating Scale - Part III Motor Examination.',
    scoreDirection: 'lower_better',
    questions: [
      {
        id: 'motor_total',
        text: 'Clinician: Total score of Part III Motor Examination (0 to 132 scale):',
        type: 'number',
        min: 0,
        max: 132,
        defaultValue: 0
      }
    ],
    calculateScore: (ans) => ({ score: ans.motor_total ?? 0, maxScore: 132 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s <= 20) return 'Mild Motor Symptoms';
      if (s <= 50) return 'Moderate Parkinsonian symptoms';
      return 'Severe Parkinsonian Motor Deficits';
    }
  },
  {
    id: 'SARA',
    name: 'SARA (Scale for the Assessment and Rating of Ataxia)',
    categories: ['Neurological'],
    description: '8-item clinical score to rate severity of cerebellar ataxia.',
    scoreDirection: 'lower_better',
    questions: [
      {
        id: 'total_score',
        text: 'Clinician: Sum of all 8 items (Gait, Stance, Sitting, Speech, Finger-Chase, Nose-Finger, Alternating Hands, Heel-Shin):',
        type: 'number',
        min: 0,
        max: 40,
        defaultValue: 0
      }
    ],
    calculateScore: (ans) => ({ score: ans.total_score ?? 0, maxScore: 40 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s <= 10) return 'Mild Ataxia';
      if (s <= 25) return 'Moderate Cerebellar Ataxia';
      return 'Severe Ataxia / Impaired Balance';
    }
  },

  // ==========================================
  // 9. GERIATRIC
  // ==========================================
  {
    id: 'TUG',
    name: 'TUG (Timed Up and Go Test)',
    categories: ['Balance', 'Neurological', 'Geriatric'],
    description: 'Measures mobility and time taken to stand up, walk 3 meters, turn, and sit.',
    scoreDirection: 'lower_better',
    questions: [
      {
        id: 'seconds',
        text: 'Time taken to complete (seconds):',
        type: 'number',
        placeholder: 'e.g. 11.5',
        defaultValue: 10
      }
    ],
    calculateScore: (ans) => ({ score: ans.seconds ? Number(ans.seconds) : 0 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s < 10) return 'Fully Independent / Normal';
      if (s <= 13.5) return 'Frail Elderly Normal Limit';
      return 'High Fall Risk (Frail/Impaired)';
    }
  },
  {
    id: 'FunctionalReach',
    name: 'Functional Reach Test (FRT)',
    categories: ['Geriatric', 'Balance'],
    description: 'Quick clinical measure of dynamic standing balance and fall risk.',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'distance_inches',
        text: 'Forward reach distance in inches:',
        type: 'number',
        placeholder: 'e.g. 11',
        defaultValue: 10
      }
    ],
    calculateScore: (ans) => ({ score: ans.distance_inches ?? 10 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 10) return 'Low Fall Risk (Normal)';
      if (s >= 6) return 'Moderate Fall Risk';
      return 'High Fall Risk (Severe Instability)';
    }
  },
  {
    id: 'LawtonIADL',
    name: 'Lawton-Brody IADL Scale',
    categories: ['Geriatric'],
    description: 'Assesses instrumental activities of daily living (using phone, shopping, medication, finance).',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'iadl_score',
        text: 'Number of independent domains checked (0 to 8):',
        type: 'select',
        options: createRadioOptions(8)
      }
    ],
    calculateScore: (ans) => ({ score: ans.iadl_score ?? 8, maxScore: 8 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s === 8) return 'Fully independent complex ADLs';
      if (s >= 5) return 'Moderate assistance required';
      return 'Severe functional dependency';
    }
  },
  {
    id: 'FallsEfficacy',
    name: 'Falls Efficacy Scale (FES)',
    categories: ['Geriatric', 'Balance'],
    description: '10-item scale assessing fear of falling during basic daily activities.',
    scoreDirection: 'lower_better',
    questions: [
      {
        id: 'fes_sum',
        text: 'Clinician: Sum of 10 items (each rated 1 = very confident, to 10 = not confident):',
        type: 'number',
        min: 10,
        max: 100,
        defaultValue: 10
      }
    ],
    calculateScore: (ans) => ({ score: ans.fes_sum ?? 10, maxScore: 100 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s <= 20) return 'Low fear of falling';
      if (s <= 70) return 'Moderate fear of falling';
      return 'High fear of falling / Avoids activity';
    }
  },

  // ==========================================
  // 10. CARDIOPULMONARY
  // ==========================================
  {
    id: 'BorgDyspnea',
    name: 'Modified Borg Dyspnea Scale',
    categories: ['Cardiopulmonary'],
    description: '0-10 scale assessing shortness of breath / breathing difficulty.',
    scoreDirection: 'lower_better',
    questions: [
      {
        id: 'dyspnea',
        text: 'Rate your shortness of breath level (0 to 10):',
        type: 'select',
        options: [
          { label: '0 - Nothing at all', value: 0 },
          { label: '0.5 - Very, very slight (just noticeable)', value: 1 },
          { label: '1 - Very slight', value: 2 },
          { label: '2 - Slight (light)', value: 3 },
          { label: '3 - Moderate', value: 4 },
          { label: '4 - Somewhat severe', value: 5 },
          { label: '5 - Severe (heavy)', value: 6 },
          { label: '7 - Very severe', value: 7 },
          { label: '9 - Very, very severe (almost maximal)', value: 8 },
          { label: '10 - Maximal', value: 9 }
        ]
      }
    ],
    calculateScore: (ans) => {
      const labels = ['0', '0.5', '1', '2', '3', '4', '5', '7', '9', '10'];
      const val = ans.dyspnea ?? 0;
      return { score: labels[val] ?? '0' };
    },
    getInterpretation: (score) => {
      if (score === '0') return 'No shortness of breath';
      if (score === '1' || score === '2' || score === '0.5') return 'Mild dyspnea';
      if (score === '3' || score === '4' || score === '5') return 'Moderate dyspnea';
      return 'Severe cardiorespiratory distress';
    }
  },
  {
    id: 'BorgRPE',
    name: 'Borg RPE Scale (Rate of Perceived Exertion)',
    categories: ['Cardiopulmonary', 'Sports'],
    description: 'Standard 6-20 scale to monitor and grade exercise intensity.',
    scoreDirection: 'lower_better',
    questions: [
      {
        id: 'rpe',
        text: 'Select Perceived Exertion (6 = No Exertion, 20 = Maximal Exertion):',
        type: 'select',
        options: [
          { label: '6 - No exertion at all', value: 6 },
          { label: '7 - Extremely light', value: 7 },
          { label: '9 - Very light', value: 9 },
          { label: '11 - Light', value: 11 },
          { label: '13 - Somewhat hard', value: 13 },
          { label: '15 - Hard (heavy)', value: 15 },
          { label: '17 - Very hard', value: 17 },
          { label: '19 - Extremely hard', value: 19 },
          { label: '20 - Maximal exertion', value: 20 }
        ]
      }
    ],
    calculateScore: (ans) => ({ score: ans.rpe ?? 6, maxScore: 20 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s <= 11) return 'Light activity';
      if (s <= 14) return 'Moderate conditioning zone';
      return 'Vigorous / High intensity exercise';
    }
  },
  {
    id: 'Walk6Min',
    name: '6-Minute Walk Test (6MWT)',
    categories: ['General Function', 'Sports', 'Cardiopulmonary'],
    description: 'Cardiorespiratory endurance test measuring distance walked in 6 minutes.',
    scoreDirection: 'higher_better',
    questions: [
      { id: 'distance', text: 'Distance walked in 6 minutes (meters):', type: 'number', placeholder: 'e.g. 450' },
      { id: 'dyspnea_pre', text: 'Pre-test Dyspnea (Borg 0-10):', type: 'slider', min: 0, max: 10, defaultValue: 0 },
      { id: 'dyspnea_post', text: 'Post-test Dyspnea (Borg 0-10):', type: 'slider', min: 0, max: 10, defaultValue: 0 }
    ],
    calculateScore: (ans) => ({ score: ans.distance ? Number(ans.distance) : 0 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 500) return 'Excellent Endurance';
      if (s >= 350) return 'Average Endurance';
      return 'Reduced Cardiorespiratory Capacity';
    }
  },
  {
    id: 'Walk2Min',
    name: '2-Minute Walk Test (2MWT)',
    categories: ['Cardiopulmonary'],
    description: 'Abbreviated cardiopulmonary endurance test measuring distance walked in 2 minutes.',
    scoreDirection: 'higher_better',
    questions: [
      { id: 'distance', text: 'Distance walked in 2 minutes (meters):', type: 'number', placeholder: 'e.g. 150' }
    ],
    calculateScore: (ans) => ({ score: ans.distance ? Number(ans.distance) : 0 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 180) return 'Normal Walk Range';
      if (s >= 120) return 'Mildly Reduced Endurance';
      return 'Significantly Impaired Cardiorespiratory Capacity';
    }
  },
  {
    id: 'CAT',
    name: 'COPD Assessment Test (CAT)',
    categories: ['Cardiopulmonary'],
    description: '8-item questionnaire assessing daily impact of COPD symptoms.',
    scoreDirection: 'lower_better',
    questions: [
      {
        id: 'cat_sum',
        text: 'Clinician: Sum of all 8 items (each rated 0 = no symptoms, to 5 = severe symptoms):',
        type: 'number',
        min: 0,
        max: 40,
        defaultValue: 0
      }
    ],
    calculateScore: (ans) => ({ score: ans.cat_sum ?? 0, maxScore: 40 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s <= 10) return 'Low Impact (COPD)';
      if (s <= 20) return 'Medium Impact';
      return 'High/Very High Impact on Quality of Life';
    }
  },
  {
    id: 'mMRC',
    name: 'mMRC Dyspnea Scale',
    categories: ['Cardiopulmonary'],
    description: 'Modified Medical Research Council dyspnea scale to grade breathlessness during daily activity.',
    scoreDirection: 'lower_better',
    questions: [
      {
        id: 'grade',
        text: 'Select mMRC Dyspnea Grade:',
        type: 'select',
        options: [
          { label: 'Grade 0 - Breathless only with strenuous exercise', value: 0 },
          { label: 'Grade 1 - Short of breath when hurrying or walking up slight hill', value: 1 },
          { label: 'Grade 2 - Walk slower than people of same age on level ground due to breathlessness', value: 2 },
          { label: 'Grade 3 - Stop for breath after walking 100 meters or few minutes', value: 3 },
          { label: 'Grade 4 - Too breathless to leave house or when dressing/undressing', value: 4 }
        ]
      }
    ],
    calculateScore: (ans) => ({ score: ans.grade ?? 0, maxScore: 4 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s <= 1) return 'Mild Breathlessness';
      if (s === 2) return 'Moderate Breathlessness';
      return 'Severe Respiratory Disability';
    }
  },

  // ==========================================
  // 11. PEDIATRIC
  // ==========================================
  {
    id: 'AIMS',
    name: 'Alberta Infant Motor Scale (AIMS)',
    categories: ['Pediatric'],
    description: 'Observation scale evaluating motor development in infants from birth to independent walking.',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'total_score',
        text: 'Clinician: Sum of all observed motor items (max score 58):',
        type: 'number',
        min: 0,
        max: 58,
        defaultValue: 0
      }
    ],
    calculateScore: (ans) => ({ score: ans.total_score ?? 0, maxScore: 58 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 45) return 'Normal infant motor progress';
      return 'Requires detailed pediatric review / Delayed development';
    }
  },
  {
    id: 'PDMS',
    name: 'Peabody Developmental Motor Scales (PDMS)',
    categories: ['Pediatric'],
    description: 'Early childhood motor development program assessing gross and fine motor skills.',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'gmq',
        text: 'Clinician: Gross Motor Quotient (GMQ) standard score (avg: 100):',
        type: 'number',
        min: 0,
        max: 150,
        defaultValue: 100
      }
    ],
    calculateScore: (ans) => ({ score: ans.gmq ?? 100 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 90) return 'Average/Above Average Development';
      if (s >= 80) return 'Below Average Development';
      return 'Significantly Delayed Motor Development';
    }
  },
  {
    id: 'GMFM',
    name: 'Gross Motor Function Measure (GMFM)',
    categories: ['Pediatric'],
    description: 'Evaluates changes in gross motor function in children with cerebral palsy.',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'gmfm_score',
        text: 'Clinician: Calculated total percentage score across dimensions (0-100%):',
        type: 'slider',
        min: 0,
        max: 100,
        defaultValue: 100
      }
    ],
    calculateScore: (ans) => ({ score: ans.gmfm_score ?? 100, maxScore: 100, percent: ans.gmfm_score ?? 100 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 80) return 'High Gross Motor Function';
      if (s >= 50) return 'Moderate limits in functional mobility';
      return 'Severe restrictions in posture and movement';
    }
  },
  {
    id: 'PediatricBalance',
    name: 'Pediatric Balance Scale (PBS)',
    categories: ['Pediatric', 'Balance'],
    description: 'Modified Berg Balance Scale for school-age children with mild-to-moderate motor impairment.',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'pbs_score',
        text: 'Clinician: Sum of all 14 balance items (each rated 0 to 4):',
        type: 'number',
        min: 0,
        max: 56,
        defaultValue: 56
      }
    ],
    calculateScore: (ans) => ({ score: ans.pbs_score ?? 56, maxScore: 56 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 45) return 'Good balance / Minimal risk';
      if (s >= 30) return 'Moderate balance dysfunction';
      return 'Severe balance issues / High fall risk';
    }
  },
  {
    id: 'WeeFIM',
    name: 'WeeFIM (Pediatric Functional Independence)',
    categories: ['Pediatric'],
    description: 'Pediatric version of Functional Independence Measure tracking functional performance in children.',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'weefim_score',
        text: 'Clinician: Sum score of all 18 functional items (each rated 1 to 7):',
        type: 'number',
        min: 18,
        max: 126,
        defaultValue: 126
      }
    ],
    calculateScore: (ans) => ({ score: ans.weefim_score ?? 126, maxScore: 126 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 100) return 'Fully independent child ADLs';
      if (s >= 60) return 'Moderate caregiver assistance needed';
      return 'Severe functional dependency';
    }
  },

  // ==========================================
  // 12. SPORTS / FUNCTIONAL
  // ==========================================
  {
    id: 'LEFS',
    name: 'LEFS (Lower Extremity Functional Scale)',
    categories: ['Hip', 'Knee', 'Ankle/Foot', 'General Function', 'Sports'],
    description: 'Questionnaire evaluating functional ability of the lower extremity.',
    scoreDirection: 'higher_better',
    questions: [
      { id: 'q1', text: '1. Any of your usual work, housework, or school activities', type: 'select', options: [{ label: '4 - No difficulty', value: 4 }, { label: '3 - Quite a bit of difficulty', value: 3 }, { label: '2 - Moderate difficulty', value: 2 }, { label: '1 - A little bit of difficulty', value: 1 }, { label: '0 - Extreme difficulty or unable', value: 0 }] },
      { id: 'q2', text: '2. Your usual hobbies, recreational, or sporting activities', type: 'select', options: [{ label: '4 - No difficulty', value: 4 }, { label: '3 - Quite a bit', value: 3 }, { label: '2 - Moderate', value: 2 }, { label: '1 - A little bit', value: 1 }, { label: '0 - Extreme/Unable', value: 0 }] },
      { id: 'q3', text: '3. Getting into or out of a bath', type: 'select', options: [{ label: '4 - No difficulty', value: 4 }, { label: '3 - Quite a bit', value: 3 }, { label: '2 - Moderate', value: 2 }, { label: '1 - A little bit', value: 1 }, { label: '0 - Extreme/Unable', value: 0 }] },
      { id: 'q4', text: '4. Walking between rooms', type: 'select', options: [{ label: '4 - No difficulty', value: 4 }, { label: '3 - Quite a bit', value: 3 }, { label: '2 - Moderate', value: 2 }, { label: '1 - A little bit', value: 1 }, { label: '0 - Extreme/Unable', value: 0 }] },
      { id: 'q5', text: '5. Putting on your shoes or socks', type: 'select', options: [{ label: '4 - No difficulty', value: 4 }, { label: '3 - Quite a bit', value: 3 }, { label: '2 - Moderate', value: 2 }, { label: '1 - A little bit', value: 1 }, { label: '0 - Extreme/Unable', value: 0 }] }
    ],
    calculateScore: (ans) => {
      let sum = 0;
      for (let i = 1; i <= 5; i++) sum += Number(ans[`q${i}`] ?? 0);
      return { score: sum, maxScore: 20 };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 16) return 'High Lower Extremity Function';
      if (s >= 8) return 'Moderate Limitation';
      return 'Severe Limitation';
    }
  },
  {
    id: 'UEFI',
    name: 'Upper Extremity Functional Index (UEFI)',
    categories: ['Sports', 'General Function'],
    description: '20-item questionnaire measuring functional limits of the upper extremity.',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'uefi_sum',
        text: 'Clinician: Sum of all 20 items (each scored 0 = extreme difficulty, to 4 = no difficulty):',
        type: 'number',
        min: 0,
        max: 80,
        defaultValue: 80
      }
    ],
    calculateScore: (ans) => ({ score: ans.uefi_sum ?? 80, maxScore: 80 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 65) return 'High Upper Extremity Function';
      if (s >= 35) return 'Moderate Limitation';
      return 'Severe Functional Limitation';
    }
  },
  {
    id: 'FMS',
    name: 'Functional Movement Screen (FMS)',
    categories: ['Sports'],
    description: '7-movement pattern screen assessing coordination, mobility, and core stability.',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'fms_total',
        text: 'Clinician: Sum of FMS movement grades (each pattern scored 0 to 3):',
        type: 'select',
        options: createRadioOptions(21)
      }
    ],
    calculateScore: (ans) => ({ score: ans.fms_total ?? 21, maxScore: 21 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 15) return 'Optimal functional movement / Low injury profile';
      return 'Dysfunctional movement patterns / Elevated injury risk';
    }
  },
  {
    id: 'Tegner',
    name: 'Tegner Activity Scale',
    categories: ['Sports'],
    description: 'Grade score from 0 (sick leave) to 10 (elite competitive sports) to monitor activity level.',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'level',
        text: 'Select current physical activity level:',
        type: 'select',
        options: [
          { label: '10 - Competitive elite soccer, rugby, basketball', value: 10 },
          { label: '9 - Competitive recreational soccer, squash, tennis', value: 9 },
          { label: '8 - Competitive badminton, skiing, athletics', value: 8 },
          { label: '7 - Recreational sports (running, tennis) multiple times/week', value: 7 },
          { label: '5 - Heavy manual labor or moderate recreational sports', value: 5 },
          { label: '3 - Light manual labor, walking on uneven ground', value: 3 },
          { label: '1 - Work without heavy load, walking on even ground', value: 1 },
          { label: '0 - Sick leave or disability due to knee issues', value: 0 }
        ]
      }
    ],
    calculateScore: (ans) => ({ score: ans.level ?? 5, maxScore: 10 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 7) return 'Vigorous/Sports Activity Level';
      if (s >= 4) return 'Moderate Functional Activity';
      return 'Sedentary/Impaired Activity Level';
    }
  },
  {
    id: 'VISAA',
    name: 'VISA-A (Achilles Tendinopathy)',
    categories: ['Sports'],
    description: '8-item index evaluating Achilles tendon pain, stiffness, and sport performance.',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'visa_sum',
        text: 'Clinician: Sum of all 8 items (each rated 0 to 10 points, max 100):',
        type: 'number',
        min: 0,
        max: 100,
        defaultValue: 100
      }
    ],
    calculateScore: (ans) => ({ score: ans.visa_sum ?? 100, maxScore: 100, percent: ans.visa_sum ?? 100 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 80) return 'Minimal limitations / Normal sports profile';
      if (s >= 50) return 'Moderate Achilles tendinopathy symptoms';
      return 'Severe tendon dysfunction';
    }
  },
  {
    id: 'VISAP',
    name: 'VISA-P (Patellar Tendinopathy)',
    categories: ['Sports'],
    description: '8-item index evaluating pain, functional limits, and performance in patellar tendinopathy (Jumper\'s Knee).',
    scoreDirection: 'higher_better',
    questions: [
      {
        id: 'visa_sum',
        text: 'Clinician: Sum of all 8 items (max 100 points):',
        type: 'number',
        min: 0,
        max: 100,
        defaultValue: 100
      }
    ],
    calculateScore: (ans) => ({ score: ans.visa_sum ?? 100, maxScore: 100, percent: ans.visa_sum ?? 100 }),
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 80) return 'Minimal patellar symptoms';
      if (s >= 50) return 'Moderate Jumper\'s Knee severity';
      return 'Severe functional knee limits';
    }
  },
  {
    id: 'YBalance',
    name: 'Y-Balance Test (YBT)',
    categories: ['Sports', 'Balance'],
    description: 'Dynamic balance test measuring anterior, posteromedial, and posterolateral reach distances.',
    scoreDirection: 'higher_better',
    questions: [
      { id: 'ant', text: 'Anterior reach distance (cm):', type: 'number', placeholder: 'e.g. 72' },
      { id: 'pm', text: 'Posteromedial reach distance (cm):', type: 'number', placeholder: 'e.g. 88' },
      { id: 'pl', text: 'Posterolateral reach distance (cm):', type: 'number', placeholder: 'e.g. 85' },
      { id: 'limb_len', text: 'Limb length (cm):', type: 'number', placeholder: 'e.g. 90' }
    ],
    calculateScore: (ans) => {
      const ant = Number(ans.ant ?? 0);
      const pm = Number(ans.pm ?? 0);
      const pl = Number(ans.pl ?? 0);
      const limb = Number(ans.limb_len ?? 90);
      // Composite score: ((Ant + PM + PL) / (3 * Limb Length)) * 100
      const score = limb > 0 ? Math.round(((ant + pm + pl) / (3 * limb)) * 100) : 0;
      return { score, maxScore: 100, percent: score };
    },
    getInterpretation: (score) => {
      const s = Number(score);
      if (s >= 95) return 'Good dynamic motor control';
      return 'Reduced neuromuscular balance / High injury risk';
    }
  }
];

export const CATEGORIES = [
  'All', 'Pain', 'Spine', 'Shoulder', 'Knee', 'Hip',
  'Ankle/Foot', 'Neurological', 'Geriatric', 'Cardiopulmonary', 'Pediatric', 'Sports', 'General Function'
];
