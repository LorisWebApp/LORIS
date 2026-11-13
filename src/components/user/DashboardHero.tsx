import { USER_ROUTES } from "../../config/userRoutes";
import type { DashboardData } from "../../types/userLibrary.types";
import { formatTimeAgo, pluralise } from "../../utils/libraryFormat";
import { ContinueReadingCard } from "./ContinueReadingCard";
import { DashboardStats } from "./DashboardStats";
import { Button, PageHeader, cx } from "./sharedUi";

export interface DashboardHeroProps {
  data: DashboardData;
  isDesktop: boolean;
}

/** Shown to a user who has not started reading anything yet. */
function StartReadingCard({ surface }: { surface: "on-dark" | "solid" }) {
  return (
    <section
      aria-label="Start reading"
      className={cx(
        "rounded-lg p-5 text-white",
        surface === "solid" ? "bg-ink" : "border border-white/15 bg-white/5",
      )}
    >
      <h2 className="m-0 font-serif text-[24px] font-medium leading-tight">
        Nothing in progress yet
      </h2>
      <p className="mt-1.5 text-[16px] text-white/70">
        Open a title from the catalogue and it will appear here so you can
        resume in one tap.
      </p>
      <Button to={USER_ROUTES.catalogue} tone="inverse" className="mt-4">
        Browse catalogue
      </Button>
    </section>
  );
}

export function DashboardHero({ data, isDesktop }: DashboardHeroProps) {
  const { user, stats, currentlyReading, lastSyncedAt } = data;

  if (!isDesktop) {
    return (
      <div className="space-y-4 px-4 pt-4">
        {currentlyReading ? (
          <ContinueReadingCard
            entry={currentlyReading}
            heading="Jump back in"
            resumeLabel="Resume"
            surface="solid"
          />
        ) : (
          <StartReadingCard surface="solid" />
        )}
        <DashboardStats stats={stats} surface="light" />
      </div>
    );
  }

  const active = stats.activeBooks;
  const offline = stats.offlineReady;
  const description =
    `You're currently exploring ${active} active ${pluralise(active, "manuscript")}. ` +
    (offline > 0
      ? `Your offline library holds ${offline} downloaded ${pluralise(offline, "title")} for uninterrupted research.`
      : "Download titles to keep reading without a connection.");

  return (
    <PageHeader
      tone="dark"
      size="md"
      className="px-10 py-12"
      eyebrow="— Your personal reading sanctuary"
      title={`Welcome back, ${user.firstName}.`}
      description={description}
      meta={<DashboardStats stats={stats} surface="dark" />}
      aside={
        <div className="w-[520px] max-w-full">
          <p className="mb-2 text-right text-[14px] text-white/65">
            {lastSyncedAt ? (
              <>
                Last synchronisation:{" "}
                <span className="font-semibold text-white">
                  {formatTimeAgo(lastSyncedAt)}
                </span>
              </>
            ) : (
              "Not synchronised yet"
            )}
          </p>
          {currentlyReading ? (
            <ContinueReadingCard
              entry={currentlyReading}
              heading="Currently reading"
              resumeLabel="Resume Reading"
              surface="on-dark"
            />
          ) : (
            <StartReadingCard surface="on-dark" />
          )}
        </div>
      }
    />
  );
}
