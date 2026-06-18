import { BATTERY_VERSION } from "./constants";
import { computeCompositeScore, scoreSubtest } from "./scoring";

const DEMO_PATTERN = [
  { timeOfDay: "Morning", base: 79 },
  { timeOfDay: "Midday", base: 84 },
  { timeOfDay: "Evening", base: 73 },
  { timeOfDay: "Night", base: 65 },
  { timeOfDay: "Morning", base: 76 },
  { timeOfDay: "Midday", base: 86 },
  { timeOfDay: "Evening", base: 71 },
  { timeOfDay: "Night", base: 62 },
  { timeOfDay: "Morning", base: 81 },
  { timeOfDay: "Midday", base: 88 },
  { timeOfDay: "Evening", base: 75 },
  { timeOfDay: "Night", base: 67 },
];

function buildReactionRaw(scoreTarget, variation) {
  const avgReactionMs = 700 - scoreTarget * 4.7 + variation * 6;
  return {
    trials: [],
    avgReactionMs,
    medianReactionMs: avgReactionMs - 12,
    falseStarts: Math.max(0, Math.round((72 - scoreTarget) / 12)),
    validTrials: 12,
  };
}

function buildDigitSpanRaw(scoreTarget, variation) {
  const maxWeighted = 30;
  const weightedCorrect = Math.max(
    10,
    Math.min(maxWeighted, Math.round((scoreTarget / 100) * maxWeighted + variation)),
  );
  const correctRounds = Math.max(2, Math.min(6, Math.round(weightedCorrect / 5)));

  return {
    rounds: Array.from({ length: 6 }, (_, index) => ({
      index,
      isCorrect: index < correctRounds,
    })),
    correctRounds,
    weightedCorrect,
    maxWeighted,
    longestCorrectSpan: Math.max(4, Math.min(7, Math.round(4 + scoreTarget / 28))),
  };
}

function buildTimedRaw(scoreTarget, variation, durationSec, rateScale) {
  const correctPerMinute = Math.max(10, rateScale * (scoreTarget / 100) + variation);
  const correct = Math.round((correctPerMinute * durationSec) / 60);
  const attempted = Math.round(correct / Math.max(0.72, Math.min(0.97, 0.79 + scoreTarget / 500)));
  const accuracy = correct / Math.max(correct, attempted);

  return {
    responses: [],
    correct,
    incorrect: attempted - correct,
    attempted,
    accuracy,
    meanReactionMs: 1100 - scoreTarget * 5 + variation * 12,
    durationSec,
  };
}

export function createDemoSessions() {
  const now = Date.now();

  return DEMO_PATTERN.map((entry, index) => {
    const variation = ((index % 3) - 1) * 2;
    const reactionTime = scoreSubtest(
      "reactionTime",
      buildReactionRaw(entry.base + 3, variation),
    );
    const digitSpan = scoreSubtest("digitSpan", buildDigitSpanRaw(entry.base, variation));
    const stroop = scoreSubtest(
      "stroop",
      buildTimedRaw(entry.base + 1, variation, 60, 34),
    );
    const symbolCoding = scoreSubtest(
      "symbolCoding",
      buildTimedRaw(entry.base - 1, variation, 60, 30),
    );

    const subtests = {
      reactionTime,
      digitSpan,
      stroop,
      symbolCoding,
    };

    const completedAt = new Date(now - (DEMO_PATTERN.length - index) * 18 * 60 * 60 * 1000).toISOString();

    return {
      id: `demo-session-${index + 1}`,
      batteryVersion: BATTERY_VERSION,
      timeOfDay: entry.timeOfDay,
      startedAt: new Date(new Date(completedAt).getTime() - 5 * 60 * 1000).toISOString(),
      completedAt,
      durationSec: 5 * 60 + (index % 4) * 10,
      subtests,
      compositeScore: computeCompositeScore(subtests),
      source: "demo",
    };
  });
}
