"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { EXAM_FACTS, ONBOARDING_STEPS, PTCB_DOMAINS, STUDY_STRATEGY } from "../content/blueprint.js";
import { CONTROLLED_SUBSTANCE_QUICK_LOOKUP, TOP_200_DRUGS } from "../content/drugBank.js";
import { Button, Metric, ProgressBar, SectionHeading, Tag, cx } from "./ui.js";
import {
  QUESTION_MAP,
  applyFlashcardReview,
  applySessionResult,
  buildDashboardSnapshot,
  buildWeeklyRoadmap,
  createDailyQuizSession,
  createDiagnosticSession,
  createInitialState,
  createMockSession,
  createWeaknessReviewSession,
  estimatePassProbability,
  formatMinutes,
  getDailyPlan,
  getDueFlashcards,
  getLearningResources,
  hydrateActiveSession,
  gradeSession,
  toggleTaskCompletion,
  toDateKey,
} from "../lib/studyEngine.js";
import { loadStoredState, mergeStoredState, saveStoredState } from "../lib/storage.js";

const SECTIONS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "practice", label: "Practice" },
  { id: "flashcards", label: "Flashcards" },
  { id: "drugs", label: "Drug Mastery" },
  { id: "progress", label: "Progress" },
];

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getSessionElapsedSec(activeSession) {
  return Math.max(0, Math.round((Date.now() - new Date(activeSession.startedAt).getTime()) / 1000));
}

function DomainRow({ row }) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/90 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-plum-950">{row.name}</p>
          <p className="mt-1 text-sm text-rose-900/70">{row.description}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-rosebrand-700">{row.weight}%</p>
          <p className="text-xs uppercase tracking-[0.18em] text-rose-900/45">exam weight</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-rose-900/70">
        <span>Level {row.level}</span>
        <span>{row.score}% mastery</span>
      </div>
      <ProgressBar value={row.score} className="mt-2" />
    </div>
  );
}

function TaskCard({ task, completed, onToggle, onLaunch }) {
  return (
    <div className="rounded-[26px] border border-rosebrand-100 bg-white/95 p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggle(task.id)}
              className={cx(
                "flex h-7 w-7 items-center justify-center rounded-full border text-sm font-bold transition",
                completed
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-rosebrand-200 bg-rosebrand-50 text-rosebrand-700",
              )}
            >
              {completed ? "OK" : "+"}
            </button>
            <p className="font-semibold text-plum-950">{task.title}</p>
          </div>
          <p className="text-sm text-rose-900/70">{task.detail}</p>
        </div>
        <div className="space-y-2 text-right">
          <Tag>{task.xp} XP</Tag>
          <div>
            <Button tone="secondary" className="px-3 py-2 text-xs" onClick={() => onLaunch(task)}>
              Open
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LearningPath({ masteryRows }) {
  const { learningPath } = getLearningResources();

  return (
    <div className="space-y-4">
      {learningPath.map((step, index) => {
        const domainRow = masteryRows.find((row) => row.id === step.domain);
        const done = (domainRow?.score ?? 0) >= 70;
        return (
          <div
            key={step.id}
            className={cx(
              "relative grid gap-4 rounded-[28px] border p-5 shadow-card sm:grid-cols-[64px_1fr]",
              done ? "border-emerald-200 bg-emerald-50/70" : "border-rosebrand-100 bg-white/95",
            )}
          >
            <div className="flex items-center justify-center">
              <div
                className={cx(
                  "flex h-14 w-14 items-center justify-center rounded-[20px] font-display text-2xl",
                  done
                    ? "bg-emerald-500 text-white"
                    : "bg-gradient-to-br from-rosebrand-500 to-orange-300 text-white",
                )}
              >
                {done ? "OK" : index + 1}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-plum-950">{step.title}</p>
                <Tag>{PTCB_DOMAINS[step.domain].shortName}</Tag>
              </div>
              <p className="text-sm text-rose-900/70">{step.focus}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-rosebrand-600">
                Current domain mastery: {domainRow?.score ?? 0}%
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DashboardSection({ appState, onTaskToggle, onTaskLaunch, onStartDiagnostic, onOpenSection }) {
  const snapshot = buildDashboardSnapshot(appState);

  return (
    <div className="space-y-8">
      <section className="glass-panel-strong overflow-hidden p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Tag>Personal PTCE path</Tag>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-display text-5xl leading-[0.95] text-plum-950 sm:text-6xl">
                PTCB Passport
              </h1>
              <p className="max-w-2xl text-balance text-base text-rose-900/75 sm:text-lg">
                A guided, pink-themed study platform built around the current January 2026 PTCE outline so one
                learner can stay consistent, close gaps fast, and reach July ready.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={onStartDiagnostic}>Start diagnostic</Button>
              <Button tone="secondary" onClick={() => onOpenSection("practice")}>
                Open practice hub
              </Button>
              <Button tone="ghost" onClick={() => onOpenSection("flashcards")}>
                Review flashcards
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Readiness" value={`${snapshot.readiness}%`} hint="Weighted to the real exam blueprint." />
              <Metric label="Pass Chance" value={`${snapshot.passProbability}%`} hint="Study estimate, not an official PTCB score." />
              <Metric label="Streak" value={`${appState.progress.streakCurrent} days`} hint={`Longest streak: ${appState.progress.streakLongest} days`} />
              <Metric label="Time Studied" value={formatMinutes(appState.progress.totalStudyMinutes)} hint={`${appState.progress.xp} XP earned so far`} />
            </div>
          </div>

          <div className="rounded-[30px] border border-rosebrand-100 bg-gradient-to-br from-rosebrand-600 via-fuchsia-500 to-orange-300 p-6 text-white shadow-glow">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">Target window</p>
            <h2 className="mt-3 font-display text-4xl">July readiness plan</h2>
            <p className="mt-3 text-sm text-white/85">
              Exam date tracked as <strong>{formatDate(appState.profile.examDate)}</strong>. You have{" "}
              <strong>{snapshot.daysToExam} days</strong> to stack daily reps, fix weak topics, and turn review into recall.
            </p>
            <div className="mt-6 space-y-3">
              <div className="rounded-[24px] bg-white/15 p-4">
                <p className="text-sm font-semibold">Recommended pace</p>
                <p className="mt-1 text-white/90">{snapshot.dailyPlan.recommendedMinutes} focused minutes today</p>
              </div>
              <div className="rounded-[24px] bg-white/15 p-4">
                <p className="text-sm font-semibold">Cards due</p>
                <p className="mt-1 text-white/90">{snapshot.dueCards} flashcards are ready for spaced repetition</p>
              </div>
              <div className="rounded-[24px] bg-white/15 p-4">
                <p className="text-sm font-semibold">Top weak topics</p>
                <p className="mt-1 text-white/90">
                  {snapshot.weakTopics.length
                    ? snapshot.weakTopics.map((item) => item.topic).join(", ")
                    : "Take the diagnostic first so the app can find your real gaps."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell">
        <SectionHeading
          eyebrow="Today"
          title="Your daily route"
          description={`Current pace: ${snapshot.dailyPlan.paceLabel}. Finish these tasks to grow your streak and keep weak areas moving.`}
        />
        <div className="mt-6 grid gap-4">
          {snapshot.dailyPlan.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              completed={snapshot.dailyPlan.completed.includes(task.id)}
              onToggle={onTaskToggle}
              onLaunch={onTaskLaunch}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <section className="section-shell">
          <SectionHeading
            eyebrow="Mastery"
            title="Domain progress"
            description="Levels and bars update after every quiz, flashcard cycle, diagnostic, and mock exam."
          />
          <div className="mt-6 grid gap-4">
            {snapshot.masteryRows.map((row) => (
              <DomainRow key={row.id} row={row} />
            ))}
          </div>
        </section>

        <section className="section-shell">
          <SectionHeading
            eyebrow="Path"
            title="Duolingo-style study map"
            description="This path is ordered by the PTCE knowledge areas you need most right now."
          />
          <div className="mt-6">
            <LearningPath masteryRows={snapshot.masteryRows} />
          </div>
        </section>
      </div>

      <section className="section-shell">
        <SectionHeading
          eyebrow="Method"
          title="How this plan helps you pass"
          description="The app leans on active recall, spaced repetition, and mistake-driven review instead of passive reading."
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {STUDY_STRATEGY.map((item) => (
            <div key={item.title} className="rounded-[24px] border border-rosebrand-100 bg-white/90 p-5">
              <p className="font-semibold text-plum-950">{item.title}</p>
              <p className="mt-2 text-sm text-rose-900/70">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SessionLauncher({ appState, onStart }) {
  const lastDiagnostic = appState.sessionHistory.filter((item) => item.type === "diagnostic").slice(-1)[0];
  const lastMock = appState.sessionHistory.filter((item) => item.type === "mock").slice(-1)[0];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Practice hub"
        title="Train under exam pressure"
        description="Use the full diagnostic once, then rotate daily focus quizzes, weakness review, and full mock exams to build both recall and pacing."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[28px] border border-rosebrand-100 bg-white/95 p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-500">Diagnostic</p>
          <h3 className="mt-3 font-display text-3xl text-plum-950">Initial baseline</h3>
          <p className="mt-2 text-sm text-rose-900/70">
            {EXAM_FACTS.examQuestions} questions. {EXAM_FACTS.testingMinutes} minutes. Current domain weights and score breakdown.
          </p>
          {lastDiagnostic ? (
            <p className="mt-3 text-sm text-rose-900/70">Last score: {lastDiagnostic.scorePercent}% on {formatDate(lastDiagnostic.completedAt)}</p>
          ) : null}
          <Button className="mt-5" onClick={() => onStart("diagnostic")}>
            Start diagnostic
          </Button>
        </div>

        <div className="rounded-[28px] border border-rosebrand-100 bg-white/95 p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-500">Mock exam</p>
          <h3 className="mt-3 font-display text-3xl text-plum-950">Timed full-length mock</h3>
          <p className="mt-2 text-sm text-rose-900/70">
            Closely mirrors the PTCE structure so you can practice pacing without answer explanations until the end.
          </p>
          {lastMock ? <p className="mt-3 text-sm text-rose-900/70">Last mock: {lastMock.scorePercent}% on {formatDate(lastMock.completedAt)}</p> : null}
          <Button className="mt-5" onClick={() => onStart("mock")}>
            Start mock exam
          </Button>
        </div>

        <div className="rounded-[28px] border border-rosebrand-100 bg-white/95 p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-500">Daily quiz</p>
          <h3 className="mt-3 font-display text-3xl text-plum-950">Adaptive focus set</h3>
          <p className="mt-2 text-sm text-rose-900/70">
            Short review with explanations after every question. Automatically points at your weakest weighted domain.
          </p>
          <Button className="mt-5" onClick={() => onStart("daily-quiz")}>
            Start daily quiz
          </Button>
        </div>

        <div className="rounded-[28px] border border-rosebrand-100 bg-white/95 p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-500">Weakness engine</p>
          <h3 className="mt-3 font-display text-3xl text-plum-950">Missed-question cleanup</h3>
          <p className="mt-2 text-sm text-rose-900/70">
            Re-serves weak concepts quickly so misses turn into study targets instead of repeat mistakes.
          </p>
          <Button className="mt-5" onClick={() => onStart("weakness-review")}>
            Start weakness review
          </Button>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ result }) {
  if (!result) {
    return null;
  }

  return (
    <div className="rounded-[28px] border border-rosebrand-100 bg-white/95 p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-500">Latest result</p>
          <h3 className="mt-2 font-display text-3xl text-plum-950">{result.title}</h3>
          <p className="mt-1 text-sm text-rose-900/70">
            {result.totalCorrect} of {result.totalQuestions} correct on {formatDate(result.completedAt)}
          </p>
        </div>
        <div className="rounded-[24px] bg-rosebrand-50 px-5 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-600">Score</p>
          <p className="mt-2 font-display text-4xl text-rosebrand-700">{result.scorePercent}%</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(result.breakdown).map(([domain, info]) => (
          <div key={domain} className="rounded-[22px] border border-rosebrand-100 bg-rosebrand-50/60 p-4">
            <p className="text-sm font-semibold text-plum-950">{PTCB_DOMAINS[domain].shortName}</p>
            <p className="mt-1 text-sm text-rose-900/70">
              {info.correct}/{info.total} correct
            </p>
            <ProgressBar value={info.score} className="mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionReview({ result }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!result) {
    return null;
  }

  return (
    <div className="space-y-4">
      {result.review.map((item) => {
        const question = QUESTION_MAP[item.questionId];
        const selectedChoice =
          typeof item.selectedIndex === "number" && question.choices[item.selectedIndex]
            ? question.choices[item.selectedIndex]
            : "No answer selected";
        const correctChoice = question.choices[item.correctIndex];
        const isOpen = expandedId === item.questionId;

        return (
          <div key={item.questionId} className="rounded-[24px] border border-rosebrand-100 bg-white/95 p-5 shadow-card">
            <button
              type="button"
              onClick={() => setExpandedId(isOpen ? null : item.questionId)}
              className="flex w-full items-start justify-between gap-4 text-left"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-500">
                  {PTCB_DOMAINS[item.domain].name}
                </p>
                <p className="mt-2 font-semibold text-plum-950">{question.prompt}</p>
                <p className={cx("mt-2 text-sm", item.correct ? "text-emerald-700" : "text-rose-700")}>
                  {item.correct ? "Correct" : "Needs review"}: you chose "{selectedChoice}"
                </p>
              </div>
              <span className="text-sm font-semibold text-rosebrand-600">{isOpen ? "Hide" : "Show"}</span>
            </button>

            {isOpen ? (
              <div className="mt-4 space-y-3 border-t border-rosebrand-100 pt-4">
                <div className="rounded-[20px] bg-emerald-50 p-4 text-sm text-emerald-900">
                  <strong>Correct answer:</strong> {correctChoice}. {question.explanation}
                </div>
                <div className="grid gap-2">
                  {question.choices.map((choice, index) => (
                    <div
                      key={`${item.questionId}-${choice}`}
                      className={cx(
                        "rounded-[18px] border p-3 text-sm",
                        index === item.correctIndex
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : index === item.selectedIndex
                            ? "border-rose-200 bg-rose-50 text-rose-900"
                            : "border-rosebrand-100 bg-rosebrand-50/40 text-rose-900/80",
                      )}
                    >
                      <strong>{choice}</strong>
                      {index === item.correctIndex ? ` - ${question.explanation}` : ` - ${question.incorrectExplanations[index]}`}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function TutorBox({ questionContext = null }) {
  const [mode, setMode] = useState("explain");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState("idle");

  async function handleAsk(nextMode = mode) {
    setStatus("loading");
    setResponse("");

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: nextMode,
          prompt,
          question: questionContext
            ? {
                prompt: questionContext.prompt,
                choices: questionContext.choices,
                answerIndex: questionContext.answerIndex,
                explanation: questionContext.explanation,
              }
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Tutor request failed.");
      }

      setResponse(data.output);
      setStatus("success");
    } catch (error) {
      setResponse(error.message);
      setStatus("error");
    }
  }

  return (
    <div className="rounded-[28px] border border-rosebrand-100 bg-white/95 p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-500">AI tutor</p>
          <h3 className="mt-1 font-display text-2xl text-plum-950">Get unstuck fast</h3>
        </div>
        <Tag>Optional OpenAI</Tag>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { id: "explain", label: "Explain this" },
          { id: "simplify", label: "Simplify concept" },
          { id: "memory", label: "Memory trick" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={cx(
              "rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition",
              mode === item.id ? "bg-rosebrand-600 text-white" : "bg-rosebrand-50 text-rosebrand-700",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <textarea
        className="mt-4 h-28 w-full rounded-[22px] border border-rosebrand-100 bg-rosebrand-50/50 p-4 text-sm text-plum-950"
        placeholder={
          questionContext
            ? "Ask about the current question, the rule behind it, or the best way to remember it."
            : "Paste a concept or type a question such as 'Explain Schedule II refill rules simply.'"
        }
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={() => handleAsk(mode)} disabled={status === "loading"}>
          {status === "loading" ? "Thinking..." : "Ask tutor"}
        </Button>
        {questionContext ? (
          <Button
            tone="secondary"
            onClick={() => {
              setPrompt(questionContext.prompt);
              setMode("explain");
            }}
          >
            Use current question
          </Button>
        ) : null}
      </div>

      <div className="mt-4 rounded-[22px] border border-rosebrand-100 bg-rosebrand-50/40 p-4 text-sm text-rose-900/80">
        {response ||
          "When an OpenAI API key is configured, this tutor can explain the current question, simplify a law or math concept, or build a quick memory hook."}
      </div>
    </div>
  );
}

function SessionRunner({ activeSession, onUpdateSession, onSubmitSession, lastResult }) {
  const question = activeSession.questions[activeSession.currentIndex];
  const selectedIndex = activeSession.answers[question.id];
  const isExamMode = activeSession.type === "diagnostic" || activeSession.type === "mock";
  const isRevealed = Boolean(activeSession.revealed?.[question.id]);
  const elapsedSec = getSessionElapsedSec(activeSession);
  const remainingSec = Math.max(0, activeSession.testingMinutes * 60 - elapsedSec);
  const remainingMinutes = Math.floor(remainingSec / 60);
  const remainingSeconds = String(remainingSec % 60).padStart(2, "0");

  function patchSession(patch) {
    onUpdateSession({
      ...activeSession,
      ...patch,
    });
  }

  function handleChoice(index) {
    patchSession({
      answers: {
        ...activeSession.answers,
        [question.id]: index,
      },
    });
  }

  function handleCheck() {
    if (typeof selectedIndex !== "number") {
      return;
    }
    patchSession({
      revealed: {
        ...(activeSession.revealed ?? {}),
        [question.id]: true,
      },
    });
  }

  function handleNext() {
    if (activeSession.currentIndex === activeSession.questions.length - 1) {
      onSubmitSession();
      return;
    }
    patchSession({ currentIndex: activeSession.currentIndex + 1 });
  }

  useEffect(() => {
    if (remainingSec <= 0) {
      onSubmitSession();
    }
  }, [remainingSec, onSubmitSession]);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-rosebrand-100 bg-white/95 p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-500">{activeSession.title}</p>
            <h3 className="mt-2 font-display text-3xl text-plum-950">
              Question {activeSession.currentIndex + 1} of {activeSession.questions.length}
            </h3>
            <p className="mt-2 text-sm text-rose-900/70">
              {isExamMode
                ? "Exam mode hides explanations until the end, just like a realistic test run."
                : "Study mode reveals the reasoning before you move on."}
            </p>
          </div>
          <div className="rounded-[24px] bg-rosebrand-50 px-5 py-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-600">Timer</p>
            <p className="mt-2 font-display text-4xl text-rosebrand-700">
              {remainingMinutes}:{remainingSeconds}
            </p>
          </div>
        </div>

        <ProgressBar value={((activeSession.currentIndex + 1) / activeSession.questions.length) * 100} className="mt-6" />

        <div className="mt-6 rounded-[28px] border border-rosebrand-100 bg-rosebrand-50/40 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-600">
            {PTCB_DOMAINS[question.domain].name}
          </p>
          <p className="mt-3 text-lg font-semibold text-plum-950">{question.prompt}</p>

          <div className="mt-5 grid gap-3">
            {question.choices.map((choice, index) => {
              const isSelected = selectedIndex === index;
              const isCorrect = isRevealed && index === question.answerIndex;
              const isWrong = isRevealed && isSelected && index !== question.answerIndex;

              return (
                <button
                  key={`${question.id}-${choice}`}
                  type="button"
                  onClick={() => handleChoice(index)}
                  className={cx(
                    "rounded-[22px] border p-4 text-left text-sm transition",
                    isCorrect
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                      : isWrong
                        ? "border-rose-300 bg-rose-50 text-rose-900"
                        : isSelected
                          ? "border-rosebrand-400 bg-rosebrand-50 text-plum-950"
                          : "border-rosebrand-100 bg-white text-plum-950 hover:border-rosebrand-300",
                  )}
                >
                  <span className="font-semibold">{String.fromCharCode(65 + index)}.</span> {choice}
                </button>
              );
            })}
          </div>

          {!isExamMode && isRevealed ? (
            <div className="mt-5 space-y-3">
              <div className="rounded-[22px] bg-emerald-50 p-4 text-sm text-emerald-900">
                <strong>Why it is correct:</strong> {question.explanation}
              </div>
              <div className="grid gap-2">
                {question.choices.map((choice, index) => (
                  <div key={`${question.id}-explanation-${choice}`} className="rounded-[18px] bg-white p-3 text-sm text-rose-900/80">
                    <strong>{choice}</strong>:{" "}
                    {index === question.answerIndex ? question.explanation : question.incorrectExplanations[index]}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {!isExamMode ? (
              <Button tone="secondary" onClick={handleCheck} disabled={typeof selectedIndex !== "number" || isRevealed}>
                Check answer
              </Button>
            ) : null}
            <Button
              onClick={handleNext}
              disabled={!isExamMode && !isRevealed}
              className={!isExamMode ? "min-w-[132px]" : ""}
            >
              {activeSession.currentIndex === activeSession.questions.length - 1 ? "Submit session" : "Next question"}
            </Button>
          </div>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {activeSession.questions.map((item, index) => {
            const answered = typeof activeSession.answers[item.id] === "number";
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => patchSession({ currentIndex: index })}
                className={cx(
                  "flex h-10 min-w-10 items-center justify-center rounded-full border text-sm font-semibold",
                  index === activeSession.currentIndex
                    ? "border-rosebrand-600 bg-rosebrand-600 text-white"
                    : answered
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-rosebrand-100 bg-white text-rosebrand-700",
                )}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <TutorBox questionContext={question} />
        <ResultCard result={lastResult} />
      </div>
    </div>
  );
}

function FlashcardsSection({ appState, onReviewCard }) {
  const dueCards = getDueFlashcards(appState.flashcardProgress, 24);
  const card = dueCards[0];
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    setShowBack(false);
  }, [card?.id]);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Spaced repetition"
        title="Daily flashcard reps"
        description="These cards focus on top drugs, brand/generic links, controlled schedules, and sig codes. Ratings change the next review date."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[30px] border border-rosebrand-100 bg-white/95 p-6 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-500">Queue</p>
              <h3 className="mt-2 font-display text-3xl text-plum-950">{dueCards.length} cards due now</h3>
            </div>
            <Tag>{appState.progress.totalFlashcardsReviewed} reviewed</Tag>
          </div>

          {card ? (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowBack((value) => !value)}
                className="flex min-h-[280px] w-full flex-col justify-between rounded-[32px] border border-rosebrand-100 bg-gradient-to-br from-rosebrand-50 to-white p-6 text-left shadow-card transition hover:translate-y-[-1px]"
              >
                <div className="flex items-center justify-between gap-4">
                  <Tag>{card.domain}</Tag>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-500">
                    {showBack ? "Back" : "Front"}
                  </span>
                </div>
                <div>
                  <p className="font-display text-3xl leading-tight text-plum-950">{showBack ? card.back : card.front}</p>
                </div>
                <p className="text-sm text-rose-900/65">Tap card to flip</p>
              </button>

              <div className="mt-5 flex flex-wrap gap-3">
                {[
                  { id: "again", label: "Again", tone: "danger" },
                  { id: "hard", label: "Hard", tone: "warning" },
                  { id: "good", label: "Good", tone: "primary" },
                  { id: "easy", label: "Easy", tone: "success" },
                ].map((item) => (
                  <Button key={item.id} tone={item.tone} onClick={() => onReviewCard(card.id, item.id)} disabled={!showBack}>
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
              No cards are due right now. Great job. Come back later or work through a quiz while the next cards mature.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-rosebrand-100 bg-white/95 p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-500">How ratings work</p>
            <div className="mt-4 grid gap-3 text-sm text-rose-900/80">
              <p><strong>Again</strong> resets the card for tomorrow so you see it quickly.</p>
              <p><strong>Hard</strong> keeps it in the near future with a shorter interval.</p>
              <p><strong>Good</strong> grows the interval using the standard spaced-repetition curve.</p>
              <p><strong>Easy</strong> jumps farther out so you spend time where it matters most.</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-rosebrand-100 bg-white/95 p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-500">Card mix</p>
            <div className="mt-4 grid gap-3 text-sm text-rose-900/80">
              <p>{TOP_200_DRUGS.length} top-drug cards with class, indication, side effect, schedule, and pearl.</p>
              <p>120 reverse brand-generic cards for rapid recall.</p>
              <p>{CONTROLLED_SUBSTANCE_QUICK_LOOKUP.length} controlled-substance schedule cards.</p>
              <p>Sig-code cards for common PTCE abbreviations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DrugMasterySection({ onMarkTaskComplete }) {
  const [query, setQuery] = useState("");
  const { classGuides, highYieldTopics } = getLearningResources();
  const filteredDrugs = TOP_200_DRUGS.filter((drug) => {
    if (!query.trim()) {
      return true;
    }
    const haystack = `${drug.generic} ${drug.brand} ${drug.drugClass} ${drug.indication}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  }).slice(0, 40);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Medication engine"
        title="Drug mastery section"
        description="Search top drugs, study by class, and use short mnemonics that make recall faster under pressure."
        actions={<Button tone="secondary" onClick={() => onMarkTaskComplete("drug-mastery")}>Mark lesson done</Button>}
      />

      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-[28px] border border-rosebrand-100 bg-white/95 p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-500">Class mnemonics</p>
            <div className="mt-4 space-y-3">
              {classGuides.map((guide) => (
                <div key={guide.className} className="rounded-[20px] border border-rosebrand-100 bg-rosebrand-50/50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-plum-950">{guide.className}</p>
                    <Tag>{guide.pattern}</Tag>
                  </div>
                  <p className="mt-2 text-sm text-rose-900/75">{guide.examPearl}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-rosebrand-600">
                    Examples: {guide.examples.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-rosebrand-100 bg-white/95 p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-500">High-yield checklist</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {highYieldTopics.map((topic) => (
                <Tag key={topic}>{topic}</Tag>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-rosebrand-100 bg-white/95 p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-500">Searchable drug list</p>
              <h3 className="mt-2 font-display text-3xl text-plum-950">Top-drug quick reference</h3>
            </div>
            <input
              className="w-full max-w-sm rounded-full border border-rosebrand-200 bg-rosebrand-50/60 px-4 py-3 text-sm text-plum-950"
              placeholder="Search drug, brand, class, or use"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {filteredDrugs.map((drug) => (
              <div key={drug.id} className="rounded-[22px] border border-rosebrand-100 bg-rosebrand-50/40 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-plum-950">{drug.generic}</p>
                  <Tag>{drug.brand}</Tag>
                  {drug.schedule !== "None" ? <Tag className="bg-orange-100 text-orange-700">{drug.schedule}</Tag> : null}
                </div>
                <p className="mt-2 text-sm text-rose-900/80"><strong>Class:</strong> {drug.drugClass}</p>
                <p className="mt-1 text-sm text-rose-900/80"><strong>Use:</strong> {drug.indication}</p>
                <p className="mt-1 text-sm text-rose-900/80"><strong>Watch for:</strong> {drug.sideEffect}</p>
                <p className="mt-1 text-sm text-rose-900/80"><strong>Pearl:</strong> {drug.pearl}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-rosebrand-600">{drug.mnemonic}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressSection({ appState }) {
  const snapshot = buildDashboardSnapshot(appState);
  const roadmap = buildWeeklyRoadmap(appState);
  const latestSessions = appState.sessionHistory.slice().reverse().slice(0, 8);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Scoreboard"
        title="Progress dashboard"
        description="Track readiness, category mastery, streak, time studied, and the trend line from recent sessions."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Overall readiness" value={`${snapshot.readiness}%`} hint="Weighted by official exam percentages." />
        <Metric label="Predicted pass chance" value={`${estimatePassProbability(appState)}%`} hint="Based on mastery, mocks, streak, and review depth." />
        <Metric label="Questions answered" value={appState.progress.totalQuestionsAnswered} hint={`${appState.progress.totalCorrectAnswers} answered correctly`} />
        <Metric label="Flashcards reviewed" value={appState.progress.totalFlashcardsReviewed} hint={`${snapshot.dueCards} cards are currently due`} />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <div className="section-shell">
          <SectionHeading eyebrow="Mastery" title="Category health" description="Focus first on the lowest bars, especially if those domains carry high exam weight." />
          <div className="mt-5 space-y-4">
            {snapshot.masteryRows.map((row) => (
              <DomainRow key={row.id} row={row} />
            ))}
          </div>
        </div>

        <div className="section-shell">
          <SectionHeading eyebrow="Weakness engine" title="Topics that need another rep" description="These tags come from missed questions and drive the next daily plan automatically." />
          <div className="mt-5 flex flex-wrap gap-2">
            {snapshot.weakTopics.length ? (
              snapshot.weakTopics.map((topic) => (
                <Tag key={topic.topic}>{topic.topic} ({topic.misses} misses)</Tag>
              ))
            ) : (
              <p className="text-sm text-rose-900/70">No weak topics tracked yet. Start with the diagnostic or a daily quiz.</p>
            )}
          </div>

          <div className="mt-6 rounded-[24px] border border-rosebrand-100 bg-rosebrand-50/50 p-5">
            <p className="text-sm font-semibold text-plum-950">Suggested next month arc</p>
            <div className="mt-3 space-y-3 text-sm text-rose-900/75">
              {roadmap.slice(0, 4).map((step) => (
                <p key={step.week}>
                  <strong>{step.week}:</strong> {step.summary}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="section-shell">
        <SectionHeading eyebrow="History" title="Recent study sessions" description="Use this log to see how scores and pacing change as you keep practicing." />
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {latestSessions.length ? (
            latestSessions.map((session) => (
              <div key={session.id} className="rounded-[24px] border border-rosebrand-100 bg-white/95 p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-500">{session.type}</p>
                    <p className="mt-2 font-semibold text-plum-950">{session.title}</p>
                    <p className="mt-1 text-sm text-rose-900/70">{formatDate(session.completedAt)}</p>
                  </div>
                  <div className="rounded-[18px] bg-rosebrand-50 px-4 py-3 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-600">Score</p>
                    <p className="mt-1 font-display text-3xl text-rosebrand-700">{session.scorePercent}%</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {Object.entries(session.breakdown).map(([domain, info]) => (
                    <div key={`${session.id}-${domain}`} className="rounded-[18px] bg-rosebrand-50/50 p-3 text-sm text-rose-900/80">
                      <strong>{PTCB_DOMAINS[domain].shortName}:</strong> {info.correct}/{info.total}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-rose-900/70">Session history will appear here after your first quiz or exam.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function OnboardingModal({ onClose, onStartDiagnostic }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-plum-950/50 p-4 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-[36px] border border-white/60 bg-white p-6 shadow-glow sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Tag>First-time tutorial</Tag>
            <h2 className="mt-3 font-display text-4xl text-plum-950 sm:text-5xl">How to use PTCB Passport</h2>
            <p className="mt-3 max-w-3xl text-sm text-rose-900/75 sm:text-base">
              The goal is not random review. The app is designed to move you from "weak in everything" to confident, exam-ready recall by early July.
            </p>
          </div>
          <Button tone="ghost" onClick={onClose}>
            Skip for now
          </Button>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {ONBOARDING_STEPS.map((step, index) => (
            <div key={step.title} className="rounded-[28px] border border-rosebrand-100 bg-rosebrand-50/45 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-500">Step {index + 1}</p>
              <p className="mt-2 font-semibold text-plum-950">{step.title}</p>
              <p className="mt-2 text-sm text-rose-900/75">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-[30px] border border-rosebrand-100 bg-gradient-to-br from-rosebrand-50 to-orange-50 p-6">
          <p className="text-sm font-semibold text-plum-950">Recommended rhythm</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {STUDY_STRATEGY.map((item) => (
              <div key={item.title} className="rounded-[22px] bg-white/90 p-4 text-sm text-rose-900/75">
                <strong className="text-plum-950">{item.title}</strong>
                <p className="mt-2">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={onStartDiagnostic}>Start the diagnostic</Button>
          <Button tone="secondary" onClick={onClose}>
            I understand the system
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PtcbStudyApp() {
  const [appState, setAppState] = useState(createInitialState());
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedSection, setSelectedSection] = useState("dashboard");
  const [migrationMessage, setMigrationMessage] = useState("");
  const importInputRef = useRef(null);

  useEffect(() => {
    const loaded = loadStoredState(createInitialState());
    setAppState(loaded);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    saveStoredState(appState);
  }, [appState, isHydrated]);

  const activeSession = hydrateActiveSession(appState.activeSession);
  const latestResult = appState.sessionHistory.slice(-1)[0] ?? null;
  const dailyPlan = getDailyPlan(appState);

  function setSection(nextSection) {
    startTransition(() => setSelectedSection(nextSection));
  }

  function patchAppState(updater) {
    setAppState((current) => (typeof updater === "function" ? updater(current) : updater));
  }

  function markTaskComplete(taskId) {
    patchAppState((current) => toggleTaskCompletion(current, taskId, toDateKey(new Date())));
  }

  function handleLaunchTask(task) {
    if (task.type === "diagnostic") {
      handleStartSession("diagnostic");
      return;
    }
    if (task.type === "mock") {
      handleStartSession("mock");
      return;
    }
    if (task.type === "daily-quiz") {
      handleStartSession("daily-quiz");
      return;
    }
    if (task.type === "weakness-review") {
      handleStartSession("weakness-review");
      return;
    }
    if (task.type === "flashcards") {
      setSection("flashcards");
      return;
    }
    if (task.type === "drug-mastery") {
      setSection("drugs");
    }
  }

  function handleStartSession(type) {
    patchAppState((current) => {
      let nextSession;
      if (type === "diagnostic") {
        nextSession = createDiagnosticSession(current);
      } else if (type === "mock") {
        nextSession = createMockSession(current);
      } else if (type === "weakness-review") {
        nextSession = createWeaknessReviewSession(current);
      } else {
        nextSession = createDailyQuizSession(current);
      }

      return {
        ...current,
        activeSession: {
          ...nextSession,
          revealed: {},
        },
        ui: {
          ...current.ui,
          onboardingComplete: true,
          showTutorial: false,
        },
      };
    });
    setSection("practice");
  }

  function handleUpdateSession(nextSession) {
    const { questions, ...serializableSession } = nextSession;
    patchAppState((current) => ({
      ...current,
      activeSession: {
        ...current.activeSession,
        ...serializableSession,
      },
    }));
  }

  function handleSubmitSession() {
    if (!appState.activeSession) {
      return;
    }

    const result = gradeSession(appState.activeSession, appState.activeSession.answers, getSessionElapsedSec(appState.activeSession));

    patchAppState((current) => {
      let next = applySessionResult(current, result);

      const taskToMark =
        result.type === "diagnostic"
          ? "diagnostic"
          : result.type === "mock"
            ? "mock-exam"
            : result.type === "daily-quiz"
              ? "focus-quiz"
              : "weakness-review";

      next = toggleTaskCompletion(next, taskToMark, toDateKey(new Date()));
      return next;
    });
  }

  function handleReviewCard(cardId, rating) {
    patchAppState((current) => {
      const next = applyFlashcardReview(current, cardId, rating);
      return toggleTaskCompletion(next, "flashcards", toDateKey(new Date()));
    });
  }

  function dismissTutorial() {
    patchAppState((current) => ({
      ...current,
      ui: {
        ...current.ui,
        onboardingComplete: true,
        showTutorial: false,
      },
    }));
  }

  function handleExportData() {
    downloadJson(`ptcb-passport-backup-${toDateKey(new Date())}.json`, appState);
    setMigrationMessage("Study data exported. You can import this backup into another localhost port later.");
  }

  function handleOpenImport() {
    importInputRef.current?.click();
  }

  async function handleImportData(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      const merged = mergeStoredState(parsed, createInitialState());
      setAppState(merged);
      setMigrationMessage("Study data imported successfully.");
      setSelectedSection("dashboard");
    } catch (error) {
      setMigrationMessage(`Import failed: ${error.message}`);
    } finally {
      event.target.value = "";
    }
  }

  const showTutorial = isHydrated && appState.ui.showTutorial;

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-30 mb-6 rounded-[28px] border border-white/60 bg-white/85 px-4 py-3 shadow-card backdrop-blur-xl sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br from-rosebrand-600 via-fuchsia-500 to-orange-300 font-display text-2xl text-white shadow-glow">
                Rx
              </div>
              <div>
                <p className="font-display text-2xl text-plum-950 sm:text-3xl">PTCB Passport</p>
                <p className="text-sm text-rose-900/70">
                  {appState.profile.experience}. Exam target: {formatDate(appState.profile.examDate)}.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <nav className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {SECTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={cx(
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      selectedSection === item.id
                        ? "bg-rosebrand-600 text-white shadow-glow"
                        : "bg-rosebrand-50 text-rosebrand-700 hover:bg-rosebrand-100",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="flex flex-wrap gap-2">
                <Button tone="secondary" className="px-3 py-2 text-xs" onClick={handleExportData}>
                  Export data
                </Button>
                <Button tone="ghost" className="px-3 py-2 text-xs" onClick={handleOpenImport}>
                  Import data
                </Button>
              </div>
            </div>
          </div>
        </header>

        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImportData}
        />

        <main className="flex-1">
          {selectedSection === "dashboard" ? (
            <DashboardSection
              appState={appState}
              onTaskToggle={markTaskComplete}
              onTaskLaunch={handleLaunchTask}
              onStartDiagnostic={() => handleStartSession("diagnostic")}
              onOpenSection={setSection}
            />
          ) : null}

          {selectedSection === "practice" ? (
            <div className="space-y-8">
              {activeSession ? (
                <SessionRunner
                  activeSession={activeSession}
                  onUpdateSession={handleUpdateSession}
                  onSubmitSession={handleSubmitSession}
                  lastResult={latestResult}
                />
              ) : (
                <SessionLauncher appState={appState} onStart={handleStartSession} />
              )}

              {latestResult ? (
                <section className="section-shell">
                  <SectionHeading
                    eyebrow="Review"
                    title="Understand every answer"
                    description="Use this breakdown to learn why each correct answer is right and why the distractors are wrong."
                  />
                  <div className="mt-6">
                    <SessionReview result={latestResult} />
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}

          {selectedSection === "flashcards" ? <FlashcardsSection appState={appState} onReviewCard={handleReviewCard} /> : null}
          {selectedSection === "drugs" ? <DrugMasterySection onMarkTaskComplete={markTaskComplete} /> : null}
          {selectedSection === "progress" ? <ProgressSection appState={appState} /> : null}
        </main>

        <footer className="mt-10 rounded-[28px] border border-white/60 bg-white/85 px-5 py-4 text-sm text-rose-900/70 shadow-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p>
                Built for one learner using local storage only. Your progress, streak, plan completion, flashcard schedule, and exam history stay in this browser.
              </p>
              <p className="text-xs text-rose-900/60">
                Localhost note: browser data is scoped by port. Use Export/Import to move study data between `localhost:3000` and `localhost:3001`.
              </p>
              {migrationMessage ? <p className="text-xs font-semibold text-rosebrand-700">{migrationMessage}</p> : null}
            </div>
            <p>
              Today&apos;s tasks completed: {dailyPlan.completed.length}/{dailyPlan.tasks.length}
            </p>
          </div>
        </footer>
      </div>

      {showTutorial ? (
        <OnboardingModal onClose={dismissTutorial} onStartDiagnostic={() => handleStartSession("diagnostic")} />
      ) : null}
    </div>
  );
}
