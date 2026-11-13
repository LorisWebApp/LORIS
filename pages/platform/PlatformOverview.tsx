import { Headphones, Image as ImageIcon, BookOpen, Video } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button, ProgressIndicator, SectionHeader, StatDisplay } from '../../components/shared';
import { AsyncView } from '../../components/common/AsyncView';
import { Callout, Panel } from '../../components/common/Panel';
import { useAsync } from '../../hooks/useAsync';
import { getOverview } from '../../services/platform.service';
import { formatNumber, formatWhen, timeAgo } from '../../utils/format';

function FormatCount({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-[14px] text-muted"><span aria-hidden>{icon}</span>{label}</p>
      <p className="mt-1 text-[30px] font-medium leading-none tabular-nums text-deep">{formatNumber(value)}</p>
    </div>
  );
}

const formatGb = (gb: number) => (gb >= 1000 ? `${gb / 1000} TB` : `${gb} GB`);

export function PlatformOverview() {
  const { data, loading, error, reload } = useAsync(getOverview, []);

  return (
    <AsyncView data={data} loading={loading} error={error} onRetry={reload} loadingLabel="Loading the overview…">
      {(o) => {
        const pct = Math.round((o.storage.usedGb / o.storage.totalGb) * 100);
        return (
          <div className="space-y-6">
            <div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Panel className="p-5"><StatDisplay label="Active end users" value={formatNumber(o.activeUsers)} supporting={`${formatNumber(o.usersOnlineNow)} signed in now`} /></Panel>
                <Panel className="p-5"><StatDisplay label="Active organisations" value={formatNumber(o.activeOrganisations)} supporting={`${o.organisationsOnlineNow} accounts signed in now`} /></Panel>
                <Panel className="p-5"><StatDisplay label="Pending requests" value={o.pendingRequests} supporting={`${o.requestsToday} received today`} /></Panel>
                <Panel className="p-5"><StatDisplay label="Open support tickets" value={o.openTickets} supporting={`${o.ticketsAwaitingReply} need a reply`} /></Panel>
              </div>
              <p className="mt-2 text-[14px] text-muted">Activity: accounts used in the last 30 days.</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
              <Panel className="p-6">
                <SectionHeader title="A library in every format" description={`${formatNumber(o.materials.total)} materials across all organisations.`} />
                <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
                  <FormatCount icon={<BookOpen size={16} />} label="Books" value={o.materials.books} />
                  <FormatCount icon={<Video size={16} />} label="Videos" value={o.materials.videos} />
                  <FormatCount icon={<ImageIcon size={16} />} label="Images" value={o.materials.images} />
                  <FormatCount icon={<Headphones size={16} />} label="Audio" value={o.materials.audio} />
                </div>
              </Panel>
              <Panel className="p-6">
                <SectionHeader title="System storage" as="h2" size="sm" />
                <p className="mt-3 flex items-baseline justify-between">
                  <span className="text-[34px] font-medium leading-none text-deep">{pct}%</span>
                  <span className="text-[14px] text-muted">{formatGb(o.storage.usedGb)} of {formatGb(o.storage.totalGb)} used</span>
                </p>
                <ProgressIndicator className="mt-3" value={o.storage.usedGb} max={o.storage.totalGb} label="Storage used" />
                <p className="mt-2 text-[14px] text-muted">{formatGb(o.storage.totalGb - o.storage.usedGb)} available</p>
              </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
              <Panel className="p-6">
                <SectionHeader title="A community is waiting" description="Organisation registration requests" actions={<Button to="/platform/requests" variant="text" size="sm">View all requests →</Button>} />
                {o.newestRequests.length === 0 ? (
                  <p className="mt-6 text-[16px] text-muted">No requests are waiting. You're all caught up.</p>
                ) : (
                  <ul className="mt-4 list-none divide-y divide-line p-0">
                    {o.newestRequests.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-[17px] font-medium text-deep">{r.organisationName}</p>
                          <p className="text-[14px] text-muted">{r.organisationType} · {r.country}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-4">
                          <span className="text-[14px] text-muted">{formatWhen(r.submittedAt)}</span>
                          <Button to={`/platform/requests/${r.id}`} variant="text" size="sm">Review →</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
              <Panel className="p-6">
                <SectionHeader title="Across the library" />
                <ul className="mt-4 list-none divide-y divide-line p-0">
                  {o.activity.map((a) => (
                    <li key={a.id} className="py-3">
                      <p className="text-[14px] font-semibold text-deep">{a.title}</p>
                      <p className="text-[15px] text-ink/80">{a.detail}</p>
                      <p className="text-[13px] text-muted">{timeAgo(a.at)}</p>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>

            <Callout className="flex flex-wrap items-center justify-between gap-3">
              <span>{o.healthMessage}</span>
              <Button to="/platform/system" variant="text" size="sm">Manage library system →</Button>
            </Callout>
          </div>
        );
      }}
    </AsyncView>
  );
}
