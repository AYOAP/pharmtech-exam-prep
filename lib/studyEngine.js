import { DOMAIN_ORDER, EXAM_FACTS, PTCB_DOMAINS, LEARNING_PATH, HIGH_YIELD_TOPICS } from "../content/blueprint.js";
import { CONTROLLED_SUBSTANCE_QUICK_LOOKUP, DRUG_CLASS_GUIDES, TOP_200_DRUGS } from "../content/drugBank.js";
import { SIG_CODES } from "../content/sigCodes.js";
import { buildExamSet, buildQuestionBank, buildWeakTopicQuiz } from "./questionFactory.js";

export const QUESTION_BANK = buildQuestionBank();
export const QUESTION_MAP = Object.fromEntries(QUESTION_BANK.map((question) => [question.id, question]));

const FLASHCARD_TODAY_LIMIT = 24;

export function toDateKey(date) {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function differenceInDays(fromDate, toDate) {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - start.getTime()) / 86400000);
}

export function formatMinutes(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function getDefaultExamDate(now = new Date()) {
  const today = new Date(now);
  const thisYearTarget = new Date(today.getFullYear(), 6, 1);
  return today <= thisYearTarget ? thisYearTarget.toISOString() : new Date(today.getFullYear() + 1, 6, 1).toISOString();
}

function createEmptyMasteryEntry() {
  return {
    questionsSeen: 0,
    correct: 0,
    score: 0,
    level: 1,
    lastUpdatedAt: null,
  };
}

export function createInitialState() {
  return {
    version: 1,
    profile: {
      learnerName: "Walgreens Tech",
      experience: "8 months at Walgreens",
      examDate: getDefaultExamDate(),
      createdAt: new Date().toISOString(),
    },
    ui: {
      onboardingComplete: false,
      selectedSection: "dashboard",
      showTutorial: true,
    },
    progress: {
      xp: 0,
      streakCurrent: 0,
      streakLongest: 0,
      lastActiveDate: null,
      totalStudyMinutes: 0,
      totalQuestionsAnswered: 0,
      totalCorrectAnswers: 0,
      totalFlashcardsReviewed: 0,
      diagnosticComplete: false,
    },
    mastery: {
      medications: createEmptyMasteryEntry(),
      federalRequirements: createEmptyMasteryEntry(),
      patientSafety: createEmptyMasteryEntry(),
      orderEntry: createEmptyMasteryEntry(),
    },
    weakTopics: {},
    flashcardProgress: {},
    completionsByDate: {},
    sessionHistory: [],
    tutorHistory: [],
    activeSession: null,
    notes: "",
  };
}

export function allocateDomainCounts(totalQuestions = EXAM_FACTS.examQuestions) {
  const baseCounts = DOMAIN_ORDER.map((domain) => {
    const exact = (PTCB_DOMAINS[domain].weight / 100) * totalQuestions;
    return {
      domain,
      exact,
      floor: Math.floor(exact),
      remainder: exact - Math.floor(exact),
    };
  });

  let assigned = baseCounts.reduce((sum, item) => sum + item.floor, 0);
  const counts = Object.fromEntries(baseCounts.map((item) => [item.domain, item.floor]));

  for (const item of [...baseCounts].sort((left, right) => right.remainder - left.remainder)) {
    if (assigned >= totalQuestions) {
      break;
    }
    counts[item.domain] += 1;
    assigned += 1;
  }

  return counts;
}

export function calculateMasteryLevel(score) {
  return Math.max(1, Math.min(10, Math.ceil(score / 10)));
}

export function getWeightedReadiness(mastery) {
  const total = DOMAIN_ORDER.reduce(
    (sum, domain) => sum + (mastery[domain]?.score ?? 0) * (PTCB_DOMAINS[domain].weight / 100),
    0,
  );
  return Math.round(total);
}

function getRecentSessions(state, type, limit = 5) {
  return state.sessionHistory
    .filter((session) => session.type === type)
    .slice()
    .sort((left, right) => new Date(right.completedAt) - new Date(left.completedAt))
    .slice(0, limit);
}

export function estimatePassProbability(state) {
  const readiness = getWeightedReadiness(state.mastery);
  const latestDiagnostic = getRecentSessions(state, "diagnostic", 1)[0];
  const latestMock = getRecentSessions(state, "mock", 1)[0];
  const diagnosticBoost = latestDiagnostic ? latestDiagnostic.scorePercent * 0.18 : 0;
  const mockBoost = latestMock ? latestMock.scorePercent * 0.16 : 0;
  const streakBoost = Math.min(state.progress.streakCurrent, 21) * 1.2;
  const consistencyBoost =
    state.progress.totalStudyMinutes > 600 ? 8 : state.progress.totalStudyMinutes > 300 ? 4 : 0;
  const weakPenalty = Math.min(Object.keys(state.weakTopics).length, 12) * 1.7;

  const probability = Math.round(
    Math.max(12, Math.min(96, 18 + readiness * 0.5 + diagnosticBoost + mockBoost + streakBoost + consistencyBoost - weakPenalty)),
  );

  return probability;
}

export function getWeakTopicList(state, limit = 6) {
  return Object.entries(state.weakTopics)
    .map(([topic, stats]) => ({
      topic,
      ...stats,
      weaknessScore: stats.misses * 2 + Math.max(0, 3 - stats.correct),
    }))
    .sort((left, right) => right.weaknessScore - left.weaknessScore)
    .slice(0, limit);
}

export function getDomainPriority(state) {
  return DOMAIN_ORDER.slice().sort((left, right) => {
    const leftScore = state.mastery[left]?.score ?? 0;
    const rightScore = state.mastery[right]?.score ?? 0;
    return leftScore - rightScore;
  });
}

function makeSessionBase(type, questionIds, title, testingMinutes, focusDomain = null) {
  return {
    id: `${type}-${Date.now()}`,
    type,
    title,
    testingMinutes,
    focusDomain,
    questionIds,
    answers: {},
    currentIndex: 0,
    startedAt: new Date().toISOString(),
  };
}

function rotateArray(items, offset) {
  const safeOffset = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(safeOffset), ...items.slice(0, safeOffset)];
}

export function createDiagnosticSession(state) {
  const counts = allocateDomainCounts(EXAM_FACTS.examQuestions);
  const offset = state.sessionHistory.filter((item) => item.type === "diagnostic").length;
  const examQuestions = rotateArray(buildExamSet(QUESTION_BANK, counts, `diagnostic-${offset}`), offset).slice(
    0,
    EXAM_FACTS.examQuestions,
  );
  return makeSessionBase("diagnostic", examQuestions.map((question) => question.id), "Initial Diagnostic", EXAM_FACTS.testingMinutes);
}

export function createMockSession(state) {
  const counts = allocateDomainCounts(EXAM_FACTS.examQuestions);
  const offset = state.sessionHistory.filter((item) => item.type === "mock").length + 7;
  const examQuestions = rotateArray(buildExamSet(QUESTION_BANK, counts, `mock-${offset}`), offset).slice(
    0,
    EXAM_FACTS.examQuestions,
  );
  return makeSessionBase("mock", examQuestions.map((question) => question.id), "Timed Mock Exam", EXAM_FACTS.testingMinutes);
}

export function createDailyQuizSession(state, count = 12) {
  const priorities = getDomainPriority(state);
  const focusDomain = priorities[0];
  const pool = QUESTION_BANK.filter((question) => question.domain === focusDomain);
  const offset = state.sessionHistory.filter((item) => item.type === "daily-quiz").length;
  const questions = rotateArray(pool, offset).slice(0, count);
  return makeSessionBase("daily-quiz", questions.map((question) => question.id), `${PTCB_DOMAINS[focusDomain].name} Focus Quiz`, 18, focusDomain);
}

export function createWeaknessReviewSession(state, count = 8) {
  const weakTopics = getWeakTopicList(state, 4).map((entry) => entry.topic);
  const quiz = weakTopics.length ? buildWeakTopicQuiz(QUESTION_BANK, weakTopics, count) : createDailyQuizSession(state, count).questionIds.map((id) => QUESTION_MAP[id]);
  const questionIds = quiz.map((question) => question.id).slice(0, count);
  return makeSessionBase("weakness-review", questionIds, "Weakness Review", 12, null);
}

export function hydrateActiveSession(session) {
  if (!session) {
    return null;
  }

  return {
    ...session,
    questions: session.questionIds.map((id) => QUESTION_MAP[id]).filter(Boolean),
  };
}

export function gradeSession(session, answerMap, elapsedSec) {
  const hydrated = hydrateActiveSession(session);
  const breakdown = Object.fromEntries(
    DOMAIN_ORDER.map((domain) => [
      domain,
      {
        correct: 0,
        total: 0,
        score: 0,
      },
    ]),
  );

  const weakTags = {};
  const review = hydrated.questions.map((question) => {
    const selectedIndex = answerMap[question.id];
    const correct = selectedIndex === question.answerIndex;
    const domainEntry = breakdown[question.domain];
    domainEntry.total += 1;
    domainEntry.correct += correct ? 1 : 0;

    if (!correct) {
      question.tags.forEach((tag) => {
        if (!tag) {
          return;
        }
        weakTags[tag] ||= { misses: 0, correct: 0, exposures: 0 };
        weakTags[tag].misses += 1;
        weakTags[tag].exposures += 1;
      });
    } else {
      question.tags.forEach((tag) => {
        if (!tag) {
          return;
        }
        weakTags[tag] ||= { misses: 0, correct: 0, exposures: 0 };
        weakTags[tag].correct += 1;
        weakTags[tag].exposures += 1;
      });
    }

    return {
      questionId: question.id,
      domain: question.domain,
      correct,
      selectedIndex,
      correctIndex: question.answerIndex,
      tags: question.tags,
    };
  });

  DOMAIN_ORDER.forEach((domain) => {
    const entry = breakdown[domain];
    entry.score = entry.total ? Math.round((entry.correct / entry.total) * 100) : 0;
  });

  const totalCorrect = review.filter((item) => item.correct).length;
  const totalQuestions = hydrated.questions.length;
  const scorePercent = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const xpEarned =
    totalCorrect * 12 +
    (session.type === "diagnostic" ? 140 : session.type === "mock" ? 120 : session.type === "weakness-review" ? 80 : 60);

  return {
    id: session.id,
    type: session.type,
    title: session.title,
    completedAt: new Date().toISOString(),
    elapsedSec,
    scorePercent,
    totalCorrect,
    totalQuestions,
    breakdown,
    review,
    weakTags,
    xpEarned,
  };
}

function updateStreak(progress, completedAt) {
  const todayKey = toDateKey(completedAt);
  const previous = progress.lastActiveDate;
  let streakCurrent = progress.streakCurrent;

  if (!previous) {
    streakCurrent = 1;
  } else {
    const gap = differenceInDays(previous, completedAt);
    if (gap === 0) {
      streakCurrent = progress.streakCurrent;
    } else if (gap === 1) {
      streakCurrent = progress.streakCurrent + 1;
    } else {
      streakCurrent = 1;
    }
  }

  return {
    ...progress,
    lastActiveDate: todayKey,
    streakCurrent,
    streakLongest: Math.max(progress.streakLongest, streakCurrent),
  };
}

function mergeWeakTopics(existingTopics, deltaTopics, completedAt) {
  const merged = { ...existingTopics };

  Object.entries(deltaTopics).forEach(([topic, stats]) => {
    const current = merged[topic] ?? {
      misses: 0,
      correct: 0,
      exposures: 0,
      lastSeenAt: null,
    };

    merged[topic] = {
      misses: current.misses + stats.misses,
      correct: current.correct + stats.correct,
      exposures: current.exposures + stats.exposures,
      lastSeenAt: completedAt,
    };
  });

  return merged;
}

export function applySessionResult(state, result) {
  const nextMastery = { ...state.mastery };
  DOMAIN_ORDER.forEach((domain) => {
    const entry = nextMastery[domain];
    const delta = result.breakdown[domain];
    if (!delta.total) {
      return;
    }

    const questionsSeen = entry.questionsSeen + delta.total;
    const correct = entry.correct + delta.correct;
    const score = Math.round((correct / questionsSeen) * 100);

    nextMastery[domain] = {
      questionsSeen,
      correct,
      score,
      level: calculateMasteryLevel(score),
      lastUpdatedAt: result.completedAt,
    };
  });

  const updatedProgress = updateStreak(
    {
      ...state.progress,
      xp: state.progress.xp + result.xpEarned,
      totalStudyMinutes: state.progress.totalStudyMinutes + Math.max(1, Math.round(result.elapsedSec / 60)),
      totalQuestionsAnswered: state.progress.totalQuestionsAnswered + result.totalQuestions,
      totalCorrectAnswers: state.progress.totalCorrectAnswers + result.totalCorrect,
      diagnosticComplete: state.progress.diagnosticComplete || result.type === "diagnostic",
    },
    result.completedAt,
  );

  return {
    ...state,
    progress: updatedProgress,
    mastery: nextMastery,
    weakTopics: mergeWeakTopics(state.weakTopics, result.weakTags, result.completedAt),
    sessionHistory: [...state.sessionHistory, result],
    activeSession: null,
  };
}

function deckCard(id, kind, domain, front, back, tags = []) {
  return { id, kind, domain, front, back, tags };
}

export function buildFlashcardDeck() {
  const drugCards = TOP_200_DRUGS.map((drug) =>
    deckCard(
      `drug-${drug.id}`,
      "drug",
      "medications",
      `${drug.generic} (${drug.brand})`,
      [
        `Class: ${drug.drugClass}`,
        `Use: ${drug.indication}`,
        `Watch for: ${drug.sideEffect}`,
        `Schedule: ${drug.schedule}`,
        `Pearl: ${drug.pearl}`,
      ].join("\n"),
      [drug.generic, drug.brand, drug.drugClass],
    ),
  );

  const brandCards = TOP_200_DRUGS.slice(0, 120).map((drug) =>
    deckCard(
      `brand-${drug.id}`,
      "brand-generic",
      "medications",
      `Brand name for ${drug.generic}?`,
      `${drug.brand}\nClass: ${drug.drugClass}\nUse: ${drug.indication}`,
      [drug.generic, drug.brand],
    ),
  );

  const sigCards = SIG_CODES.map((entry) =>
    deckCard(
      `sig-${entry.term.toLowerCase()}`,
      "sig",
      "orderEntry",
      `What does ${entry.term} mean?`,
      `${entry.meaning}\nExample: ${entry.example}`,
      [entry.term, "sig-codes"],
    ),
  );

  const scheduleCards = CONTROLLED_SUBSTANCE_QUICK_LOOKUP.map((entry) =>
    deckCard(
      `schedule-${entry.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      "schedule",
      "federalRequirements",
      `Federal schedule for ${entry.name}?`,
      entry.schedule,
      [entry.name, entry.schedule],
    ),
  );

  return [...drugCards, ...brandCards, ...sigCards, ...scheduleCards];
}

export const FLASHCARD_DECK = buildFlashcardDeck();
export const FLASHCARD_MAP = Object.fromEntries(FLASHCARD_DECK.map((card) => [card.id, card]));

export function getDueFlashcards(progressMap, limit = FLASHCARD_TODAY_LIMIT, now = new Date()) {
  const nowMs = new Date(now).getTime();
  const cards = FLASHCARD_DECK.filter((card) => {
    const progress = progressMap[card.id];
    if (!progress) {
      return true;
    }
    return new Date(progress.dueAt).getTime() <= nowMs;
  });

  return cards
    .slice()
    .sort((left, right) => {
      const leftDue = progressMap[left.id]?.dueAt ?? "1970-01-01T00:00:00.000Z";
      const rightDue = progressMap[right.id]?.dueAt ?? "1970-01-01T00:00:00.000Z";
      return new Date(leftDue) - new Date(rightDue);
    })
    .slice(0, limit);
}

export function gradeFlashcard(progressEntry, rating, now = new Date()) {
  const current = progressEntry ?? {
    interval: 0,
    ease: 2.5,
    repetitions: 0,
    dueAt: new Date(now).toISOString(),
    lastReviewedAt: null,
    lapses: 0,
  };

  let interval = current.interval;
  let ease = current.ease;
  let repetitions = current.repetitions;
  let lapses = current.lapses;

  if (rating === "again") {
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
    repetitions = 0;
    lapses += 1;
  } else if (rating === "hard") {
    interval = Math.max(1, interval ? Math.round(interval * 1.2) : 1);
    ease = Math.max(1.3, ease - 0.15);
    repetitions += 1;
  } else if (rating === "easy") {
    interval = repetitions === 0 ? 3 : Math.max(3, Math.round(interval * ease * 1.3));
    ease = Math.min(3.4, ease + 0.15);
    repetitions += 1;
  } else {
    interval = repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.max(3, Math.round(interval * ease));
    repetitions += 1;
  }

  return {
    interval,
    ease,
    repetitions,
    lapses,
    lastReviewedAt: new Date(now).toISOString(),
    dueAt: addDays(now, interval).toISOString(),
  };
}

export function applyFlashcardReview(state, cardId, rating) {
  const updatedEntry = gradeFlashcard(state.flashcardProgress[cardId], rating);
  const completedAt = new Date().toISOString();
  const nextReviewCount = state.progress.totalFlashcardsReviewed + 1;
  const minuteBonus = nextReviewCount % 4 === 0 ? 1 : 0;
  return {
    ...state,
    flashcardProgress: {
      ...state.flashcardProgress,
      [cardId]: updatedEntry,
    },
    progress: updateStreak(
      {
        ...state.progress,
        totalFlashcardsReviewed: nextReviewCount,
        totalStudyMinutes: state.progress.totalStudyMinutes + minuteBonus,
      },
      completedAt,
    ),
  };
}

export function getStudyPace(state) {
  const daysToExam = Math.max(1, differenceInDays(new Date(), state.profile.examDate));
  if (daysToExam <= 30) {
    return { label: "Final sprint", minutes: 60 };
  }
  if (daysToExam <= 75) {
    return { label: "Build and refine", minutes: 50 };
  }
  return { label: "Foundation phase", minutes: 40 };
}

export function getDailyPlan(state, now = new Date()) {
  const todayKey = toDateKey(now);
  const completed = state.completionsByDate[todayKey] ?? [];
  const dueCards = getDueFlashcards(state.flashcardProgress, FLASHCARD_TODAY_LIMIT, now).length;
  const priorities = getDomainPriority(state);
  const primary = priorities[0];
  const secondary = priorities[1];
  const weakTopics = getWeakTopicList(state, 3);
  const pace = getStudyPace(state);

  const tasks = [];

  if (!state.progress.diagnosticComplete) {
    tasks.push({
      id: "diagnostic",
      type: "diagnostic",
      title: "Take the full baseline diagnostic",
      detail: `${EXAM_FACTS.examQuestions} questions, ${EXAM_FACTS.testingMinutes} minutes, current 2026 PTCE weighting.`,
      xp: 140,
      domain: null,
    });
  } else {
    tasks.push({
      id: "focus-quiz",
      type: "daily-quiz",
      title: `${PTCB_DOMAINS[primary].name} focus quiz`,
      detail: `12-question drill on the current weakest weighted domain.`,
      xp: 60,
      domain: primary,
    });

    tasks.push({
      id: "drug-mastery",
      type: "drug-mastery",
      title: `${PTCB_DOMAINS[secondary].name === PTCB_DOMAINS.medications.name ? "Drug mastery sprint" : `${PTCB_DOMAINS[secondary].name} skill block`}`,
      detail:
        primary === "medications" || secondary === "medications"
          ? "Work through one drug-class cluster and review the attached mnemonic."
          : `Review one learning-path lesson in ${PTCB_DOMAINS[secondary].name}.`,
      xp: 35,
      domain: primary === "medications" ? "medications" : secondary,
    });
  }

  tasks.push({
    id: "flashcards",
    type: "flashcards",
    title: `Review ${Math.min(FLASHCARD_TODAY_LIMIT, Math.max(12, dueCards))} flashcards`,
    detail: "Use spaced repetition for top drugs, schedules, and sig codes.",
    xp: 40,
    domain: "medications",
  });

  tasks.push({
    id: "weakness-review",
    type: "weakness-review",
    title: "Clean up recent misses",
    detail:
      weakTopics.length > 0
        ? `Most urgent topics: ${weakTopics.map((entry) => entry.topic).slice(0, 3).join(", ")}.`
        : "No major weak topics yet. Use this as a mixed review set.",
    xp: 80,
    domain: weakTopics[0]?.topic ?? null,
  });

  const lastMock = getRecentSessions(state, "mock", 1)[0];
  const mockGap = lastMock ? differenceInDays(lastMock.completedAt, now) : 99;
  if (state.progress.diagnosticComplete && mockGap >= 14) {
    tasks.push({
      id: "mock-exam",
      type: "mock",
      title: "Schedule a full mock exam",
      detail: `${EXAM_FACTS.examQuestions} questions with a ${EXAM_FACTS.testingMinutes}-minute timer to train pacing.`,
      xp: 120,
      domain: null,
    });
  }

  return {
    todayKey,
    recommendedMinutes: pace.minutes,
    paceLabel: pace.label,
    completed,
    tasks,
  };
}

export function toggleTaskCompletion(state, taskId, dateKey = toDateKey(new Date())) {
  const current = state.completionsByDate[dateKey] ?? [];
  const next = current.includes(taskId) ? current.filter((item) => item !== taskId) : [...current, taskId];
  return {
    ...state,
    completionsByDate: {
      ...state.completionsByDate,
      [dateKey]: next,
    },
  };
}

export function buildWeeklyRoadmap(state, now = new Date()) {
  const priorities = getDomainPriority(state);
  const first = priorities[0];
  const second = priorities[1];
  const third = priorities[2];
  const fourth = priorities[3];

  return [
    {
      week: "Week 1",
      focus: PTCB_DOMAINS[first].name,
      summary: `Lock in ${PTCB_DOMAINS[first].name.toLowerCase()} fundamentals and memorize the most-missed high-yield facts.`,
    },
    {
      week: "Week 2",
      focus: PTCB_DOMAINS[second].name,
      summary: `Layer in ${PTCB_DOMAINS[second].name.toLowerCase()} with timed mini-quizzes and daily flashcards.`,
    },
    {
      week: "Week 3",
      focus: PTCB_DOMAINS[third].name,
      summary: `Rotate to ${PTCB_DOMAINS[third].name.toLowerCase()} while keeping earlier domains warm through spaced repetition.`,
    },
    {
      week: "Week 4",
      focus: PTCB_DOMAINS[fourth].name,
      summary: `Run a mixed mock and use the results to rebalance the next month of study.`,
    },
  ];
}

export function buildDashboardSnapshot(state, now = new Date()) {
  const readiness = getWeightedReadiness(state.mastery);
  const passProbability = estimatePassProbability(state);
  const daysToExam = Math.max(0, differenceInDays(now, state.profile.examDate));
  const dueCards = getDueFlashcards(state.flashcardProgress, FLASHCARD_TODAY_LIMIT, now).length;
  const weakTopics = getWeakTopicList(state, 5);
  const dailyPlan = getDailyPlan(state, now);

  return {
    readiness,
    passProbability,
    daysToExam,
    dueCards,
    weakTopics,
    dailyPlan,
    masteryRows: DOMAIN_ORDER.map((domain) => ({
      ...PTCB_DOMAINS[domain],
      ...state.mastery[domain],
    })),
  };
}

export function getLearningResources() {
  return {
    learningPath: LEARNING_PATH,
    classGuides: DRUG_CLASS_GUIDES,
    highYieldTopics: HIGH_YIELD_TOPICS,
  };
}
