import { useCallback, useMemo, useState } from "react";
import { AnnotationFeed } from "../../components/user/AnnotationFeed";
import { DashboardHero } from "../../components/user/DashboardHero";
import { OfflineStoragePanel } from "../../components/user/OfflineStoragePanel";
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

type ToastState = { variant: "success" | "error"; message: string };

/**
 * End User Dashboard (Group C – Screen 1).
 * Composition only: data comes from useDashboard(), every section is its own component.
 * Rendered inside the app shell (top bar, footer, mobile tab bar), which this page does not provide.
 */
export function Dashboard() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isOnline = useNetworkStatus();
  const { state, favouriteIds, reload, toggleFavourite, removeDownload } =
    useDashboard();
  const [toast, setToast] = useState<ToastState | null>(null);
  const closeToast = useCallback(() => setToast(null), []);

  const data = state.status === "ready" ? state.data : null;
  const offlineMaterialIds = useMemo<ReadonlySet<string>>(
    () =>
      new Set(
        (data?.offline.downloads ?? [])
          .filter((d) => d.status === "ready")
          .map((d) => d.material.id),
      ),
    [data],
  );

  const handleToggleFavourite = useCallback(
    async (materialId: string) => {
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
              message: "We couldn’t update your favourites. Please try again.",
            },
      );
    },
    [toggleFavourite],
  );

  const handleRemoveDownload = useCallback(
    async (downloadId: string) => {
      const result = await removeDownload(downloadId);
      setToast(
        result.ok
          ? {
              variant: "success",
              message: "Removed from your offline library.",
            }
          : {
              variant: "error",
              message: "We couldn’t remove that download. Please try again.",
            },
      );
      return result.ok;
    },
    [removeDownload],
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
              <Button variant="outline" size="sm" onClick={() => void reload()}>
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
              onToggleFavourite={(id) => void handleToggleFavourite(id)}
            />

            <div className="mt-8 space-y-8 lg:mt-0 lg:grid lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-10 lg:space-y-0">
              <AnnotationFeed
                annotations={data.annotations}
                isDesktop={isDesktop}
              />
              <OfflineStoragePanel
                downloads={data.offline.downloads}
                isDesktop={isDesktop}
                onRemove={handleRemoveDownload}
              />
            </div>

            {isDesktop && (
              <RecommendedSection
                materials={data.recommended}
                favouriteIds={favouriteIds}
                offlineMaterialIds={offlineMaterialIds}
                onToggleFavourite={(id) => void handleToggleFavourite(id)}
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
