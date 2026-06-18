import { SCORE_WEIGHTS, TEST_DEFINITIONS } from "./constants";
import { clamp, round } from "./utils";

function getTestMeta(id) {
  return TEST_DEFINITIONS.find((test) => test.id === id);
}

function scoreReactionTime(raw) {
  const avgReactionMs = raw.avgReactionMs || 1000;
  const falseStartPenalty = raw.falseStarts * 4;
  const scaled = ((700 - avgReactionMs) / (700 - 220)) * 100;
  const score = clamp(scaled - falseStartPenalty, 0, 100);

  return {
    score: round(score),
    summary: `${round(avgReactionMs)} ms average`,
  };
}

function scoreDigitSpan(raw) {
  const score = clamp((raw.weightedCorrect / raw.maxWeighted) * 100, 0, 100);

  return {
    score: round(score),
    summary: `${raw.correctRounds}/${raw.rounds.length} rounds correct`,
  };
}

function scoreStroop(raw) {
  const correctPerMinute = (raw.correct / raw.durationSec) * 60;
  const throughput = clamp((correctPerMinute / 32) * 70, 0, 70);
  const accuracyScore = clamp(raw.accuracy * 30, 0, 30);
  const score = throughput + accuracyScore;

  return {
    score: round(score),
    summary: `${raw.correct} correct at ${round(raw.accuracy * 100)}% accuracy`,
  };
}

function scoreSymbolCoding(raw) {
  const correctPerMinute = (raw.correct / raw.durationSec) * 60;
  const throughput = clamp((correctPerMinute / 28) * 70, 0, 70);
  const accuracyScore = clamp(raw.accuracy * 30, 0, 30);
  const score = throughput + accuracyScore;

  return {
    score: round(score),
    summary: `${raw.correct} matched at ${round(raw.accuracy * 100)}% accuracy`,
  };
}

const SCORE_BY_TEST = {
  reactionTime: scoreReactionTime,
  digitSpan: scoreDigitSpan,
  stroop: scoreStroop,
  symbolCoding: scoreSymbolCoding,
};

export function scoreSubtest(testId, raw) {
  const meta = getTestMeta(testId);
  const { score, summary } = SCORE_BY_TEST[testId](raw);

  return {
    id: testId,
    title: meta.title,
    shortLabel: meta.shortLabel,
    dimension: meta.dimension,
    score,
    summary,
    raw,
  };
}

export function computeCompositeScore(subtests) {
  return round(
    Object.entries(SCORE_WEIGHTS).reduce((total, [testId, weight]) => {
      const subtest = subtests[testId];
      return total + (subtest?.score || 0) * weight;
    }, 0),
  );
}

export function formatRawMetric(subtest) {
  if (!subtest) {
    return "";
  }

  const { id, raw } = subtest;

  if (id === "reactionTime") {
    return `${round(raw.avgReactionMs)} ms avg · ${raw.falseStarts} false start${raw.falseStarts === 1 ? "" : "s"}`;
  }

  if (id === "digitSpan") {
    return `${raw.correctRounds}/${raw.rounds.length} rounds · longest span ${raw.longestCorrectSpan}`;
  }

  if (id === "stroop") {
    return `${raw.correct} correct · ${round(raw.accuracy * 100)}% accuracy`;
  }

  if (id === "symbolCoding") {
    return `${raw.correct} matched · ${round(raw.accuracy * 100)}% accuracy`;
  }

  return subtest.summary;
}
