import { useEffect, useRef, useState } from "react";
import { STROOP_COLORS } from "../../lib/constants";
import { sample } from "../../lib/utils";
import { Panel } from "../ui";

const DURATION_SEC = 60;

function createPrompt(previousPrompt) {
  const word = sample(STROOP_COLORS);
  const fontColor =
    Math.random() < 0.75
      ? sample(STROOP_COLORS.filter((color) => color.id !== word.id))
      : sample(STROOP_COLORS);

  if (previousPrompt && previousPrompt.word.id === word.id && previousPrompt.fontColor.id === fontColor.id) {
    return createPrompt(null);
  }

  return { word, fontColor };
}

export default function StroopTest({ onComplete }) {
  const [prompt, setPrompt] = useState(() => createPrompt());
  const [remainingMs, setRemainingMs] = useState(DURATION_SEC * 1000);
  const [responses, setResponses] = useState([]);
  const responsesRef = useRef([]);
  const endTimeRef = useRef(0);
  const promptStartedAtRef = useRef(performance.now());
  const completedRef = useRef(false);

  useEffect(() => {
    endTimeRef.current = performance.now() + DURATION_SEC * 1000;

    const interval = window.setInterval(() => {
      const nextRemaining = Math.max(0, endTimeRef.current - performance.now());
      setRemainingMs(nextRemaining);

      if (nextRemaining <= 0 && !completedRef.current) {
        completedRef.current = true;
        window.clearInterval(interval);
        const finalResponses = responsesRef.current;
        const correct = finalResponses.filter((response) => response.isCorrect).length;
        const attempted = finalResponses.length;

        onComplete({
          responses: finalResponses,
          correct,
          incorrect: attempted - correct,
          attempted,
          accuracy: attempted ? correct / attempted : 0,
          meanReactionMs: attempted
            ? finalResponses.reduce((total, response) => total + response.reactionMs, 0) / attempted
            : 0,
          durationSec: DURATION_SEC,
        });
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [onComplete]);

  function handleChoice(colorId) {
    if (completedRef.current) {
      return;
    }

    const reactionMs = performance.now() - promptStartedAtRef.current;
    const isCorrect = colorId === prompt.fontColor.id;

    setResponses((current) => {
      const next = [...current, { reactionMs, isCorrect }];
      responsesRef.current = next;
      return next;
    });
    const nextPrompt = createPrompt(prompt);
    setPrompt(nextPrompt);
    promptStartedAtRef.current = performance.now();
  }

  return (
    <div className="space-y-5">
      <Panel className="bg-white/70 dark:bg-slate-950/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Time remaining
            </p>
            <h3 className="mt-2 font-display text-3xl font-bold text-slate-950 dark:text-white">
              {Math.ceil(remainingMs / 1000)}s
            </h3>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
            Choose the font color
          </div>
        </div>
      </Panel>

      <Panel className="rounded-[36px] bg-white/70 px-6 py-14 text-center dark:bg-slate-950/40 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          Ignore the word meaning
        </p>
        <p
          className="mt-8 font-display text-6xl font-bold sm:text-7xl"
          style={{ color: prompt.fontColor.hex }}
        >
          {prompt.word.label.toUpperCase()}
        </p>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        {STROOP_COLORS.map((color) => (
          <button
            key={color.id}
            type="button"
            onClick={() => handleChoice(color.id)}
            className="rounded-[24px] border border-slate-200 bg-white/75 px-5 py-5 text-left transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Choice
            </span>
            <span className="mt-3 block font-display text-3xl font-bold" style={{ color: color.hex }}>
              {color.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
