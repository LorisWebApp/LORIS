import { useCallback, useState } from 'react';
import type { OfflineMaterialMetadata } from '../../group-d/types/models';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { useLibraryFilters } from '../../hooks/useLibraryFilters';
import { useOfflineLibrary } from '../../hooks/useOfflineLibrary';
import { ReaderNotConnectedError } from '../../integration/loris';
import { ConfirmationDialog, ToastNotification } from '../../components/shared';
import { OfflineDesktop } from '../../components/offline/OfflineDesktop';
import { OfflineMobile } from '../../components/offline/OfflineMobile';

interface ToastState { message: string; variant: 'error' | 'warning' }

export default function OfflineLibrary() {
  const lib = useOfflineLibrary();
  const f = useLibraryFilters(lib.items);
  const isDesktop = useIsDesktop();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pendingRemove, setPendingRemove] = useState<OfflineMaterialMetadata | null>(null);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const closeToast = useCallback(() => setToast(null), []);

  const fail = (e: unknown) =>
    setToast({ message: e instanceof Error ? e.message : 'Something went wrong.', variant: e instanceof ReaderNotConnectedError ? 'warning' : 'error' });

  const onOpen = useCallback(async (id: string) => {
    try { await lib.open(id); } catch (e) { fail(e); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lib]);

  return (
    <>
      {isDesktop
        ? <OfflineDesktop lib={lib} f={f} onOpen={onOpen} onRemove={setPendingRemove} onPurge={() => setPurgeOpen(true)} />
        : <OfflineMobile lib={lib} f={f} onOpen={onOpen} onRemove={setPendingRemove} />}
      <ConfirmationDialog
        open={pendingRemove !== null} tone="danger"
        title="Remove from this device?"
        description={`“${pendingRemove?.title ?? ''}” will be deleted from offline storage. You can save it again from the catalogue while you have access.`}
        confirmLabel="Remove"
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => { const id = pendingRemove!.id; setPendingRemove(null); lib.remove(id).catch(fail); }}
      />
      <ConfirmationDialog
        open={purgeOpen} tone="danger"
        title="Purge all offline materials?"
        description={`All ${lib.items.length} saved materials will be deleted from this device.`}
        confirmLabel="Purge all"
        onCancel={() => setPurgeOpen(false)}
        onConfirm={() => { setPurgeOpen(false); lib.purgeAll().catch(fail); }}
      />
      <ToastNotification open={toast !== null} variant={toast?.variant} message={toast?.message ?? ''} onClose={closeToast} />
    </>
  );
}
