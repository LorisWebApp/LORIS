import { ArrowRight, BookOpen, Headphones, Image as ImageIcon, Upload, Users, Video } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AsyncView } from '../../components/common/AsyncView';
import { Panel } from '../../components/common/Panel';
import { StatCard } from '../../components/organisation/StatCard';
import { useAsync } from '../../hooks/useAsync';
import { getDashboard } from '../../services/organisation.service';
import { formatNumber } from '../../utils/format';

function SpaceCard({ to, icon, title, meta, description, cta }: { to: string; icon: ReactNode; title: string; meta: string; description: string; cta: string }) {
  return (
    <Link to={to} className="group block rounded-lg border border-line bg-white p-6 transition-colors hover:border-ink/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
      <span aria-hidden className="grid size-9 place-items-center rounded-md bg-mint text-ink">{icon}</span>
      <h3 className="mt-5 text-[28px] font-medium leading-tight text-deep">{title}</h3>
      <p className="mt-1 text-[13px] font-semibold text-deep">{meta}</p>
      <p className="mt-2 text-[16px] leading-6 text-ink/80">{description}</p>
      <p className="mt-6 flex items-center justify-between text-[14px] font-semibold text-deep">
        <span className="underline-offset-4 group-hover:underline">{cta}</span>
        <ArrowRight size={16} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}

function FormatShare({ icon, label, count, total }: { icon: ReactNode; label: string; count: number; total: number }) {
  const share = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
  return (
    <div>
      <p className="flex items-center gap-2 text-[14px] text-muted"><span aria-hidden>{icon}</span>{label}</p>
      <p className="mt-1 text-[34px] font-medium leading-none tabular-nums text-deep">{formatNumber(count)}</p>
      <p className="mt-1 text-[13px] text-muted">{share}% of collection</p>
    </div>
  );
}

/** Organisation home: headline numbers, the three spaces, and the collection mix. */
export function OrganisationOverview() {
  const { data, loading, error, reload } = useAsync(getDashboard, []);

  return (
    <AsyncView data={data} loading={loading} error={error} onRetry={reload} loadingLabel="Loading your dashboard…">
      {(d) => (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Materials uploaded" value={formatNumber(d.materials.total)} supporting="Across four material types" icon={<BookOpen size={16} />} />
            <StatCard label="Total members" value={formatNumber(d.members.total)} supporting="Members with library access" icon={<Users size={16} />} />
            <StatCard label="Online now" value={formatNumber(d.members.online)} supporting="Members currently online" icon={<Users size={16} />} />
            <StatCard label="Active users" value={formatNumber(d.members.activeLast30Days)} supporting="Active in the last 30 days" icon={<Users size={16} />} />
          </div>

          <section aria-labelledby="spaces">
            <h2 id="spaces" className="text-[30px] font-medium leading-tight text-deep">Your organisation spaces</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <SpaceCard to="/organisation/upload" icon={<Upload size={18} />} title="Upload materials" meta="Books, videos, images & audio" description="Add new discoveries to your library and organise them into categories." cta="Go to uploads" />
              <SpaceCard to="/organisation/materials" icon={<BookOpen size={18} />} title="Materials" meta={`${formatNumber(d.materials.total)} materials in your collection`} description="Review community ratings and keep your existing materials up to date." cta="Go to materials" />
              <SpaceCard to="/organisation/members" icon={<Users size={18} />} title="Members" meta={`${formatNumber(d.members.total)} members · ${formatNumber(d.members.online)} online`} description="View your community, manage access and invite people by email or link." cta="Go to members" />
            </div>
          </section>

          <Panel className="p-6" aria-labelledby="collection">
            <h2 id="collection" className="text-[26px] font-medium leading-tight text-deep">Your collection</h2>
            <p className="text-[15px] text-muted">How your {formatNumber(d.materials.total)} materials are shared across formats.</p>
            <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
              <FormatShare icon={<BookOpen size={16} />} label="Books" count={d.materials.books} total={d.materials.total} />
              <FormatShare icon={<Video size={16} />} label="Videos" count={d.materials.videos} total={d.materials.total} />
              <FormatShare icon={<ImageIcon size={16} />} label="Images" count={d.materials.images} total={d.materials.total} />
              <FormatShare icon={<Headphones size={16} />} label="Audio" count={d.materials.audio} total={d.materials.total} />
            </div>
          </Panel>
        </div>
      )}
    </AsyncView>
  );
}
