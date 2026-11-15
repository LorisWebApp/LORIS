import { Flame } from "lucide-react";

import type { DashboardStats as DashboardStatsData } from "../../types/userLibrary.types";

import { StatDisplay, cx } from "./sharedUi";

export interface DashboardStatsProps {
  stats: DashboardStatsData;

  /** dark = translucent tiles in the desktop hero; light = white mobile tiles. */
  surface: "dark" | "light";
}

const flame = <Flame size={14} className="text-amber-500" aria-hidden="true" />;

/** Ensures dashboard statistics are displayed as valid non-negative numbers. */
function safeValue(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/** Four headline statistics: books, annotations, offline titles and reading streak. */
export function DashboardStats({ stats, surface }: DashboardStatsProps) {
  const activeBooks = safeValue(stats.activeBooks);
  const notesAndQuotes = safeValue(stats.notesAndQuotes);
  const offlineReady = safeValue(stats.offlineReady);
  const readingStreakDays = safeValue(stats.readingStreakDays);

  if (surface === "dark") {
    const tile =
      "rounded-[4px] border border-white/15 bg-white/5 px-3 py-3 [&>p:first-child]:whitespace-nowrap [&>p:first-child]:text-[12px] [&>p:first-child]:tracking-[0.08em]";

    return (
      <div
        className="mt-2 grid max-w-[640px] grid-cols-2 gap-3 sm:grid-cols-4"
        aria-label="Your reading statistics"
      >
        <StatDisplay
          className={tile}
          tone="inverse"
          label="Active Books"
          value={activeBooks}
        />

        <StatDisplay
          className={tile}
          tone="inverse"
          label="Notes & Quotes"
          value={notesAndQuotes}
        />

        <StatDisplay
          className={tile}
          tone="inverse"
          label="Offline Ready"
          value={offlineReady}
          unit="titles"
        />

        <StatDisplay
          className={tile}
          tone="inverse"
          label="Reading Streak"
          value={readingStreakDays}
          unit={<>Days {flame}</>}
        />
      </div>
    );
  }

  const tile = cx(
    "rounded-lg border border-line bg-white px-2 py-3 text-center [&_p]:justify-center",
  );

  return (
    <div
      className="grid grid-cols-4 gap-2"
      aria-label="Your reading statistics"
    >
      <StatDisplay
        className={tile}
        label="Active"
        value={activeBooks}
        supporting="Books"
      />

      <StatDisplay
        className={tile}
        label="Notes"
        value={notesAndQuotes}
        supporting="Snippets"
      />

      <StatDisplay
        className={tile}
        label="Offline"
        value={offlineReady}
        supporting="Titles"
      />

      <StatDisplay
        className={tile}
        label="Streak"
        value={readingStreakDays}
        unit={flame}
        supporting="Days"
      />
    </div>
  );
}
