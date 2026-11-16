import { Library } from 'lucide-react';
import { Button, EmptyState, ErrorState } from '../shared';
import { ROUTES } from '../../integration/loris';

/** Library-specific skeleton shown while IndexedDB is being read. */
export function LoadingGrid({ list = false }: { list?: boolean }) {
  return (
    <div className={list ? 'space-y-3' : 'grid gap-6 sm:grid-cols-2 xl:grid-cols-3'} aria-busy="true" aria-label="Loading saved materials">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white">
          <div className={list ? 'h-28' : 'h-[232px]'} />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 rounded bg-mint" />
            <div className="h-4 w-2/3 rounded bg-mint" />
            <div className="h-3 w-1/2 rounded bg-mint" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LibraryEmpty({ filtered, onReset }: { filtered: boolean; onReset: () => void }) {
  return (
    <div className="bg-white">
      <EmptyState
        icon={<Library size={28} />}
        title={filtered ? 'No saved materials match' : 'Nothing saved offline yet'}
        description={filtered ? 'Try a different search or clear the filters.' : 'Use Save Offline on a catalogue item and it will appear here, ready to read without a connection.'}
        action={filtered ? <Button shape="pill" onClick={onReset}>Reset filters</Button> : <Button shape="pill" to={ROUTES.browse}>Explore Catalogue</Button>}
      />
    </div>
  );
}

export function LibraryError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-white">
      <ErrorState title="Couldn’t load your offline library" message={message} onRetry={onRetry} />
    </div>
  );
}
