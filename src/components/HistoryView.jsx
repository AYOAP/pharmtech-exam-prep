import { useMemo, useState } from "react";
import { TIME_OF_DAY_OPTIONS } from "../lib/constants";
import { formatRawMetric } from "../lib/scoring";
import { formatDate, formatDuration, formatTime } from "../lib/utils";
import { GhostButton, Panel, PrimaryButton, ScorePill, SectionHeading, SecondaryButton } from "./ui";

export default function HistoryView({
  sessions,
  onBack,
  onDeleteSession,
  onClearAll,
  onExportCsv,
  onSeedDemo,
}) {
  const [filter, setFilter] = useState("All");

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => filter === "All" || session.timeOfDay === filter);
  }, [filter, sessions]);

  return (
    <div className="mx-auto max-w-6xl animate-enter px-4 py-8 sm:px-6 lg:px-8">
      <Panel>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Test history"
            title="Every saved session, newest first"
            description="Review your saved runs, filter by time of day, export the dataset to CSV, or clean out old sessions."
          />

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950/50">
              <span className="text-slate-500 dark:text-slate-400">Filter</span>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="bg-transparent font-semibold text-slate-900 outline-none dark:text-white"
              >
                <option value="All">All</option>
                {TIME_OF_DAY_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.id}
                  </option>
                ))}
              </select>
            </label>

            <SecondaryButton onClick={onExportCsv} disabled={!sessions.length}>
              Export CSV
            </SecondaryButton>
            <GhostButton onClick={onSeedDemo}>Load demo data</GhostButton>
            <GhostButton
              onClick={() => {
                if (window.confirm("Delete all saved sessions from this browser?")) {
                  onClearAll();
                }
              }}
              className="text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
            >
              Clear all
            </GhostButton>
            <PrimaryButton onClick={onBack}>Back home</PrimaryButton>
          </div>
        </div>

        {!filteredSessions.length ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="font-display text-2xl font-bold text-slate-950 dark:text-white">
              No sessions match this filter
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Try another category, complete a new test, or seed demo sessions.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {filteredSessions.map((session) => (
              <article
                key={session.id}
                className="rounded-[28px] border border-slate-200/80 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <ScorePill label="Composite" value={session.compositeScore} tone="up" />
                      <ScorePill label="Time of day" value={session.timeOfDay} />
                      {session.source === "demo" ? <ScorePill label="Dataset" value="Demo" /> : null}
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
                        {formatDate(session.completedAt)}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formatTime(session.completedAt)} · {formatDuration(session.durationSec)}
                      </p>
                    </div>
                  </div>

                  <GhostButton
                    onClick={() => {
                      if (window.confirm("Delete this session?")) {
                        onDeleteSession(session.id);
                      }
                    }}
                    className="self-start text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
                  >
                    Delete
                  </GhostButton>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {Object.values(session.subtests).map((subtest) => (
                    <div
                      key={subtest.id}
                      className="rounded-[22px] border border-slate-200/80 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {subtest.shortLabel}
                        </p>
                        <span className="text-lg font-bold text-slate-950 dark:text-white">
                          {subtest.score}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {formatRawMetric(subtest)}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
