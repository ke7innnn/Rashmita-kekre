export interface BodyCondition {
  id: string;
  name: string;
  description: string;
  xPercent: number;
  yPercent: number;
  region: string;
}

export const SILHOUETTE_IMAGE_PATH = "/body-silhouette.png";

export const bodyConditions: BodyCondition[] = [
  // Head/face
  {
    id: "headache",
    name: "Headache",
    description: "Cervicogenic headaches arising from stiffness or joint dysfunction in the upper neck region.",
    xPercent: 50,
    yPercent: 8,
    region: "Head/face"
  },
  {
    id: "clunking-jaw",
    name: "Clunking jaw",
    description: "Temporomandibular joint (TMJ) disorders causing painful jaw movements, locking, or clicking.",
    xPercent: 50,
    yPercent: 12,
    region: "Head/face"
  },
  // Neck
  {
    id: "neck-pain",
    name: "Neck pain",
    description: "Stiffness, muscle spasms, or facet joint irritation resulting from poor posture or strain.",
    xPercent: 48,
    yPercent: 17,
    region: "Neck"
  },
  {
    id: "whiplash",
    name: "Whiplash",
    description: "Acceleration-deceleration neck injury causing ligament strain, muscle tears, and restricted movement.",
    xPercent: 52,
    yPercent: 18,
    region: "Neck"
  },
  // Shoulders
  {
    id: "shoulder-pain",
    name: "Shoulder pain",
    description: "Generalized shoulder discomfort often linked to bursitis, impingement, or joint instability.",
    xPercent: 41,
    yPercent: 22,
    region: "Shoulders"
  },
  {
    id: "rotator-cuff",
    name: "Frozen shoulder / Rotator cuff",
    description: "Severe stiffness (capsulitis) or tears in the rotator cuff tendons restricting arm elevation.",
    xPercent: 59,
    yPercent: 22,
    region: "Shoulders"
  },
  {
    id: "catching-pain",
    name: "Catching pain",
    description: "Sharp, sudden pain during specific arm movements, usually indicating tendon impingement.",
    xPercent: 43,
    yPercent: 25,
    region: "Shoulders"
  },
  // Upper body
  {
    id: "thoracic-pain",
    name: "Chest / thoracic pain",
    description: "Mid-back soreness or ribcage pain often caused by poor alignment or joint restriction.",
    xPercent: 50,
    yPercent: 32,
    region: "Upper body"
  },
  {
    id: "disc-problems",
    name: "Disc problems / Thoracic spine",
    description: "Compression or herniation in the upper spine causing localized pain and radiating stiffness.",
    xPercent: 48,
    yPercent: 38,
    region: "Upper body"
  },
  // Arms/elbows
  {
    id: "tennis-elbow",
    name: "Tennis elbow",
    description: "Lateral epicondylitis causing pain on the outer side of the elbow from repetitive wrist extension.",
    xPercent: 34,
    yPercent: 38,
    region: "Arms/elbows"
  },
  {
    id: "golfers-elbow",
    name: "Golfer's elbow",
    description: "Medial epicondylitis causing soreness on the inner elbow from repetitive wrist flexion.",
    xPercent: 66,
    yPercent: 38,
    region: "Arms/elbows"
  },
  // Lower back
  {
    id: "lumbago",
    name: "Lumbago",
    description: "Acute or chronic lower back pain linked to muscle strain, ligament sprains, or disc stress.",
    xPercent: 50,
    yPercent: 44,
    region: "Lower back"
  },
  {
    id: "rsi",
    name: "Repetitive strain injury (RSI)",
    description: "Overuse injuries in forearm muscles and tendons due to repetitive tasks like typing.",
    xPercent: 31,
    yPercent: 52,
    region: "Lower back"
  },
  // Wrists/hands
  {
    id: "carpal-tunnel",
    name: "Carpal tunnel",
    description: "Median nerve compression in the wrist leading to numbness, tingling, and hand weakness.",
    xPercent: 32,
    yPercent: 53,
    region: "Wrists/hands"
  },
  {
    id: "wrist-pain",
    name: "Wrist pain",
    description: "Joint irritation, sprains, or tendonitis restricting grip strength and wrist rotation.",
    xPercent: 68,
    yPercent: 53,
    region: "Wrists/hands"
  },
  // Hips/groin
  {
    id: "groin-strain",
    name: "Groin strain",
    description: "Stretching or tearing of the adductor muscles on the inner thigh, common in sports.",
    xPercent: 50,
    yPercent: 53,
    region: "Hips/groin"
  },
  {
    id: "hip-pain",
    name: "Hip pain",
    description: "Soreness around the hip joint, typically caused by bursitis, labral tears, or strain.",
    xPercent: 43,
    yPercent: 50,
    region: "Hips/groin"
  },
  // Joints
  {
    id: "osteoarthritis",
    name: "Osteoarthritis",
    description: "Degenerative wear of joint cartilage, causing pain, inflammation, and stiffness in weight-bearing joints.",
    xPercent: 57,
    yPercent: 50,
    region: "Joints"
  },
  {
    id: "sciatic-pain",
    name: "Sciatic pain",
    description: "Radiating pain, numbness, or tingling traveling from the lower back down the sciatic nerve path.",
    xPercent: 48,
    yPercent: 56,
    region: "Joints"
  },
  // Legs (upper)
  {
    id: "hamstring-tears",
    name: "Hamstring tears",
    description: "Acute strain or tearing of the muscles at the back of the thigh, restricting leg extension.",
    xPercent: 44,
    yPercent: 64,
    region: "Legs (upper)"
  },
  {
    id: "muscle-strain",
    name: "Muscle strain",
    description: "Quadriceps or adductor strain causing local pain and functional limitations during activity.",
    xPercent: 56,
    yPercent: 60,
    region: "Legs (upper)"
  },
  {
    id: "wear-and-tear",
    name: "Wear and tear / joint pain",
    description: "Accumulated stress on the upper leg joints leading to mild structural wear and deep aches.",
    xPercent: 45,
    yPercent: 70,
    region: "Legs (upper)"
  },
  {
    id: "ligament-injuries",
    name: "Ligament injuries",
    description: "Overstretched or torn thigh and knee ligaments limiting joint stabilization and stride control.",
    xPercent: 55,
    yPercent: 71,
    region: "Legs (upper)"
  },
  // Knees
  {
    id: "aching-knees",
    name: "Aching knees",
    description: "Patellofemoral pain or tendonitis causing a dull, constant ache behind or around the kneecap.",
    xPercent: 44,
    yPercent: 76,
    region: "Knees"
  },
  {
    id: "locking-knee",
    name: "Locking knee",
    description: "Meniscus tears or loose cartilage blocking joint extension and causing catching or locking.",
    xPercent: 56,
    yPercent: 76,
    region: "Knees"
  },
  // Legs (lower)
  {
    id: "sports-injuries",
    name: "Sports injuries",
    description: "Lower leg strains, minor fractures, or tissue damage sustained during athletic training.",
    xPercent: 43,
    yPercent: 83,
    region: "Legs (lower)"
  },
  {
    id: "calf-tears",
    name: "Calf tears",
    description: "Tearing of gastrocnemius or soleus fibers, causing sudden sharp pain and inability to push off.",
    xPercent: 57,
    yPercent: 85,
    region: "Legs (lower)"
  },
  {
    id: "achilles-tendonitis",
    name: "Achilles tendonitis",
    description: "Inflammation of the Achilles tendon at the back of the ankle, causing pain during heel raises.",
    xPercent: 55,
    yPercent: 91,
    region: "Legs (lower)"
  },
  {
    id: "shin-splints",
    name: "Shin splints",
    description: "Medial tibial stress syndrome causing pain along the inner edge of the shin bone from impact.",
    xPercent: 45,
    yPercent: 88,
    region: "Legs (lower)"
  }
];
