export interface TreatmentMethod {
  title: string;
  description: string;
  oneLineDescription: string;
  category: 'exercise' | 'electro' | 'manual' | 'care';
  categoryLabel: string;
}

export const treatmentCategories = [
  { id: 'all', label: 'All Methods' },
  { id: 'exercise', label: 'Exercise & Sports' },
  { id: 'electro', label: 'Electro & Heat' },
  { id: 'manual', label: 'Hands-on & Specialized' },
  { id: 'care', label: 'Modern Care & Home' }
];

export const treatmentMethods: TreatmentMethod[] = [
  {
    title: "Exercise Therapy",
    description: "Exercise therapy forms the foundation of recovery at Health 360. Through a personalised programme of targeted strengthening, stretching, and mobility exercises, our therapists help restore function, correct movement patterns, and build the strength needed to prevent future injury. Whether you're recovering from surgery, managing a chronic condition, or simply working to move better, exercise therapy is tailored to your body's specific needs and progressed step by step as you improve.",
    oneLineDescription: "Personalised strengthening and mobility exercises that restore function and prevent re-injury.",
    category: "exercise",
    categoryLabel: "Exercise & Sports"
  },
  {
    title: "Ultrasound Therapy",
    description: "Ultrasound therapy uses high-frequency sound waves to generate deep heat within muscles, tendons, and ligaments. This gentle, non-invasive treatment improves blood circulation, reduces inflammation, and accelerates tissue healing at a cellular level. It's especially effective for tendonitis, muscle strains, and soft tissue injuries, helping to ease pain and speed up recovery without any downtime.",
    oneLineDescription: "Deep heat from sound waves that eases inflammation and speeds soft tissue healing.",
    category: "electro",
    categoryLabel: "Electro & Heat"
  },
  {
    title: "Transcutaneous Electrical Nerve Stimulation (TENS)",
    description: "TENS therapy delivers mild electrical impulses through the skin to interrupt pain signals travelling to the brain, offering fast and effective pain relief. It also stimulates the release of the body's natural endorphins. Commonly used for chronic pain, arthritis, and post-surgical discomfort, TENS is a safe, drug-free way to manage pain as part of a broader treatment plan.",
    oneLineDescription: "Mild electrical impulses that interrupt pain signals for fast, drug-free relief.",
    category: "electro",
    categoryLabel: "Electro & Heat"
  },
  {
    title: "Interferential Therapy (IFT)",
    description: "Interferential Therapy uses two medium-frequency electrical currents that intersect within the tissue to produce a therapeutic effect deeper than TENS alone can reach. This makes IFT particularly effective for relieving deep-seated pain, reducing swelling, and easing muscle spasm in conditions like back pain, joint pain, and sports injuries, all while remaining comfortable for the patient.",
    oneLineDescription: "Intersecting currents that reach deeper than TENS to ease pain, swelling and spasm.",
    category: "electro",
    categoryLabel: "Electro & Heat"
  },
  {
    title: "Electrical Muscle Stimulator (EMS)",
    description: "EMS therapy uses electrical impulses to trigger muscle contractions, helping to strengthen weakened muscles, prevent muscle wasting, and re-educate muscles after injury or surgery. It's particularly valuable for patients with reduced mobility or muscle inhibition, supporting faster recovery of strength and function alongside active exercise.",
    oneLineDescription: "Triggered muscle contractions that rebuild strength after injury, surgery, or immobility.",
    category: "electro",
    categoryLabel: "Electro & Heat"
  },
  {
    title: "Cupping Therapy",
    description: "Cupping therapy uses suction cups placed on the skin to lift and decompress underlying tissue, improving blood flow, releasing muscle tension, and breaking down adhesions. This traditional technique is widely used to relieve chronic muscle tightness, back and neck pain, and to support faster recovery in athletes by enhancing circulation to the treated area.",
    oneLineDescription: "Suction-based decompression that releases tension and improves circulation to tight tissue.",
    category: "manual",
    categoryLabel: "Hands-on & Specialized"
  },
  {
    title: "Kinesio Taping Therapy",
    description: "Kinesio taping involves applying a flexible, elastic tape to the skin to support muscles and joints without restricting movement. It helps reduce pain and swelling, improves circulation, and provides proprioceptive feedback that enhances muscle activation and joint stability. It's commonly used for sports injuries, postural correction, and as an adjunct to ongoing rehabilitation.",
    oneLineDescription: "Elastic tape support that stabilises joints and reduces swelling without limiting movement.",
    category: "manual",
    categoryLabel: "Hands-on & Specialized"
  },
  {
    title: "IASTM",
    description: "IASTM uses specially designed instruments to detect and treat areas of soft tissue restriction, scar tissue, and fascial adhesions. By applying controlled pressure along the affected muscles and tendons, this technique breaks down tissue restrictions, improves range of motion, and accelerates healing, making it especially useful for chronic tendon and muscle conditions.",
    oneLineDescription: "Instrument-assisted tissue mobilisation that breaks down adhesions and restores range of motion.",
    category: "manual",
    categoryLabel: "Hands-on & Specialized"
  },
  {
    title: "Dry Needling Technique",
    description: "Dry needling involves inserting thin, sterile needles into trigger points within tight or overactive muscles to release tension, reduce pain, and restore normal muscle function. This technique targets the source of muscular pain directly, offering relief for conditions such as myofascial pain syndrome, chronic muscle tightness, and sports-related injuries.",
    oneLineDescription: "Targeted needle therapy that releases muscle trigger points at the source of pain.",
    category: "manual",
    categoryLabel: "Hands-on & Specialized"
  },
  {
    title: "Biodynamic Craniosacral Therapy",
    description: "Biodynamic Craniosacral Therapy is a gentle, non-invasive hands-on treatment that helps release deep-seated physical and emotional tension. By sensing and supporting the body's natural healing rhythms, this therapy works directly with the nervous system to relieve chronic pain, ease stress, resolve trauma, and restore complete structural and energetic balance.",
    oneLineDescription: "A gentle, hands-on nervous system therapy that releases deep physical and emotional tension.",
    category: "manual",
    categoryLabel: "Hands-on & Specialized"
  },
  {
    title: "Treadmill Rehabilitation",
    description: "Treadmill-based rehabilitation is used to retrain walking patterns, build cardiovascular endurance, and safely progress patients back to normal gait and activity levels. Under the guidance of our therapists, treadmill sessions are adjusted for speed, incline, and support, making them suitable for post-injury recovery, neurological rehabilitation, and general fitness conditioning.",
    oneLineDescription: "Guided gait and endurance retraining on a controlled, therapist-supervised treadmill.",
    category: "exercise",
    categoryLabel: "Exercise & Sports"
  },
  {
    title: "Manual Therapy",
    description: "Manual therapy involves hands-on techniques such as joint mobilisation, soft tissue massage, and manipulation performed directly by our therapists to relieve pain, restore joint mobility, and improve tissue flexibility. It is highly effective for stiff joints, muscle tightness, and postural issues, and is often combined with exercise therapy for lasting results.",
    oneLineDescription: "Hands-on joint mobilisation and soft tissue work to relieve pain and stiffness.",
    category: "manual",
    categoryLabel: "Hands-on & Specialized"
  },
  {
    title: "Pelvic Floor Rehabilitation",
    description: "Pelvic floor rehabilitation addresses weakness or dysfunction of the pelvic floor muscles, which can result from childbirth, surgery, or ageing. Through targeted exercises and specialised techniques, this therapy helps manage issues such as incontinence, pelvic pain, and postpartum recovery, restoring strength, control, and confidence in daily life.",
    oneLineDescription: "Targeted care for pelvic floor weakness following childbirth, surgery, or ageing.",
    category: "manual",
    categoryLabel: "Hands-on & Specialized"
  },
  {
    title: "Vestibular Rehabilitation",
    description: "Vestibular rehabilitation is a specialised form of therapy designed to treat dizziness, balance disorders, and vertigo caused by inner ear or neurological issues. Through specific head, eye, and body exercises, this therapy retrains the brain to compensate for balance deficits, helping patients regain stability and confidently return to everyday activities.",
    oneLineDescription: "Balance retraining that treats dizziness and vertigo from inner ear or neurological issues.",
    category: "manual",
    categoryLabel: "Hands-on & Specialized"
  },
  {
    title: "Tele-Physiotherapy",
    description: "Tele-physiotherapy brings expert care directly to you through secure video consultations, making quality treatment accessible no matter where you are. Ideal for follow-up sessions, exercise guidance, and progress reviews, this convenient option allows patients to stay consistent with their rehabilitation without the need to travel to the clinic.",
    oneLineDescription: "Secure video consultations for follow-ups and guidance, wherever you are.",
    category: "care",
    categoryLabel: "Modern Care & Home"
  },
  {
    title: "Return-to-Sport Therapy",
    description: "Return-to-sport therapy is a structured, sport-specific programme designed to safely guide athletes back to peak performance after an injury. Combining strength training, agility drills, and sport-specific movement patterns, this therapy ensures athletes regain full function and confidence while minimising the risk of re-injury before stepping back onto the field.",
    oneLineDescription: "Sport-specific conditioning that safely rebuilds athletes back to peak performance.",
    category: "exercise",
    categoryLabel: "Exercise & Sports"
  },
  {
    title: "Home Physiotherapy",
    description: "Home physiotherapy brings our expert therapists directly to your doorstep, offering the same quality of personalised care in the comfort of your own home. This service is ideal for patients with limited mobility, post-surgical recovery, or those who simply prefer the convenience and comfort of at-home treatment sessions.",
    oneLineDescription: "Expert therapy delivered to your doorstep for patients who need care at home.",
    category: "care",
    categoryLabel: "Modern Care & Home"
  },
  {
    title: "Elderly Care Physiotherapy",
    description: "Elderly care physiotherapy focuses on the unique needs of ageing patients, addressing issues such as reduced mobility, balance concerns, joint pain, and muscle weakness. Through gentle, targeted exercises and fall-prevention strategies, this therapy helps seniors maintain independence, improve quality of life, and stay active and confident in their daily routines.",
    oneLineDescription: "Gentle, fall-prevention-focused therapy that helps seniors stay mobile and independent.",
    category: "care",
    categoryLabel: "Modern Care & Home"
  }
];
