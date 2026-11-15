import { CloudOff, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { buildMaterialEntry } from "../../components/user/materialEntries";

import {
  Alert,
  Button,
  ConfirmationDialog,
  EmptyState,
  LoadingIndicator,
  MaterialList,
  OfflineIndicator,
  PageHeader,
  ProgressIndicator,
  SectionHeader,
  StatDisplay,
  StatusBadge,
  ToastNotification,
} from "../../components/user/sharedUi";

import { USER_ROUTES } from "../../config/userRoutes";
import { useOfflineLibrary } from "../../hooks/useOfflineLibrary";

import type { ActionResult } from "../../types/reader.types";

import { daysUntil, formatBytes } from "../../utils/libraryFormat";

type Confirmation =
  | { kind: "one"; id: string; title: string }
  | { kind: "all" }
  | null;

/** Offline Library (Group C – Screen 4). Route: /user/offline */
export function OfflineLibrary() {
  const offline = useOfflineLibrary();

  const [toast, setToast] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);

  const [confirm, setConfirm] = useState<Confirmation>(null);
  const [busy, setBusy] = useState(false);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  const report = useCallback((result: ActionResult) => {
    setToast({
      variant: result.ok ? "success" : "error",
      message: result.message,
    });
  }, []);

  const readyCount = useMemo(
    () => offline.items.filter((item) => item.status === "ready").length,
    [offline.items],
  );

  const percentageUsed =
    offline.allocationBytes > 0
      ? Math.min(
          100,
          Math.round((offline.usedBytes / offline.allocationBytes) * 100),
        )
      : 0;

  const nextExpiryDays = useMemo(() => {
    if (!offline.nextExpiry) return null;

    const expiryDate = new Date(offline.nextExpiry);

    if (Number.isNaN(expiryDate.getTime())) {
      return null;
    }

    return Math.max(0, daysUntil(expiryDate.toISOString()));
  }, [offline.nextExpiry]);

  const tile = "rounded-[4px] border border-white/15 bg-white/5 px-3 py-3";

  /**
   * Handles confirmed removal of one or all downloads.
   */
  const runConfirm = async () => {
    if (!confirm || busy) return;

    setBusy(true);

    try {
      const result =
        confirm.kind === "all"
          ? await offline.clearAll()
          : await offline.remove(confirm.id);

      report(result);

      if (result.ok) {
        setConfirm(null);
      }
    } catch {
      setToast({
        variant: "error",
        message: "The offline storage action failed. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  /**
   * Updates an individual download preference.
   */
  const toggle = (
    label: string,
    checked: boolean,
    onChange: (value: boolean) => void,
  ) => (
    <label className="flex cursor-pointer items-center gap-3 py-2 text-[16px] text-deep">
      <input
        type="checkbox"
        className="size-4 accent-[var(--color-brand,#0f766e)]"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />

      {label}
    </label>
  );

  return (
    <div className="min-h-screen">
      <OfflineIndicator
        isOnline={offline.online}
        variant="banner"
        description="You can still read everything downloaded to this device."
      />

      <PageHeader
        tone="dark"
        size="md"
        className="px-4 py-10 lg:px-10"
        eyebrow="— Read anywhere"
        title="Offline Library"
        description="Titles saved encrypted on this device. Access renews whenever you sign in online."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              tone="inverse"
              leftIcon={<RefreshCw size={16} aria-hidden />}
              disabled={!offline.online || offline.syncing}
              onClick={async () => report(await offline.syncNow())}
            >
              {offline.syncing
                ? "Syncing…"
                : `Sync now${offline.pending ? ` (${offline.pending})` : ""}`}
            </Button>

            <Button
              variant="outline"
              tone="inverse"
              leftIcon={<Trash2 size={16} aria-hidden />}
              disabled={offline.items.length === 0 || busy}
              onClick={() => setConfirm({ kind: "all" })}
            >
              Clear offline storage
            </Button>
          </div>
        }
        meta={
          <div className="mt-2 grid max-w-[640px] grid-cols-2 gap-3 sm:grid-cols-4">
            <StatDisplay
              className={tile}
              tone="inverse"
              label="Ready"
              value={readyCount}
            />

            <StatDisplay
              className={tile}
              tone="inverse"
              label="Storage used"
              value={formatBytes(offline.usedBytes)}
            />

            <StatDisplay
              className={tile}
              tone="inverse"
              label="Pending sync"
              value={offline.pending}
            />

            <StatDisplay
              className={tile}
              tone="inverse"
              label="Next expiry"
              value={nextExpiryDays !== null ? `${nextExpiryDays}d` : "—"}
            />
          </div>
        }
      />

      <div className="mx-auto w-full max-w-[1312px] px-4 py-8 lg:px-10">
        {offline.storageError && (
          <Alert
            severity="error"
            title="Offline storage problem"
            className="mb-6"
          >
            {offline.storageError}
          </Alert>
        )}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Downloaded materials */}
          <section aria-label="Downloaded titles">
            <SectionHeader title="On this device" size="sm" as="h2" divider />

            {offline.loading ? (
              <LoadingIndicator centered label="Reading offline storage…" />
            ) : (
              <MaterialList
                aria-label="Offline materials"
                layout="grid"
                columns={2}
                framed
                emptyState={
                  <EmptyState
                    icon={<CloudOff size={32} />}
                    title="Nothing downloaded yet"
                    description="Download a title below to read it without a connection."
                  />
                }
                materials={offline.items.map((item) => {
                  const entry = buildMaterialEntry(item.material, {
                    layout: "card",
                    variant: "shelf",
                    isFavourite: false,
                    isOffline: item.status === "ready",
                    onToggleFavourite: () => undefined,
                  });

                  return {
                    ...entry,
                    actions: (
                      <div className="w-full space-y-2">
                        {item.status === "downloading" && (
                          <ProgressIndicator
                            size="sm"
                            value={item.progress ?? 0}
                            label="Downloading"
                          />
                        )}

                        {item.status === "failed" && (
                          <Alert severity="error" title="Download failed">
                            {item.error}
                          </Alert>
                        )}

                        {item.status === "expired" && (
                          <StatusBadge
                            variant="warning"
                            label="Access expired"
                          />
                        )}

                        {item.status === "ready" && item.expiresAt && (
                          <p className="m-0 text-[14px] text-muted">
                            {formatBytes(item.sizeBytes)}
                            {" · expires in "}
                            {Math.max(0, daysUntil(item.expiresAt))}
                            {" days"}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {item.status === "ready" && (
                            <Button
                              size="sm"
                              to={USER_ROUTES.reader(item.material.id)}
                            >
                              Read
                            </Button>
                          )}

                          {item.status === "expired" && (
                            <Button
                              size="sm"
                              disabled={!offline.online}
                              onClick={async () =>
                                report(await offline.syncNow())
                              }
                            >
                              Renew
                            </Button>
                          )}

                          {item.status === "failed" && (
                            <>
                              <Button
                                size="sm"
                                disabled={!offline.online}
                                onClick={async () =>
                                  report(await offline.download(item.material))
                                }
                              >
                                Retry
                              </Button>

                              <Button
                                size="sm"
                                variant="text"
                                onClick={() =>
                                  offline.dismissFailed(item.material.id)
                                }
                              >
                                Dismiss
                              </Button>
                            </>
                          )}

                          {item.status !== "downloading" &&
                            item.status !== "failed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setConfirm({
                                    kind: "one",
                                    id: item.material.id,
                                    title: item.material.title,
                                  })
                                }
                              >
                                Remove
                              </Button>
                            )}
                        </div>
                      </div>
                    ),
                  };
                })}
              />
            )}

            {/* Available downloads */}
            <SectionHeader
              className="mt-10"
              title="Available to download"
              size="sm"
              as="h2"
              divider
            />

            {offline.candidates.length === 0 ? (
              <p className="mt-4 text-[15px] text-muted">
                Your favourites are all downloaded.
              </p>
            ) : (
              <ul className="m-0 list-none divide-y divide-line p-0">
                {offline.candidates.map((material) => (
                  <li
                    key={material.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[16px] font-semibold text-deep">
                        {material.title}
                      </span>

                      <span className="text-[14px] text-muted">
                        {material.author}
                        {material.fileSizeBytes
                          ? ` · ${formatBytes(material.fileSizeBytes)}`
                          : ""}
                      </span>
                    </span>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!offline.online}
                      onClick={async () =>
                        report(await offline.download(material))
                      }
                    >
                      Download
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Storage and download policy */}
          <aside aria-label="Storage and policy">
            <SectionHeader title="Storage" size="sm" as="h2" divider />

            <div className="mt-4">
              <ProgressIndicator
                value={percentageUsed}
                label={`${formatBytes(offline.usedBytes)} of ${formatBytes(offline.allocationBytes)}`}
              />
            </div>

            <SectionHeader
              className="mt-8"
              title="Download policy"
              size="sm"
              as="h2"
              divider
            />

            {toggle(
              "Auto-download new favourites",
              offline.prefs.autoDownload,
              (value) => offline.updatePrefs({ autoDownload: value }),
            )}

            {toggle("Only download on Wi-Fi", offline.prefs.wifiOnly, (value) =>
              offline.updatePrefs({ wifiOnly: value }),
            )}

            <p className="mt-4 text-[14px] text-muted">
              Files are encrypted on this device and need a periodic online
              check-in to stay readable.
            </p>
          </aside>
        </div>
      </div>

      {/* Removal confirmation */}
      <ConfirmationDialog
        open={confirm !== null}
        tone="danger"
        loading={busy}
        confirmLabel={confirm?.kind === "all" ? "Clear everything" : "Remove"}
        title={
          confirm?.kind === "all"
            ? "Clear all offline storage?"
            : "Remove from this device?"
        }
        description={
          confirm?.kind === "all"
            ? "All downloaded titles will be removed from this device. Pending changes waiting to sync will be kept."
            : confirm?.kind === "one"
              ? `“${confirm.title}” will be deleted from this device. You can download it again later.`
              : ""
        }
        onConfirm={() => void runConfirm()}
        onCancel={() => {
          if (!busy) {
            setConfirm(null);
          }
        }}
      />

      {/* Feedback */}
      <ToastNotification
        open={toast !== null}
        variant={toast?.variant ?? "info"}
        message={toast?.message ?? ""}
        onClose={closeToast}
      />
    </div>
  );
}

export default OfflineLibrary;
