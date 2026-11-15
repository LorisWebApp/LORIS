import { BookOpen, Headphones, Image as ImageIcon, Video } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ErrorState, LoadingIndicator, ProgressIndicator, StatDisplay } from '../../components/shared';
import { ApiError } from '../../services/api';
import { organisationService } from '../../services/organisation.service';
import type { PlatformOverview } from '../../types/organisation';
import { formatBytes, formatNumber } from '../../utils/formatters';

function Card({ children, roomy }: { children: ReactNode; roomy?: boolean }) {
  return <section className={`rounded-xl border border-line bg-white ${roomy ? 'p-8' : 'p-6'}`}>{children}</section>;
}

/** Platform Manager "System overview". All figures are read from the backend. */
export default function Dashboard() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (isCancelled: () => boolean = () => false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await organisationService.getPlatformOverview();
      if (!isCancelled()) setOverview(data);
    } catch (caught) {
      if (!isCancelled()) setError(caught instanceof ApiError ? caught.message : 'Could not load the overview.');
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void load(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [load]);

  const formats = overview
    ? [
        { label: 'Books', value: overview.materials.books, icon: <BookOpen size={16} /> },
        { label: 'Videos', value: overview.materials.videos, icon: <Video size={16} /> },
        { label: 'Images', value: overview.materials.images, icon: <ImageIcon size={16} /> },
        { label: 'Audio', value: overview.materials.audio, icon: <Headphones size={16} /> },
      ]
    : [];

  return (
    <main>
      <header className="bg-deep text-white">
        <div className="mx-auto max-w-[1312px] px-4 py-12 sm:px-8 sm:py-14">
          <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-badge">A space for curious minds</p>
          <h1 className="m-0 text-[44px] font-medium leading-none tracking-tight sm:text-[56px]">System overview</h1>
          <p className="mt-4 text-[19px] text-white/75">A shared library. A growing community.</p>
        </div>
      </header>

      <div className="mx-auto max-w-[1312px] px-4 py-8 sm:px-8">
        {loading && <LoadingIndicator centered label="Loading overview" />}
        {!loading && error && <ErrorState title="Could not load the overview" message={error} onRetry={() => void load()} />}
        {!loading && overview && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <StatDisplay label="Active end users" value={formatNumber(overview.activeEndUsers)} supporting={`${formatNumber(overview.endUsersSignedIn)} signed in now`} />
              </Card>
              <Card>
                <StatDisplay label="Active organisations" value={formatNumber(overview.activeOrganisations)} supporting={`${formatNumber(overview.organisationsSignedIn)} accounts signed in now`} />
              </Card>
              <Card>
                <StatDisplay label="Pending requests" value={formatNumber(overview.pendingRequests)} supporting={`${formatNumber(overview.requestsReceivedToday)} received today`} />
              </Card>
              <Card>
                <StatDisplay label="Open support tickets" value={formatNumber(overview.openSupportTickets)} supporting={`${formatNumber(overview.ticketsNeedingReply)} need a reply`} />
              </Card>
            </div>
            <p className="mt-2 text-[15px] text-muted">Activity: accounts used in the last 30 days.</p>

            <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.5fr)]">
              <Card roomy>
                <h2 className="m-0 text-[32px] font-medium leading-tight text-deep">A library in every format</h2>
                <p className="mt-1 text-[17px] text-muted">{formatNumber(overview.materials.total)} materials across all organisations.</p>
                <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
                  {formats.map((format) => (
                    <div key={format.label}>
                      <dt className="flex items-center gap-2 text-[15px] text-muted">
                        <span aria-hidden>{format.icon}</span>
                        {format.label}
                      </dt>
                      <dd className="m-0 mt-1 text-[34px] font-medium leading-none tabular-nums text-deep">{formatNumber(format.value)}</dd>
                    </div>
                  ))}
                </dl>
              </Card>

              <Card roomy>
                <h2 className="m-0 text-[15px] font-semibold uppercase tracking-[0.14em] text-deep">System storage</h2>
                {overview.storage ? (
                  <div className="mt-4">
                    <p className="m-0 text-[34px] font-medium leading-none text-deep">
                      {formatBytes(overview.storage.usedBytes)}
                      {overview.storage.totalBytes ? <span className="ml-2 text-[15px] text-muted">of {formatBytes(overview.storage.totalBytes)}</span> : null}
                    </p>
                    {overview.storage.totalBytes ? (
                      <ProgressIndicator className="mt-4" label="Storage used" value={overview.storage.usedBytes} max={overview.storage.totalBytes} showValue />
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-4 text-[17px] text-muted">No storage information yet. It will appear once the backend reports it.</p>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
