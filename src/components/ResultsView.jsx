import { buildSessionSummary, getAverageScore } from "../lib/analytics";
import { formatRawMetric } from "../lib/scoring";
import { formatDateTime, formatDuration, round } from "../lib/utils";
import { Panel, PrimaryButton, ScorePill, SectionHeading, SecondaryButton } from "./ui";

export default function ResultsView({ session, sessions, onGoHome, onViewHistory }) {
  const priorSessions = sessions.filter((candidate) => candidate.id !== session.id);
  const priorAverage = getAverageScore(priorSessions);
  const delta = priorSessions.length ? round(session.compositeScore - priorAverage) : 0;
  const summaryLines = buildSessionSummary(session, sessions);

  return (
    <div className="mx-auto max-w-6xl animate-enter px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel className="overflow-hidden">
          <SectionHeading
            eyebrow="Session complete"
            title="Your mental sharpness snapshot"
            description="Each subtest is converted to a 0 to 100 component score, then combined into one composite score using fixed weights."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-[0.55fr_0.45fr]">
            <div className="rounded-[28px] bg-slate-950 p-6 text-white dark:bg-white dark:text-slate-950">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-70">
                Mental Sharpness Score
              </p>
              <p className="mt-4 font-display text-6xl font-bold">{session.compositeScore}</p>
              <p className="mt-4 text-sm opacity-80">
                {priorSessions.length
                  ? `${delta >= 0 ? "+" : ""}${delta} vs. your average of ${priorAverage}`
                  : "This first session becomes your personal baseline."}
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200/80 bg-white/60 p-6 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="space-y-3">
                <ScorePill label="Time of day" value={session.timeOfDay} />
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Completed {formatDateTime(session.completedAt)}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Total duration {formatDuration(session.durationSec)}
                </p>
              </div>

              <div className="mt-6 space-y-2">
                {summaryLines.map((line) => (
                  <p key={line} className="rounded-2xl bg-slate-100/80 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {Object.values(session.subtests).map((subtest) => (
              <div
                key={subtest.id}
                className="rounded-[24px] border border-slate-200/80 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {subtest.dimension}
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-bold text-slate-950 dark:text-white">
                      {subtest.title}
                    </h3>
                  </div>
                  <div className="rounded-full bg-sky-100 px-3 py-2 text-lg font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
                    {subtest.score}
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                  {formatRawMetric(subtest)}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionHeading
            eyebrow="What next"
            title="Build a better baseline"
            description="Consistency matters more than absolute numbers. Try taking the battery at roughly similar times and conditions for cleaner comparisons."
          />

          <div className="mt-6 space-y-4 rounded-[28px] border border-slate-200/80 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Practical tips:
            </p>
            <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
              <li>Use the same device when possible, especially for reaction-time consistency.</li>
              <li>Try to avoid interruptions midway through the battery.</li>
              <li>Session-to-session trends are more informative than any one score.</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryButton onClick={onGoHome}>Back home</PrimaryButton>
            <SecondaryButton onClick={onViewHistory}>Open history</SecondaryButton>
          </div>
        </Panel>
      </div>
    </div>
  );
}
