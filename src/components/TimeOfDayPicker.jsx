import { TIME_OF_DAY_OPTIONS } from "../lib/constants";
import { cn } from "../lib/utils";
import { GhostButton, Panel, PrimaryButton, SectionHeading } from "./ui";

export default function TimeOfDayPicker({
  selectedTimeOfDay,
  onSelect,
  onContinue,
  onBack,
}) {
  return (
    <div className="mx-auto max-w-5xl animate-enter px-4 py-8 sm:px-6 lg:px-8">
      <Panel className="overflow-hidden p-0">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <SectionHeading
              eyebrow="Step 1"
              title="Choose the time-of-day label for this session"
              description="Keeping this label consistent makes the comparison charts much more useful over time."
            />

            <div className="grid gap-3 sm:grid-cols-2">
              {TIME_OF_DAY_OPTIONS.map((option) => {
                const isSelected = selectedTimeOfDay === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onSelect(option.id)}
                    className={cn(
                      "rounded-[24px] border p-5 text-left transition duration-200",
                      isSelected
                        ? "border-sky-500 bg-sky-500/8 shadow-panel"
                        : "border-slate-200 bg-white/70 hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700",
                    )}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {option.windowLabel}
                    </p>
                    <p className="mt-3 font-display text-2xl font-bold text-slate-950 dark:text-white">
                      {option.label}
                    </p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
              Session setup
            </p>
            <h3 className="mt-3 font-display text-3xl font-bold">Fixed order. Fresh prompts.</h3>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Every session uses the same four test types in the same order so your scores stay
              comparable. The exact prompts, mappings, and item sequences change to reduce answer
              memorization.
            </p>

            <div className="mt-6 space-y-3 rounded-[24px] bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Estimated time</span>
                <span className="font-semibold text-white">About 5 minutes</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Data storage</span>
                <span className="font-semibold text-white">Local browser only</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Current label</span>
                <span className="font-semibold text-white">
                  {selectedTimeOfDay || "Choose one to continue"}
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryButton onClick={onContinue} disabled={!selectedTimeOfDay} className="bg-white text-slate-950 hover:bg-slate-100">
                Begin battery
              </PrimaryButton>
              <GhostButton onClick={onBack} className="text-slate-200 hover:bg-white/10 hover:text-white">
                Back
              </GhostButton>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
