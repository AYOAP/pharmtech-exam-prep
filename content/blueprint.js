export const EXAM_FACTS = {
  examName: "Pharmacy Technician Certification Exam (PTCE)",
  examQuestions: 90,
  scoredQuestions: 80,
  unscoredQuestions: 10,
  testingMinutes: 110,
  examMinutesTotal: 120,
  sourceNotes: [
    "PTCB CPhT page updated for the current PTCE format.",
    "PTCE content outline effective January 2026.",
  ],
};

export const DOMAIN_ORDER = [
  "medications",
  "federalRequirements",
  "patientSafety",
  "orderEntry",
];

export const PTCB_DOMAINS = {
  medications: {
    id: "medications",
    name: "Medications",
    shortName: "Meds",
    weight: 35,
    color: "from-rosebrand-500 to-rosebrand-700",
    accent: "text-rosebrand-700",
    description:
      "Brand and generic names, indications, side effects, dosage forms, storage, stability, and common interactions.",
    objectives: [
      "Brand, generic, and classification recall",
      "Indications and therapeutic use",
      "High-yield side effects, allergies, and contraindications",
      "Routes, strengths, dosage forms, and storage",
      "Drug stability and special handling",
    ],
  },
  federalRequirements: {
    id: "federalRequirements",
    name: "Federal Requirements",
    shortName: "Law",
    weight: 18.75,
    color: "from-fuchsia-500 to-orange-400",
    accent: "text-fuchsia-700",
    description:
      "Controlled substance rules, hazardous waste handling, REMS, DSCSA, recalls, and federal documentation requirements.",
    objectives: [
      "DEA schedules, refill, transfer, and record rules",
      "Hazardous and pharmacological waste handling",
      "Pseudoephedrine and other restricted programs",
      "Medication recalls and quarantine steps",
      "DSCSA serialization and tracing expectations",
    ],
  },
  patientSafety: {
    id: "patientSafety",
    name: "Patient Safety",
    shortName: "Safety",
    weight: 23.75,
    color: "from-orange-400 to-amber-300",
    accent: "text-orange-700",
    description:
      "Error prevention, pharmacist intervention, infection control, reporting systems, and quality assurance habits.",
    objectives: [
      "High-alert and LASA medication safeguards",
      "Unsafe abbreviations, zero rules, barcode checks",
      "When to pause and involve the pharmacist",
      "MedWatch, VAERS, CQI, and root-cause analysis",
      "Cleaning, PPE, and infection prevention routines",
    ],
  },
  orderEntry: {
    id: "orderEntry",
    name: "Order Entry & Processing",
    shortName: "Processing",
    weight: 22.5,
    color: "from-pink-300 to-rosebrand-400",
    accent: "text-pink-700",
    description:
      "Calculations, sig codes, days supply, NDCs, lot numbers, supplies, and return-to-stock or reverse distribution workflows.",
    objectives: [
      "Conversions, ratios, proportions, and days-supply math",
      "Sig codes, abbreviations, and terminology",
      "Choosing the right administration supplies",
      "NDC, lot number, and expiration checks",
      "Return-to-stock, expired product, and reverse distribution steps",
    ],
  },
};

export const STUDY_STRATEGY = [
  {
    title: "Start with the diagnostic",
    detail:
      "Use the full 90-question baseline once. It tells the app where your biggest gaps are so daily tasks stop feeling random.",
  },
  {
    title: "Study a little every day",
    detail:
      "Aim for 35 to 50 focused minutes. Short daily reps beat marathon cram sessions, especially for drug recall and sig-code fluency.",
  },
  {
    title: "Use active recall first",
    detail:
      "Answer questions and flashcards before reading the explanation. Struggle is productive because it strengthens memory.",
  },
  {
    title: "Review misses within 24 hours",
    detail:
      "The weakness engine re-serves missed concepts quickly so weak spots do not calcify into repeat mistakes.",
  },
  {
    title: "Take a full mock every 2 to 3 weeks",
    detail:
      "Timed mocks build pacing and reveal whether your readiness is improving across all four domains together.",
  },
];

export const ONBOARDING_STEPS = [
  {
    title: "Meet your study map",
    body:
      "Your dashboard is built around four PTCE domains. Each tile shows mastery, level, and how much of the actual exam weight it carries.",
  },
  {
    title: "Follow the daily route",
    body:
      "Each day has a balanced set of tasks: one lesson block, one quiz set, one flashcard run, and one weakness review. Finishing them grows your streak and XP.",
  },
  {
    title: "Let mistakes teach you",
    body:
      "Every missed question is tagged by topic. The app turns those misses into targeted follow-up quizzes, review cards, and plan adjustments.",
  },
  {
    title: "Use mock exams strategically",
    body:
      "After the diagnostic, switch into weekly practice. Full mocks simulate the 90-question, 110-minute PTCE structure and update readiness projections.",
  },
  {
    title: "Ask the tutor when stuck",
    body:
      "The AI tutor can explain a question, simplify a law or calc concept, or create a quick memory hook. It is optional and only works when an OpenAI API key is configured.",
  },
];

export const LEARNING_PATH = [
  {
    id: "med-core",
    domain: "medications",
    title: "Drug Name Foundations",
    focus: "Top classes, brand-generic anchors, suffix patterns, and common indications.",
  },
  {
    id: "med-safety",
    domain: "medications",
    title: "Side Effects & Contraindications",
    focus: "High-risk effects, common counseling alerts, allergies, and interaction red flags.",
  },
  {
    id: "law-controlled",
    domain: "federalRequirements",
    title: "Controlled Substance Rules",
    focus: "Schedules, refill limits, transfer basics, ordering, theft/loss, and destruction.",
  },
  {
    id: "law-restricted",
    domain: "federalRequirements",
    title: "Restricted Drug Programs",
    focus: "Pseudoephedrine, REMS, DSCSA tracing, quarantines, and recalls.",
  },
  {
    id: "safety-errors",
    domain: "patientSafety",
    title: "Preventing Errors",
    focus: "LASA meds, tall-man lettering, zero rules, pharmacist escalation, and safe workflow habits.",
  },
  {
    id: "safety-reporting",
    domain: "patientSafety",
    title: "Quality Assurance & Reporting",
    focus: "MedWatch, VAERS, CQI, near misses, root-cause analysis, and infection control.",
  },
  {
    id: "processing-sig",
    domain: "orderEntry",
    title: "Sig Codes & Terminology",
    focus: "Common abbreviations, Roman numerals, routes, frequency codes, and medical shorthand.",
  },
  {
    id: "processing-math",
    domain: "orderEntry",
    title: "Days Supply & Calculations",
    focus: "Conversions, alligation-style thinking, dosage calculations, and equipment selection.",
  },
];

export const HIGH_YIELD_TOPICS = [
  "Brand vs generic recall",
  "Controlled substance schedules",
  "High-alert medications",
  "Tall Man lettering",
  "DEA refill and transfer limits",
  "Pseudoephedrine sales limits",
  "DSCSA quarantine workflow",
  "Days supply calculations",
  "Insulin storage and stability",
  "Look-alike / sound-alike prevention",
  "MedWatch vs VAERS",
  "NDC, lot, and expiration checks",
  "Hazardous waste handling",
  "Common sig codes and abbreviations",
];
