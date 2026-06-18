import {
  getAverageByTimeOfDay,
  getAverageScore,
  getBestSession,
  getBestWorstTimeOfDay,
  getRecentScores,
  getRecentTrend,
} from "../lib/analytics";
import { formatDateTime } from "../lib/utils";
import { GhostButton, Panel, SectionHeading, StatCard } from "./ui";

function BarChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.averageScore), 1);

  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex h-56 items-end justify-between gap-3">
        {data.map((item) => (
          <div key={item.timeOfDay} className="flex flex-1 flex-col items-center gap-3">
            <div className="flex h-40 w-full items-end">
              <div
                className="w-full rounded-t-[18px] bg-gradient-to-t from-sky-500 via-cyan-500 to-emerald-400 transition-all"
                style={{
                  height: `${Math.max((item.averageScore / maxValue) * 100, item.count ? 10 : 2)}%`,
                  opacity: item.count ? 1 : 0.25,
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.timeOfDay}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {item.count ? `${item.averageScore} avg · ${item.count} sessions` : "No sessions"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Sparkline({ points }) {
  if (!points.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        Complete sessions to reveal your recent score trend.
      </div>
    );
  }

  const width = 420;
  const height = 140;
  const min = Math.min(...points.map((point) => point.score));
  const max = Math.max(...points.map((point) => point.score));
  const xStep = points.length === 1 ? width : width / (points.length - 1);

  const coordinates = points
    .map((point, index) => {
      const normalized = max === min ? 0.5 : (point.score - min) / (max - min);
      const x = index * xStep;
      const y = height - normalized * (height - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full">
        <defs>
          <linearGradient id="sparklineFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(14, 165, 233, 0.28)" />
            <stop offset="100%" stopColor="rgba(14, 165, 233, 0.02)" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coordinates}
        />
        {points.map((point, index) => {
          const normalized = max === min ? 0.5 : (point.score - min) / (max - min);
          const x = index * xStep;
          const y = height - normalized * (height - 20) - 10;

          return <circle key={point.id} cx={x} cy={y} r="4.5" fill="#0ea5e9" />;
        })}
      </svg>

      <div className="mt-2 flex justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        {points.map((point) => (
          <span key={point.id}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

export default function InsightsDashboard({ sessions, onSeedDemo }) {
  const averages = getAverageByTimeOfDay(sessions);
  const averageScore = getAverageScore(sessions);
  const { best, worst } = getBestWorstTimeOfDay(sessions);
  const bestSession = getBestSession(sessions);
  const trend = getRecentTrend(sessions);
  const recentScores = getRecentScores(sessions, 8);

  if (!sessions.length) {
    return (
      <Panel className="mt-10 animate-enter">
        <SectionHeading
          eyebrow="Insights so far"
          title="No sessions yet"
          description="Once you complete a few runs, this dashboard will highlight your best time of day, overall pace, and recent score trend."
        />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <GhostButton onClick={onSeedDemo}>Load demo dataset</GhostButton>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Demo data is optional and stored locally, just like real sessions.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-6 animate-enter">
      <Panel>
        <SectionHeading
          eyebrow="Insights so far"
          title="A compact view of your mental sharpness trends"
          description="The same four subtests run every time, so shifts here are easier to compare across mornings, evenings, and late-night sessions."
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Overall average"
            value={averageScore || "--"}
            hint={`${sessions.length} total sessions saved locally`}
            accent="sky"
          />
          <StatCard
            label="Best time of day"
            value={best ? best.timeOfDay : "--"}
            hint={best ? `${best.averageScore} average score` : "Complete sessions in a few windows"}
            accent="emerald"
          />
          <StatCard
            label="Lowest time of day"
            value={worst ? worst.timeOfDay : "--"}
            hint={worst ? `${worst.averageScore} average score` : "Need more labeled sessions"}
            accent="amber"
          />
          <StatCard
            label="Recent trend"
            value={trend.label}
            hint={trend.detail}
            accent="slate"
          />
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <SectionHeading
            eyebrow="By category"
            title="Average score by time of day"
            description="This makes it easy to see where you tend to perform best and where your scores dip."
          />
          <div className="mt-6">
            <BarChart data={averages} />
          </div>
        </Panel>

        <Panel>
          <SectionHeading
            eyebrow="Recent sessions"
            title="Short-term momentum"
            description="A lightweight sparkline of your most recent composite scores."
          />
          <div className="mt-6">
            <Sparkline points={recentScores} />
          </div>

          {bestSession ? (
            <div className="mt-6 rounded-[24px] border border-slate-200/80 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Best session ever
              </p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-3xl font-bold text-slate-950 dark:text-white">
                    {bestSession.compositeScore}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {bestSession.timeOfDay} · {formatDateTime(bestSession.completedAt)}
                  </p>
                </div>
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                  Peak session
                </div>
              </div>
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
