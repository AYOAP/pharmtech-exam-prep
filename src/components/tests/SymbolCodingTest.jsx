import { useEffect, useMemo, useRef, useState } from "react";
import { SYMBOL_SET } from "../../lib/constants";
import { randomInt, shuffle } from "../../lib/utils";
import { Panel } from "../ui";

const DURATION_SEC = 60;

function createMapping() {
  const shuffledSymbols = shuffle(SYMBOL_SET);
  return Object.fromEntries(shuffledSymbols.map((symbol, index) => [symbol, index + 1]));
}

function createPrompt(mapping) {
  const symbols = Object.keys(mapping);
  const symbol = symbols[randomInt(0, symbols.length - 1)];
  const correctAnswer = mapping[symbol];
  const distractors = shuffle(
    [1, 2, 3, 4, 5, 6].filter((value) => value !== correctAnswer),
  ).slice(0, 3);

  return {
    symbol,
    correctAnswer,
    choices: shuffle([correctAnswer, ...distractors]),
  };
}

export default function SymbolCodingTest({ onComplete }) {
  const mapping = useMemo(() => createMapping(), []);
  const [prompt, setPrompt] = useState(() => createPrompt(mapping));
  const [responses, setResponses] = useState([]);
  const [remainingMs, setRemainingMs] = useState(DURATION_SEC * 1000);
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
          mapping,
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
  }, [mapping, onComplete]);

  function handleChoice(value) {
    if (completedRef.current) {
      return;
    }

    const reactionMs = performance.now() - promptStartedAtRef.current;
    const isCorrect = value === prompt.correctAnswer;

    setResponses((current) => {
      const next = [...current, { reactionMs, isCorrect }];
      responsesRef.current = next;
      return next;
    });
    setPrompt(createPrompt(mapping));
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
            Use the key below
          </div>
        </div>
      </Panel>

      <Panel className="bg-white/70 dark:bg-slate-950/40">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Session key
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {Object.entries(mapping).map(([symbol, value]) => (
            <div
              key={symbol}
              className="rounded-[22px] border border-slate-200 bg-white/70 px-4 py-4 text-center dark:border-slate-800 dark:bg-slate-900/40"
            >
              <p className="font-display text-3xl font-bold text-slate-950 dark:text-white">{symbol}</p>
              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{value}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="rounded-[36px] bg-slate-950 px-6 py-14 text-center text-white dark:bg-white dark:text-slate-950 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-70">
          Match the symbol to its number
        </p>
        <p className="mt-8 font-display text-7xl font-bold sm:text-8xl">{prompt.symbol}</p>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        {prompt.choices.map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => handleChoice(choice)}
            className="rounded-[24px] border border-slate-200 bg-white/75 px-5 py-5 text-left transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Choice
            </span>
            <span className="mt-3 block font-display text-4xl font-bold text-slate-950 dark:text-white">
              {choice}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
