import { useMemo, useState } from "react";
import HistoryView from "./components/HistoryView";
import InsightsDashboard from "./components/InsightsDashboard";
import ResultsView from "./components/ResultsView";
import TestRunner from "./components/TestRunner";
import TimeOfDayPicker from "./components/TimeOfDayPicker";
import { GhostButton, Panel, PrimaryButton, SecondaryButton } from "./components/ui";
import { APP_SUBTITLE, APP_TITLE } from "./lib/constants";
import { exportSessionsAsCsv } from "./lib/analytics";
import { createDemoSessions } from "./lib/demoData";
import { clearAllSessions, deleteSessionById, loadSessions, persistSessions, addSession } from "./lib/storage";
import { downloadTextFile } from "./lib/utils";

function HomeView({ sessions, onStart, onOpenHistory, onSeedDemo }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Panel className="overflow-hidden p-0">
        <div className="grid gap-10 p-6 sm:p-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-8">
            <div className="inline-flex animate-float rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200">
              Personal cognitive tracking
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl font-display text-5xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-6xl">
                {APP_TITLE}
              </h1>
              <p className="max-w-2xl text-balance text-base text-slate-600 dark:text-slate-300 sm:text-lg">
                {APP_SUBTITLE}
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <PrimaryButton onClick={onStart} className="min-w-[170px] px-6 py-4 text-base">
                Start Test
              </PrimaryButton>
              <SecondaryButton onClick={onOpenHistory} className="min-w-[170px] px-6 py-4 text-base">
                Test History
              </SecondaryButton>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Everything runs client-side and stays in this browser’s localStorage.
            </p>
          </div>

          <div className="rounded-[32px] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
              Battery structure
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold">Same structure every session</h2>
            <div className="mt-6 space-y-3">
              {[
                "Reaction time",
                "Reverse digit span",
                "Stroop focus",
                "Symbol coding",
              ].map((label, index) => (
                <div key={label} className="flex items-center justify-between rounded-[22px] bg-white/5 px-4 py-4">
                  <span className="text-sm text-slate-300">Test {index + 1}</span>
                  <span className="font-semibold text-white">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-300">
                Prompts, sequences, and symbol mappings vary each session so the battery stays fresh
                enough for repeated personal tracking.
              </p>
            </div>

            {!sessions.length ? (
              <div className="mt-6">
                <GhostButton onClick={onSeedDemo} className="text-slate-200 hover:bg-white/10 hover:text-white">
                  Load demo dataset
                </GhostButton>
              </div>
            ) : null}
          </div>
        </div>
      </Panel>

      <div className="mt-10">
        <InsightsDashboard sessions={sessions} onSeedDemo={onSeedDemo} />
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState("");
  const [sessions, setSessions] = useState(() => loadSessions());
  const [latestSession, setLatestSession] = useState(null);

  const hasSessions = sessions.length > 0;

  const mergedDemoSessions = useMemo(() => {
    const demo = createDemoSessions();
    const existingIds = new Set(sessions.map((session) => session.id));
    return demo.filter((session) => !existingIds.has(session.id));
  }, [sessions]);

  function handleSeedDemo() {
    const next = persistSessions([...sessions, ...mergedDemoSessions]);
    setSessions(next);
  }

  function handleCompleteSession(session) {
    const next = addSession(session, sessions);
    setSessions(next);
    setLatestSession(session);
    setSelectedTimeOfDay("");
    setView("results");
  }

  function handleDeleteSession(sessionId) {
    const next = deleteSessionById(sessionId, sessions);
    setSessions(next);

    if (latestSession?.id === sessionId) {
      setLatestSession(null);
      setView("home");
    }
  }

  function handleClearAll() {
    const next = clearAllSessions();
    setSessions(next);
    setLatestSession(null);
    setView("home");
  }

  function handleExportCsv() {
    if (!hasSessions) {
      return;
    }

    const content = exportSessionsAsCsv(sessions);
    downloadTextFile("mental-sharpness-sessions.csv", content, "text/csv;charset=utf-8");
  }

  if (view === "select") {
    return (
      <TimeOfDayPicker
        selectedTimeOfDay={selectedTimeOfDay}
        onSelect={setSelectedTimeOfDay}
        onContinue={() => setView("test")}
        onBack={() => {
          setSelectedTimeOfDay("");
          setView("home");
        }}
      />
    );
  }

  if (view === "test") {
    return (
      <TestRunner
        timeOfDay={selectedTimeOfDay}
        onCompleteSession={handleCompleteSession}
        onExit={() => {
          setSelectedTimeOfDay("");
          setView("home");
        }}
      />
    );
  }

  if (view === "results" && latestSession) {
    return (
      <ResultsView
        session={latestSession}
        sessions={sessions}
        onGoHome={() => setView("home")}
        onViewHistory={() => setView("history")}
      />
    );
  }

  if (view === "history") {
    return (
      <HistoryView
        sessions={sessions}
        onBack={() => setView("home")}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAll}
        onExportCsv={handleExportCsv}
        onSeedDemo={handleSeedDemo}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-5 sm:px-6 lg:px-8">
        <div>
          <p className="font-display text-xl font-bold text-slate-950 dark:text-white">{APP_TITLE}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Single-page personal analytics tool</p>
        </div>
        <GhostButton onClick={() => setView("history")}>History</GhostButton>
      </header>

      <HomeView
        sessions={sessions}
        onStart={() => setView("select")}
        onOpenHistory={() => setView("history")}
        onSeedDemo={handleSeedDemo}
      />

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-2 text-sm text-slate-500 dark:text-slate-400 sm:px-6 lg:px-8">
        Use the same device and similar testing conditions whenever possible for cleaner trends.
      </footer>
    </div>
  );
}
