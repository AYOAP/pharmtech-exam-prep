import { TIME_OF_DAY_OPTIONS } from "./constants";
import { average, round } from "./utils";

export function getAverageScore(sessions) {
  return round(average(sessions.map((session) => session.compositeScore)));
}

export function getAverageByTimeOfDay(sessions) {
  return TIME_OF_DAY_OPTIONS.map((option) => {
    const matching = sessions.filter((session) => session.timeOfDay === option.id);

    return {
      timeOfDay: option.id,
      averageScore: round(average(matching.map((session) => session.compositeScore))),
      count: matching.length,
    };
  });
}

export function getBestWorstTimeOfDay(sessions) {
  const categories = getAverageByTimeOfDay(sessions).filter((item) => item.count > 0);

  if (!categories.length) {
    return { best: null, worst: null };
  }

  const best = [...categories].sort((left, right) => right.averageScore - left.averageScore)[0];
  const worst = [...categories].sort((left, right) => left.averageScore - right.averageScore)[0];

  return { best, worst };
}

export function getBestSession(sessions) {
  return [...sessions].sort((left, right) => right.compositeScore - left.compositeScore)[0] || null;
}

export function getRecentTrend(sessions) {
  if (!sessions.length) {
    return {
      label: "No trend yet",
      detail: "Complete a few sessions to see momentum over time.",
      delta: 0,
    };
  }

  const recent = sessions.slice(0, 3).map((session) => session.compositeScore);
  const previous = sessions.slice(3, 6).map((session) => session.compositeScore);
  const recentAverage = average(recent);
  const previousAverage = average(previous);

  if (!previous.length) {
    return {
      label: "Baseline building",
      detail: "A few more sessions will make trend comparisons more meaningful.",
      delta: 0,
    };
  }

  const delta = round(recentAverage - previousAverage);

  if (delta >= 4) {
    return {
      label: "Trending up",
      detail: `Your last 3 sessions are ${delta} points above the previous 3.`,
      delta,
    };
  }

  if (delta <= -4) {
    return {
      label: "Cooling off",
      detail: `Your last 3 sessions are ${Math.abs(delta)} points below the previous 3.`,
      delta,
    };
  }

  return {
    label: "Holding steady",
    detail: "Recent scores are broadly in line with your earlier sessions.",
    delta,
  };
}

export function getRecentScores(sessions, limit = 8) {
  return [...sessions]
    .slice(0, limit)
    .reverse()
    .map((session) => ({
      id: session.id,
      label: new Date(session.completedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      score: session.compositeScore,
    }));
}

export function getSubtestAverages(sessions) {
  const totals = {
    reactionTime: [],
    digitSpan: [],
    stroop: [],
    symbolCoding: [],
  };

  sessions.forEach((session) => {
    Object.entries(session.subtests).forEach(([id, result]) => {
      if (totals[id]) {
        totals[id].push(result.score);
      }
    });
  });

  return Object.fromEntries(
    Object.entries(totals).map(([id, values]) => [id, round(average(values))]),
  );
}

export function buildSessionSummary(session, allSessions) {
  const priorSessions = allSessions.filter((candidate) => candidate.id !== session.id);
  const priorAverage = average(priorSessions.map((candidate) => candidate.compositeScore));
  const summary = [];

  if (priorSessions.length) {
    const delta = round(session.compositeScore - priorAverage);

    if (delta >= 4) {
      summary.push("Above your average overall.");
    } else if (delta <= -4) {
      summary.push("Below your usual level overall.");
    } else {
      summary.push("Very close to your personal average.");
    }
  } else {
    summary.push("This is your baseline session.");
  }

  const sameTime = allSessions
    .filter((candidate) => candidate.timeOfDay === session.timeOfDay)
    .sort((left, right) => right.compositeScore - left.compositeScore);

  if (sameTime.length && sameTime[0].id === session.id) {
    summary.push(`Your best ${session.timeOfDay.toLowerCase()} session so far.`);
  }

  if (priorSessions.length) {
    const priorSubtestAverages = getSubtestAverages(priorSessions);
    const deltas = Object.values(session.subtests).map((subtest) => ({
      id: subtest.id,
      label: subtest.shortLabel,
      delta: round(subtest.score - (priorSubtestAverages[subtest.id] || 0)),
    }));

    const strongest = [...deltas].sort((left, right) => right.delta - left.delta)[0];
    const weakest = [...deltas].sort((left, right) => left.delta - right.delta)[0];

    if (strongest.delta >= 5) {
      summary.push(`${strongest.label} was stronger than your norm.`);
    }

    if (weakest.delta <= -5) {
      summary.push(`${weakest.label} was softer than your norm.`);
    }
  }

  return summary.slice(0, 3);
}

export function exportSessionsAsCsv(sessions) {
  const header = [
    "id",
    "completedAt",
    "timeOfDay",
    "durationSec",
    "compositeScore",
    "reactionScore",
    "reactionAvgMs",
    "digitSpanScore",
    "digitSpanCorrectRounds",
    "stroopScore",
    "stroopCorrect",
    "stroopAccuracy",
    "symbolCodingScore",
    "symbolCodingCorrect",
    "symbolCodingAccuracy",
  ];

  const rows = sessions.map((session) => [
    session.id,
    session.completedAt,
    session.timeOfDay,
    session.durationSec,
    session.compositeScore,
    session.subtests.reactionTime.score,
    round(session.subtests.reactionTime.raw.avgReactionMs),
    session.subtests.digitSpan.score,
    session.subtests.digitSpan.raw.correctRounds,
    session.subtests.stroop.score,
    session.subtests.stroop.raw.correct,
    round(session.subtests.stroop.raw.accuracy * 100),
    session.subtests.symbolCoding.score,
    session.subtests.symbolCoding.raw.correct,
    round(session.subtests.symbolCoding.raw.accuracy * 100),
  ]);

  return [header, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
}
