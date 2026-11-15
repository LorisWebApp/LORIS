import { useState } from "react";
import { Trash2 } from "lucide-react";

import {
  OFFLINE_EXPIRY_WARNING_DAYS,
  OFFLINE_STORAGE_ALLOCATION_BYTES,
} from "../../config/offlinePolicy";

import { USER_ROUTES } from "../../config/userRoutes";

import type { OfflineDownloadSummary } from "../../types/userLibrary.types";

import { daysUntil, formatBytes, pluralise } from "../../utils/libraryFormat";

import {
  Button,
  ConfirmationDialog,
  ProgressIndicator,
  SectionHeader,
  StatusBadge,
  type StatusVariant,
} from "./sharedUi";

export interface OfflineStoragePanelProps {
  downloads: OfflineDownloadSummary[];
  isDesktop: boolean;

  /** Resolves true when the copy was removed. */
  onRemove: (downloadId: string) => Promise<boolean>;
}

const VISIBLE_ROWS = 3;

function describeExpiry(download: OfflineDownloadSummary): {
  text: string;
  badge?: {
    label: string;
    variant: StatusVariant;
  };
} {
  if (download.status === "expired") {
    return {
      text: "Expired – reconnect to renew",
      badge: {
        label: "Expired",
        variant: "danger",
      },
    };
  }

  if (download.status === "failed") {
    return {
      text: "Download failed",
      badge: {
        label: "Failed",
        variant: "danger",
      },
    };
  }

  if (download.status === "downloading") {
    return {
      text: "Downloading…",
      badge: {
        label: "Downloading",
        variant: "info",
      },
    };
  }

  if (!download.expiresAt) {
    return {
      text: "No expiry",
    };
  }

  const days = daysUntil(download.expiresAt);

  if (days <= 0) {
    return {
      text: "Expires today",
      badge: {
        label: "Expiring soon",
        variant: "warning",
      },
    };
  }

  const text = `Expires in ${days} ${pluralise(days, "day")}`;

  return days <= OFFLINE_EXPIRY_WARNING_DAYS
    ? {
        text,
        badge: {
          label: "Expiring soon",
          variant: "warning",
        },
      }
    : {
        text,
      };
}

/** Offline storage summary with download management and removal confirmation. */
export function OfflineStoragePanel({
  downloads,
  isDesktop,
  onRemove,
}: OfflineStoragePanelProps) {
  const [pending, setPending] = useState<OfflineDownloadSummary | null>(null);

  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");

  const allocation = Math.max(0, OFFLINE_STORAGE_ALLOCATION_BYTES);

  const usedBytes = downloads
    .filter((download) => download.status !== "failed")
    .reduce((total, download) => {
      const size = Number(download.sizeBytes);

      if (!Number.isFinite(size) || size <= 0) {
        return total;
      }

      return total + size;
    }, 0);

  const percentUsed =
    allocation > 0
      ? Math.min(100, Math.round((usedBytes / allocation) * 100))
      : 0;

  const confirmRemove = async () => {
    if (!pending || removing) {
      return;
    }

    setRemoving(true);
    setRemoveError("");

    try {
      const removed = await onRemove(pending.id);

      if (!removed) {
        setRemoveError(
          `Could not remove "${pending.material.title}". Please try again.`,
        );
      }
    } catch {
      setRemoveError(
        `Something went wrong while removing "${pending.material.title}". Please try again.`,
      );
    } finally {
      setRemoving(false);
      setPending(null);
    }
  };

  const openRemoveDialog = (download: OfflineDownloadSummary) => {
    setRemoveError("");
    setPending(download);
  };

  const cancelRemove = () => {
    if (removing) {
      return;
    }

    setPending(null);
    setRemoveError("");
  };

  return (
    <section
      aria-label="Offline storage"
      className={isDesktop ? undefined : "px-4 pb-6"}
    >
      {isDesktop && (
        <SectionHeader
          title="Offline Storage & Update"
          description={`${downloads.length} ${pluralise(downloads.length, "title")} stored on this device.`}
          divider
        />
      )}

      <div
        className={
          isDesktop
            ? "mt-4 border border-line bg-white p-5"
            : "rounded-lg border border-line bg-white p-4"
        }
      >
        <ProgressIndicator
          label="Offline storage"
          showValue={`${formatBytes(usedBytes)} / ${formatBytes(allocation)}`}
          value={usedBytes}
          max={allocation || 1}
        />

        <p className="mt-2 text-[14px] text-muted">
          {percentUsed}% of your offline allocation is in use.
        </p>

        {isDesktop && downloads.length > 0 && (
          <div className="mt-4">
            <h3 className="m-0 text-[13px] font-bold uppercase tracking-[0.14em] text-muted">
              Stored on this device
            </h3>

            <ul className="m-0 mt-1 list-none divide-y divide-line p-0">
              {downloads.slice(0, VISIBLE_ROWS).map((download) => {
                const { text, badge } = describeExpiry(download);

                return (
                  <li
                    key={download.id}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-[16px] text-deep">
                        {download.material.title}
                      </p>

                      <p className="m-0 text-[14px] text-muted">
                        {formatBytes(download.sizeBytes)} · {text}
                      </p>
                    </div>

                    {badge && (
                      <StatusBadge
                        size="sm"
                        variant={badge.variant}
                        label={badge.label}
                      />
                    )}

                    <Button
                      type="button"
                      variant="icon"
                      size="sm"
                      aria-label={`Remove ${download.material.title} from offline library`}
                      disabled={removing}
                      onClick={() => openRemoveDialog(download)}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {isDesktop && downloads.length === 0 && (
          <p className="mt-4 text-[15px] text-muted">
            Nothing is saved for offline reading yet. Download a title to read
            it without a connection.
          </p>
        )}

        {removeError && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {removeError}
          </p>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            to={USER_ROUTES.offline}
            variant={isDesktop ? "outline" : "text"}
            size="sm"
          >
            {isDesktop ? "Manage offline library" : "Manage Storage"}
          </Button>
        </div>
      </div>

      <ConfirmationDialog
        open={pending !== null}
        title="Remove offline copy?"
        description={
          pending
            ? `“${pending.material.title}” will be deleted from this device. You can download it again while online. Your notes, bookmarks and reading progress stay saved.`
            : ""
        }
        confirmLabel="Remove"
        tone="danger"
        loading={removing}
        onConfirm={() => void confirmRemove()}
        onCancel={cancelRemove}
      />
    </section>
  );
}
