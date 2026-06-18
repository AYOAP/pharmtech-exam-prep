import { cn } from "../lib/utils";

export function Panel({ className, children }) {
  return <section className={cn("glass-panel rounded-[28px] p-5 sm:p-6", className)}>{children}</section>;
}

export function PrimaryButton({ className, children, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ className, children, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-slate-600",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ className, children, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function StatCard({ label, value, hint, accent = "slate" }) {
  const accents = {
    slate: "from-slate-100 to-white dark:from-slate-800 dark:to-slate-900",
    amber: "from-amber-50 to-white dark:from-amber-500/10 dark:to-slate-900",
    sky: "from-sky-50 to-white dark:from-sky-500/10 dark:to-slate-900",
    emerald: "from-emerald-50 to-white dark:from-emerald-500/10 dark:to-slate-900",
  };

  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200 bg-gradient-to-br p-5 dark:border-slate-800",
        accents[accent],
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl font-bold text-slate-950 dark:text-white">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{hint}</p> : null}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description, align = "left" }) {
  return (
    <div className={cn("space-y-2", align === "center" && "text-center")}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">{description}</p>
      ) : null}
    </div>
  );
}

export function ScorePill({ label, value, tone = "default" }) {
  const tones = {
    default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    up: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
    down: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  };

  return (
    <div className={cn("rounded-full px-3 py-1 text-xs font-semibold", tones[tone])}>
      {label}: {value}
    </div>
  );
}

export function ProgressBar({ value }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800">
      <div
        className="h-full rounded-full bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
