import { useCallback, useMemo, useState } from "react";

import { AnnotationFeed } from "../../components/user/AnnotationFeed";
import { DashboardHero } from "../../components/user/DashboardHero";
import { ReadingShelf } from "../../components/user/ReadingShelf";
import { RecommendedSection } from "../../components/user/RecommendedSection";

import {
  Alert,
  Button,
  LoadingIndicator,
  OfflineIndicator,
  ToastNotification,
} from "../../components/user/sharedUi";

import { useDashboard } from "../../hooks/useDashboard";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";

type ToastState = {
  variant: "success" | "error";
  message: string;
};

/**
 * End User Dashboard (Group C – Screen 1).
 *
 * Composition only:
 * - Dashboard data comes from useDashboard().
 * - Individual sections are rendered by their own components.
 * - The application shell provides the top bar, footer and mobile navigation.
 */
export function Dashboard() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isOnline = useNetworkStatus();

  const { state, favouriteIds, reload, toggleFavourite } = useDashboard();

  const [toast, setToast] = useState<ToastState | null>(null);
  const [busyFavouriteIds, setBusyFavouriteIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  const data = state.status === "ready" ? state.data : null;

  const offlineMaterialIds = useMemo<ReadonlySet<string>>(
    () =>
      new Set(
        (data?.offline.downloads ?? [])
          .filter((download) => download.status === "ready")
          .map((download) => download.material.id),
      ),
    [data],
  );

  const handleToggleFavourite = useCallback(
    async (materialId: string) => {
      if (busyFavouriteIds.has(materialId)) {
        return;
      }

      setBusyFavouriteIds((previous) => {
        const next = new Set(previous);
        next.add(materialId);
        return next;
      });

      try {
        const result = await toggleFavourite(materialId);

        setToast(
          result.ok
            ? {
                variant: "success",
                message: result.favourite
                  ? "Added to your favourites."
                  : "Removed from your favourites.",
              }
            : {
                variant: "error",
                message:
                  "We couldn’t update your favourites. Please try again.",
              },
        );
      } catch {
        setToast({
          variant: "error",
          message: "We couldn’t update your favourites. Please try again.",
        });
      } finally {
        setBusyFavouriteIds((previous) => {
          const next = new Set(previous);
          next.delete(materialId);
          return next;
        });
      }
    },
    [busyFavouriteIds, toggleFavourite],
  );

  return (
    <div className="min-h-screen">
      <OfflineIndicator
        isOnline={isOnline}
        variant="banner"
        description="Showing what’s available on this device. Changes sync when you reconnect."
      />

      {state.status === "loading" && (
        <LoadingIndicator
          centered
          size="lg"
          label="Loading your library…"
          className="min-h-[50vh]"
        />
      )}

      {state.status === "error" && (
        <div className="mx-auto max-w-[720px] px-4 py-16">
          <Alert
            severity="error"
            title="We couldn’t load your dashboard"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void reload()}
              >
                Try again
              </Button>
            }
          >
            {isOnline
              ? state.message
              : "You’re offline. Connect to the internet to load your dashboard."}
          </Alert>
        </div>
      )}

      {data && (
        <>
          <DashboardHero data={data} isDesktop={isDesktop} />

          <div className="mx-auto w-full max-w-[1312px] pb-10 lg:space-y-14 lg:px-10 lg:py-12">
            <ReadingShelf
              isDesktop={isDesktop}
              shelf={data.shelf}
              favourites={data.favourites}
              bookmarked={data.bookmarked}
              counts={data.counts}
              favouriteIds={favouriteIds}
              offlineMaterialIds={offlineMaterialIds}
              onToggleFavourite={(id) => {
                void handleToggleFavourite(id);
              }}
            />

            <div className="mt-8 space-y-8 lg:mt-0 lg:grid lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-10 lg:space-y-0">
              <AnnotationFeed
                annotations={data.annotations}
                isDesktop={isDesktop}
              />

              <section className={isDesktop ? "rounded-xl border border-line bg-white p-5" : "mx-4 rounded-lg border border-line bg-white p-4"} aria-label="Offline library summary">
                <div className="flex items-start justify-between gap-4">
                  <div><h2 className="text-lg font-semibold text-deep">Offline Library</h2><p className="mt-1 text-sm text-muted">Materials saved on this device using Group D offline storage.</p></div>
                  <span className="rounded-full bg-mint px-3 py-1 text-sm font-semibold text-brand-text">{data.offline.downloads.length} saved</span>
                </div>
                <Button to="/offline-library" variant="outline" size="sm" className="mt-4">Manage offline materials</Button>
              </section>
            </div>

            {isDesktop && (
              <RecommendedSection
                materials={data.recommended}
                favouriteIds={favouriteIds}
                offlineMaterialIds={offlineMaterialIds}
                onToggleFavourite={(id) => {
                  void handleToggleFavourite(id);
                }}
              />
            )}
          </div>
        </>
      )}

      <ToastNotification
        open={toast !== null}
        variant={toast?.variant ?? "info"}
        message={toast?.message ?? ""}
        onClose={closeToast}
      />
    </div>
  );
}

export default Dashboard;
