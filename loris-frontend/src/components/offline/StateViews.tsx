import { AlertCircle, Library } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../integration/loris';

export function LoadingGrid({ list = false }: { list?: boolean }) {
  return (
    <div className={list ? 'space-y-3' : 'grid gap-6 sm:grid-cols-2 xl:grid-cols-3'} aria-busy="true" aria-label="Loading saved materials">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-2xl bg-white">
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

export function EmptyState({ filtered, onReset }: { filtered: boolean; onReset: () => void }) {
  return (
    <div className="grid place-items-center rounded-2xl bg-white px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-mint text-ink"><Library size={20} /></span>
      <h3 className="mt-4 font-serif text-xl text-deep">
        {filtered ? 'No saved materials match' : 'Nothing saved offline yet'}
      </h3>
      <p className="mt-1 max-w-xs text-sm text-muted">
        {filtered
          ? 'Try a different search or clear the filters.'
          : 'Use Save Offline on a catalogue item and it will appear here, ready to read without a connection.'}
      </p>
      {filtered ? (
        <button onClick={onReset} className="mt-5 rounded-full bg-deep px-5 py-2.5 text-sm font-semibold text-white">Reset filters</button>
      ) : (
        <Link to={ROUTES.browse} className="mt-5 rounded-full bg-deep px-5 py-2.5 text-sm font-semibold text-white">Explore Catalogue</Link>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="grid place-items-center rounded-2xl bg-white px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-rose-bg text-rose-text"><AlertCircle size={20} /></span>
      <h3 className="mt-4 font-serif text-xl text-deep">Couldn’t load your offline library</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      <button onClick={onRetry} className="mt-5 rounded-full bg-deep px-5 py-2.5 text-sm font-semibold text-white">Try again</button>
    </div>
  );
}
