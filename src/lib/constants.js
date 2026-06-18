export const APP_TITLE = "Mental Sharpness Test";
export const APP_SUBTITLE =
  "A repeatable 5-minute cognitive battery for tracking when you feel mentally sharpest.";

export const STORAGE_KEY = "mental-sharpness-test/sessions-v1";
export const BATTERY_VERSION = 2;

export const TIME_OF_DAY_OPTIONS = [
  {
    id: "Morning",
    label: "Morning",
    windowLabel: "Early focus window",
    description: "Use this for sessions soon after waking or early in your workday.",
  },
  {
    id: "Midday",
    label: "Midday",
    windowLabel: "Midday baseline",
    description: "Use this around lunch or the middle of your main working hours.",
  },
  {
    id: "Evening",
    label: "Evening",
    windowLabel: "Late-day performance",
    description: "Use this after work or in the early evening before winding down.",
  },
  {
    id: "Night",
    label: "Night",
    windowLabel: "Late-night check",
    description: "Use this for sessions taken late at night or close to bedtime.",
  },
];

export const TEST_DEFINITIONS = [
  {
    id: "reactionTime",
    shortLabel: "Reaction",
    title: "Simple Reaction Time",
    dimension: "Reaction speed",
    durationLabel: "~45 seconds",
    instructions: [
      "Wait for the panel to turn green, then click or tap as quickly as possible.",
      "If you click too early, it counts as a false start.",
      "Eight trials are used to keep the task quick while still smoothing out one-off lapses or lucky clicks.",
    ],
  },
  {
    id: "digitSpan",
    shortLabel: "Memory",
    title: "Reverse Digit Span",
    dimension: "Working memory",
    durationLabel: "~2 minutes",
    instructions: [
      "Memorize the digits in the order shown.",
      "When prompted, type them back in reverse order.",
      "Sequence lengths increase gradually across a shorter set of rounds to preserve repeatability without stretching the session too long.",
    ],
  },
  {
    id: "stroop",
    shortLabel: "Stroop",
    title: "Stroop Focus",
    dimension: "Attention and processing speed",
    durationLabel: "~1 minute",
    instructions: [
      "Choose the font color, not the written word.",
      "The task mixes matching and conflicting items to reduce autopilot responding.",
      "You are scored on both speed and accuracy.",
    ],
  },
  {
    id: "symbolCoding",
    shortLabel: "Coding",
    title: "Symbol Coding",
    dimension: "Visual processing and cognitive flexibility",
    durationLabel: "~1 minute",
    instructions: [
      "Use the on-screen key to match each symbol to the correct number.",
      "The mapping changes every session so the task stays fresh but comparable.",
      "Fast, accurate responses matter more than trying to rush every item.",
    ],
  },
];

export const SUBTEST_ORDER = TEST_DEFINITIONS.map((test) => test.id);

export const SCORE_WEIGHTS = {
  reactionTime: 0.25,
  digitSpan: 0.3,
  stroop: 0.25,
  symbolCoding: 0.2,
};

export const STROOP_COLORS = [
  { id: "red", label: "Red", hex: "#ef4444" },
  { id: "blue", label: "Blue", hex: "#2563eb" },
  { id: "green", label: "Green", hex: "#16a34a" },
  { id: "yellow", label: "Yellow", hex: "#ca8a04" },
];

export const SYMBOL_SET = ["@", "#", "$", "%", "&", "?"];
