import { useCallback, useState } from 'react';
import type { OfflineMaterialMetadata } from '../../group-d/types/models';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { useLibraryFilters } from '../../hooks/useLibraryFilters';
import { useOfflineLibrary } from '../../hooks/useOfflineLibrary';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Toast } from '../../components/common/Toast';
import { OfflineDesktop } from '../../components/offline/OfflineDesktop';
import { OfflineMobile } from '../../components/offline/OfflineMobile';

export default function OfflineLibrary() {
  const lib = useOfflineLibrary();
  const f = useLibraryFilters(lib.items);
  const isDesktop = useIsDesktop();
  const [toast, setToast] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<OfflineMaterialMetadata | null>(null);
  const [purgeOpen, setPurgeOpen] = useState(false);

  const onOpen = useCallback(async (id: string) => {
    try { await lib.open(id); } catch (e) { setToast(e instanceof Error ? e.message : 'Could not open this material.'); }
  }, [lib]);

  const fail = (e: unknown) => setToast(e instanceof Error ? e.message : 'Something went wrong.');

  return (
    <>
      {isDesktop
        ? <OfflineDesktop lib={lib} f={f} onOpen={onOpen} onRemove={setPendingRemove} onPurge={() => setPurgeOpen(true)} />
        : <OfflineMobile lib={lib} f={f} onOpen={onOpen} onRemove={setPendingRemove} />}
      <ConfirmDialog
        open={pendingRemove !== null}
        title="Remove from this device?"
        message={`“${pendingRemove?.title ?? ''}” will be deleted from offline storage. You can save it again from the catalogue while you have access.`}
        confirmLabel="Remove"
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => { const id = pendingRemove!.id; setPendingRemove(null); lib.remove(id).catch(fail); }}
      />
      <ConfirmDialog
        open={purgeOpen}
        title="Purge all offline materials?"
        message={`All ${lib.items.length} saved materials will be deleted from this device.`}
        confirmLabel="Purge all"
        onCancel={() => setPurgeOpen(false)}
        onConfirm={() => { setPurgeOpen(false); lib.purgeAll().catch(fail); }}
      />
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
