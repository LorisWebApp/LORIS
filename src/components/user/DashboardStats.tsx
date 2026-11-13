import { Flame } from "lucide-react";
import type { DashboardStats as DashboardStatsData } from "../../types/userLibrary.types";
import { StatDisplay, cx } from "./sharedUi";

export interface DashboardStatsProps {
  stats: DashboardStatsData;
  /** `dark` = translucent tiles inside the hero band (desktop); `light` = white tiles (mobile). */
  surface: "dark" | "light";
}

const flame = <Flame size={14} className="text-amber-500" aria-hidden />;

/** Four headline numbers: active books, notes & quotes, offline-ready titles and reading streak. */
export function DashboardStats({ stats, surface }: DashboardStatsProps) {
  if (surface === "dark") {
    // Labels stay on one line so the four tiles line up.
    const tile =
      "rounded-[4px] border border-white/15 bg-white/5 px-3 py-3 [&>p:first-child]:whitespace-nowrap [&>p:first-child]:text-[12px] [&>p:first-child]:tracking-[0.08em]";
    return (
      <div className="mt-2 grid max-w-[640px] grid-cols-2 gap-3 sm:grid-cols-4">
        <StatDisplay
          className={tile}
          tone="inverse"
          label="Active Books"
          value={stats.activeBooks}
        />
        <StatDisplay
          className={tile}
          tone="inverse"
          label="Notes & Quotes"
          value={stats.notesAndQuotes}
        />
        <StatDisplay
          className={tile}
          tone="inverse"
          label="Offline Ready"
          value={stats.offlineReady}
          unit="titles"
        />
        <StatDisplay
          className={tile}
          tone="inverse"
          label="Reading Streak"
          value={stats.readingStreakDays}
          unit={<>Days {flame}</>}
        />
      </div>
    );
  }

  const tile = cx(
    "rounded-lg border border-line bg-white px-2 py-3 text-center [&_p]:justify-center",
  );
  return (
    <div className="grid grid-cols-4 gap-2">
      <StatDisplay
        className={tile}
        label="Active"
        value={stats.activeBooks}
        supporting="Books"
      />
      <StatDisplay
        className={tile}
        label="Notes"
        value={stats.notesAndQuotes}
        supporting="Snippets"
      />
      <StatDisplay
        className={tile}
        label="Offline"
        value={stats.offlineReady}
        supporting="Titles"
      />
      <StatDisplay
        className={tile}
        label="Streak"
        value={stats.readingStreakDays}
        unit={flame}
        supporting="Days"
      />
    </div>
  );
}
