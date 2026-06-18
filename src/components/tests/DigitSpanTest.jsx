import { useEffect, useRef, useState } from "react";
import { randomInt } from "../../lib/utils";
import { Panel, PrimaryButton } from "../ui";

const ROUND_LENGTHS = [4, 4, 5, 5, 6, 6];

function createDigitSequence(length) {
  const digits = [];

  while (digits.length < length) {
    const next = randomInt(1, 9);
    if (digits[digits.length - 1] !== next) {
      digits.push(next);
    }
  }

  return digits;
}

export default function DigitSpanTest({ onComplete }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState("focus");
  const [displayValue, setDisplayValue] = useState("•");
  const [response, setResponse] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rounds, setRounds] = useState([]);
  const roundsRef = useRef([]);
  const sequenceRef = useRef([]);
  const timerRefs = useRef([]);
  const completedRef = useRef(false);

  useEffect(() => {
    if (roundIndex >= ROUND_LENGTHS.length && !completedRef.current) {
      completedRef.current = true;
      const finalRounds = roundsRef.current;
      const weightedCorrect = finalRounds.reduce(
        (total, round) => total + (round.isCorrect ? round.length : 0),
        0,
      );

      onComplete({
        rounds: finalRounds,
        correctRounds: finalRounds.filter((round) => round.isCorrect).length,
        weightedCorrect,
        maxWeighted: ROUND_LENGTHS.reduce((total, length) => total + length, 0),
        longestCorrectSpan: Math.max(
          0,
          ...finalRounds.filter((round) => round.isCorrect).map((round) => round.length),
        ),
      });
      return undefined;
    }

    const sequence = createDigitSequence(ROUND_LENGTHS[roundIndex]);
    sequenceRef.current = sequence;
    setResponse("");
    setFeedback("");
    setPhase("focus");
    setDisplayValue("•");

    timerRefs.current.forEach((timer) => window.clearTimeout(timer));
    timerRefs.current = [];

    timerRefs.current.push(
      window.setTimeout(() => {
        setPhase("showing");

        sequence.forEach((digit, index) => {
          timerRefs.current.push(
            window.setTimeout(() => {
              setDisplayValue(String(digit));
            }, index * 800),
          );
        });

        timerRefs.current.push(
          window.setTimeout(() => {
            setDisplayValue("?");
            setPhase("input");
          }, sequence.length * 800),
        );
      }, 700),
    );

    return () => {
      timerRefs.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, [onComplete, roundIndex]);

  function handleSubmit(event) {
    event.preventDefault();

    if (phase !== "input") {
      return;
    }

    const cleaned = response.replace(/\D/g, "");
    const expected = [...sequenceRef.current].reverse().join("");
    const isCorrect = cleaned === expected;
    const currentLength = ROUND_LENGTHS[roundIndex];

    setRounds((current) => {
      const next = [
        ...current,
        {
          length: currentLength,
          sequence: sequenceRef.current.join(""),
          expected,
          response: cleaned,
          isCorrect,
        },
      ];
      roundsRef.current = next;
      return next;
    });
    setFeedback(isCorrect ? "Correct." : `Expected ${expected}.`);
    setPhase("feedback");

    timerRefs.current.push(
      window.setTimeout(() => {
        setRoundIndex((current) => current + 1);
      }, 900),
    );
  }

  const expectedLength = ROUND_LENGTHS[roundIndex] || ROUND_LENGTHS[ROUND_LENGTHS.length - 1];

  return (
    <div className="space-y-5">
      <Panel className="bg-white/70 dark:bg-slate-950/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Round
            </p>
            <h3 className="mt-2 font-display text-3xl font-bold text-slate-950 dark:text-white">
              {roundIndex + 1} / {ROUND_LENGTHS.length}
            </h3>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
            Enter the digits in reverse order
          </div>
        </div>
      </Panel>

      <Panel className="rounded-[36px] bg-slate-950 px-6 py-12 text-center text-white dark:bg-white dark:text-slate-950 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-70">
          {phase === "focus" ? "Get ready" : phase === "showing" ? "Memorize" : "Recall"}
        </p>
        <p className="mt-6 font-display text-6xl font-bold sm:text-7xl">{displayValue}</p>
        <p className="mt-4 text-sm opacity-80">
          Sequence length: {expectedLength} digits
        </p>
      </Panel>

      <Panel className="bg-white/70 dark:bg-slate-950/40">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Type the sequence backwards
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoFocus={phase === "input"}
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              disabled={phase !== "input"}
              placeholder={phase === "input" ? "Example: 53821" : "Wait for the prompt"}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton type="submit" disabled={phase !== "input" || !response.trim()}>
              Submit response
            </PrimaryButton>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {feedback || "One attempt per round keeps the scoring repeatable."}
            </p>
          </div>
        </form>
      </Panel>
    </div>
  );
}
