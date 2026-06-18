import { useEffect, useMemo, useRef, useState } from "react";
import { BATTERY_VERSION, TEST_DEFINITIONS } from "../lib/constants";
import { computeCompositeScore, scoreSubtest } from "../lib/scoring";
import { uniqueId } from "../lib/utils";
import { GhostButton, Panel, PrimaryButton, ProgressBar, ScorePill, SectionHeading } from "./ui";
import DigitSpanTest from "./tests/DigitSpanTest";
import ReactionTimeTest from "./tests/ReactionTimeTest";
import StroopTest from "./tests/StroopTest";
import SymbolCodingTest from "./tests/SymbolCodingTest";

function renderTestComponent(testId, onComplete) {
  if (testId === "reactionTime") {
    return <ReactionTimeTest onComplete={onComplete} />;
  }

  if (testId === "digitSpan") {
    return <DigitSpanTest onComplete={onComplete} />;
  }

  if (testId === "stroop") {
    return <StroopTest onComplete={onComplete} />;
  }

  if (testId === "symbolCoding") {
    return <SymbolCodingTest onComplete={onComplete} />;
  }

  return null;
}

export default function TestRunner({ timeOfDay, onCompleteSession, onExit }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState("intro");
  const [countdown, setCountdown] = useState(3);
  const [subtests, setSubtests] = useState({});
  const startedAtRef = useRef(new Date().toISOString());
  const completionGuardRef = useRef("");
  const currentTest = TEST_DEFINITIONS[stepIndex];
  const progressValue = ((stepIndex + (phase === "intro" ? 0 : 0.5)) / TEST_DEFINITIONS.length) * 100;

  useEffect(() => {
    if (phase !== "countdown") {
      return undefined;
    }

    setCountdown(3);
    let value = 3;

    const interval = window.setInterval(() => {
      value -= 1;

      if (value <= 0) {
        window.clearInterval(interval);
        setPhase("active");
      } else {
        setCountdown(value);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [phase]);

  const sequenceLabel = useMemo(
    () =>
      TEST_DEFINITIONS.map((test, index) => ({
        ...test,
        state:
          index < stepIndex ? "done" : index === stepIndex ? (phase === "intro" ? "current" : "live") : "upcoming",
      })),
    [phase, stepIndex],
  );

  function handleTestComplete(rawResult) {
    const testId = currentTest.id;
    const completionKey = `${stepIndex}-${testId}`;

    if (completionGuardRef.current === completionKey) {
      return;
    }

    completionGuardRef.current = completionKey;

    setSubtests((current) => {
      const next = {
        ...current,
        [testId]: scoreSubtest(testId, rawResult),
      };

      if (stepIndex === TEST_DEFINITIONS.length - 1) {
        const completedAt = new Date().toISOString();

        onCompleteSession({
          id: uniqueId(),
          batteryVersion: BATTERY_VERSION,
          timeOfDay,
          startedAt: startedAtRef.current,
          completedAt,
          durationSec: Math.max(
            1,
            Math.round((new Date(completedAt).getTime() - new Date(startedAtRef.current).getTime()) / 1000),
          ),
          subtests: next,
          compositeScore: computeCompositeScore(next),
        });
      } else {
        completionGuardRef.current = "";
        setStepIndex((currentStep) => currentStep + 1);
        setPhase("intro");
      }

      return next;
    });
  }

  return (
    <div className="mx-auto max-w-6xl animate-enter px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <Panel className="h-fit">
          <SectionHeading
            eyebrow="Test battery"
            title={`Test ${stepIndex + 1} of ${TEST_DEFINITIONS.length}`}
            description="The order stays fixed every session so your scores remain easier to compare over time."
          />

          <div className="mt-6">
            <ProgressBar value={progressValue} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <ScorePill label="Time label" value={timeOfDay} />
            <ScorePill label="Estimated total" value="~5 min" />
          </div>

          <div className="mt-8 space-y-3">
            {sequenceLabel.map((test, index) => (
              <div
                key={test.id}
                className={`rounded-[22px] border px-4 py-4 ${
                  test.state === "done"
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                    : test.state === "current" || test.state === "live"
                      ? "border-sky-200 bg-sky-50 dark:border-sky-500/30 dark:bg-sky-500/10"
                      : "border-slate-200 bg-white/50 dark:border-slate-800 dark:bg-slate-900/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {index + 1}. {test.dimension}
                    </p>
                    <p className="mt-1 font-semibold text-slate-950 dark:text-white">{test.title}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {test.durationLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <GhostButton
              onClick={() => {
                if (window.confirm("Exit the battery? Your current in-progress session will be discarded.")) {
                  onExit();
                }
              }}
            >
              Exit battery
            </GhostButton>
          </div>
        </Panel>

        <Panel className="min-h-[680px]">
          {phase === "intro" ? (
            <div className="flex h-full flex-col justify-between gap-8">
              <div>
                <SectionHeading
                  eyebrow={currentTest.dimension}
                  title={currentTest.title}
                  description={`${currentTest.durationLabel}. ${currentTest.dimension} is measured using the same task structure every session.`}
                />

                <div className="mt-8 space-y-4">
                  {currentTest.instructions.map((instruction) => (
                    <div
                      key={instruction}
                      className="rounded-[24px] border border-slate-200/80 bg-white/70 px-5 py-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200"
                    >
                      {instruction}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <PrimaryButton onClick={() => setPhase("countdown")}>
                  {stepIndex === 0 ? "Start battery" : "Continue"}
                </PrimaryButton>
              </div>
            </div>
          ) : null}

          {phase === "countdown" ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Starting {currentTest.title}
              </p>
              <p className="mt-6 font-display text-8xl font-bold text-slate-950 dark:text-white">{countdown}</p>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Settle in and respond as consistently as you can.
              </p>
            </div>
          ) : null}

          {phase === "active" ? (
            <div key={`${stepIndex}-${currentTest.id}`}>
              {renderTestComponent(currentTest.id, handleTestComplete)}
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
