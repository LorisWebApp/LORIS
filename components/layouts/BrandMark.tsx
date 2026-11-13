import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

/** Small logo + name used in the dashboard top bars. */
export function BrandMark({ to = '/', label }: { to?: string; label?: string }) {
  return (
    <Link to={to} aria-label="Loris Web Library home" className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-brand">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-deep text-white"><BookOpen size={20} aria-hidden /></span>
      <span className="text-[22px] font-medium leading-none text-deep">Loris Web Library</span>
      {label && <span className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-muted sm:inline">{label}</span>}
    </Link>
  );
}
