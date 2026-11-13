import type { ReactNode } from 'react';
import { StatDisplay } from '../shared';
import { Panel } from '../common/Panel';

/** Stat tile with an optional icon chip in the corner (overview and members screens). */
export function StatCard({ label, value, supporting, icon }: { label: string; value: string | number; supporting?: string; icon?: ReactNode }) {
  return (
    <Panel className="relative p-5">
      {icon && <span aria-hidden className="absolute right-4 top-4 grid size-8 place-items-center rounded-md bg-mint text-ink">{icon}</span>}
      <StatDisplay label={label} value={value} supporting={supporting} />
    </Panel>
  );
}
