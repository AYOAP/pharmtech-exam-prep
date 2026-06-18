export function cx(...values) {
  return values.filter(Boolean).join(" ");
}

export function Button({ children, className = "", tone = "primary", ...props }) {
  const tones = {
    primary:
      "bg-gradient-to-r from-rosebrand-500 to-fuchsia-500 text-white shadow-glow hover:brightness-105",
    secondary: "bg-white text-rosebrand-700 border border-rosebrand-200 hover:bg-rosebrand-50",
    ghost: "bg-transparent text-rosebrand-700 hover:bg-rosebrand-50",
    success: "bg-emerald-500 text-white hover:bg-emerald-600",
    warning: "bg-orange-400 text-white hover:bg-orange-500",
    danger: "bg-rose-500 text-white hover:bg-rose-600",
  };

  return (
    <button
      className={cx(
        "inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition duration-200",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ProgressBar({ value, className = "" }) {
  return (
    <div className={cx("h-3 overflow-hidden rounded-full bg-rosebrand-100", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-rosebrand-500 via-fuchsia-500 to-orange-300 transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Metric({ label, value, hint, className = "" }) {
  return (
    <div className={cx("metric-card", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosebrand-500">{label}</p>
      <p className="mt-2 font-display text-3xl text-plum-950">{value}</p>
      {hint ? <p className="mt-2 text-sm text-rose-900/70">{hint}</p> : null}
    </div>
  );
}

export function Tag({ children, className = "" }) {
  return <span className={cx("chip", className)}>{children}</span>;
}

export function SectionHeading({ eyebrow, title, description, actions = null }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow ? <p className="chip w-fit">{eyebrow}</p> : null}
        <h2 className="font-display text-3xl leading-tight text-plum-950 sm:text-4xl">{title}</h2>
        {description ? <p className="max-w-3xl text-sm text-rose-900/75 sm:text-base">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
