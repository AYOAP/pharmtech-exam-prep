import { useEffect, useMemo, useRef, useState } from "react";
import { average, round } from "../../lib/utils";
import { Panel } from "../ui";

const TOTAL_TRIALS = 8;

function getAverageFromTrials(trials) {
  const valid = trials.filter((trial) => !trial.falseStart).map((trial) => trial.reactionMs);

  return {
    avgReactionMs: valid.length ? average(valid) : 1000,
    medianReactionMs: valid.length ? valid.slice().sort((left, right) => left - right)[Math.floor(valid.length / 2)] : 1000,
    validTrials: valid.length,
  };
}

export default function ReactionTimeTest({ onComplete }) {
  const [trialIndex, setTrialIndex] = useState(0);
  const [phase, setPhase] = useState("waiting");
  const [statusText, setStatusText] = useState("Wait for green.");
  const [trials, setTrials] = useState([]);
  const trialsRef = useRef([]);
  const readyAtRef = useRef(0);
  const waitTimerRef = useRef(null);
  const advanceTimerRef = useRef(null);
  const finishedRef = useRef(false);

  const completedCount = trials.length;

  useEffect(() => {
    if (finishedRef.current) {
      return undefined;
    }

    if (trialIndex >= TOTAL_TRIALS) {
      finishedRef.current = true;
      const computed = getAverageFromTrials(trialsRef.current);

      onComplete({
        trials: trialsRef.current,
        falseStarts: trialsRef.current.filter((trial) => trial.falseStart).length,
        ...computed,
      });

      return undefined;
    }

    setPhase("waiting");
    setStatusText("Wait for green.");

    waitTimerRef.current = window.setTimeout(() => {
      readyAtRef.current = performance.now();
      setPhase("ready");
      setStatusText("Click now.");
    }, 1100 + Math.random() * 1100);

    return () => {
      window.clearTimeout(waitTimerRef.current);
      window.clearTimeout(advanceTimerRef.current);
    };
  }, [onComplete, trialIndex]);

  const panelTone = useMemo(() => {
    if (phase === "ready") {
      return "from-emerald-400 via-emerald-500 to-teal-500";
    }

    if (phase === "feedback") {
      return "from-sky-400 via-sky-500 to-cyan-500";
    }

    return "from-amber-300 via-amber-400 to-orange-400";
  }, [phase]);

  function commitTrial(nextTrial) {
    setPhase("feedback");
    setTrials((current) => {
      const next = [...current, nextTrial];
      trialsRef.current = next;
      return next;
    });
    advanceTimerRef.current = window.setTimeout(() => {
      setTrialIndex((current) => current + 1);
    }, 650);
  }

  function handlePress() {
    if (phase === "waiting") {
      window.clearTimeout(waitTimerRef.current);
      setStatusText("Too early. False start.");
      commitTrial({
        falseStart: true,
        reactionMs: null,
      });
      return;
    }

    if (phase === "ready") {
      const reactionMs = performance.now() - readyAtRef.current;
      setStatusText(`${round(reactionMs)} ms`);
      commitTrial({
        falseStart: false,
        reactionMs,
      });
    }
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.code === "Space") {
        event.preventDefault();
        handlePress();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase]);

  return (
    <div className="space-y-5">
      <Panel className="bg-white/70 dark:bg-slate-950/40">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Trial progress
            </p>
            <h3 className="mt-2 font-display text-3xl font-bold text-slate-950 dark:text-white">
              {Math.min(completedCount + 1, TOTAL_TRIALS)} / {TOTAL_TRIALS}
            </h3>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
            Space bar also works
          </div>
        </div>
      </Panel>

      <button
        type="button"
        onClick={handlePress}
        className={`w-full rounded-[36px] bg-gradient-to-br ${panelTone} px-6 py-16 text-center text-white shadow-panel transition hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-sky-400/40 sm:py-24`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
          Simple reaction task
        </p>
        <p className="mt-6 font-display text-5xl font-bold sm:text-6xl">
          {phase === "ready" ? "GO" : phase === "feedback" ? "Logged" : "..." }
        </p>
        <p className="mt-4 text-base text-white/90">{statusText}</p>
      </button>
    </div>
  );
}
