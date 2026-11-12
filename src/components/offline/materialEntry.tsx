import { Bookmark, Trash2 } from 'lucide-react';
import type { OfflineMaterialMetadata } from '../../group-d/types/models';
import { formatSavedAgo } from '../../lib/format';
import { getMaterialKind, isAccessValid } from '../../types/offline';
import { Button, type MaterialListEntry } from '../shared';
import { CoverArt, CoverOverlayIcon } from './CoverArt';
import { actionFor, fileInfo, kindBadge } from './materialDisplay';

interface Handlers {
  onOpen: (id: string) => void;
  onRemove: (m: OfflineMaterialMetadata) => void;
}

/** Maps a stored offline material onto the shared MaterialItem props. */
export function toMaterialEntry(m: OfflineMaterialMetadata, { onOpen, onRemove }: Handlers, mobile: boolean): MaterialListEntry {
  const kind = getMaterialKind(m);
  const { desktop, mobile: mobileLabel, Icon } = actionFor[kind];
  const valid = isAccessValid(m);
  const tone = valid ? 'text-brand' : 'text-rose-text';
  const dot = valid ? 'bg-brand' : 'bg-rose-text';
  const saved = `Saved ${formatSavedAgo(m.savedAt)}`;

  return {
    id: m.id,
    title: m.title,
    subtitle: m.author,
    cover: <CoverArt m={m} />,
    coverOverlay: mobile ? undefined : (
      <>
        <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-white text-ink"><Bookmark size={13} fill="currentColor" /></span>
        <CoverOverlayIcon m={m} />
        {m.category && <span className="absolute bottom-3 left-3 rounded-[2px] bg-white/90 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink">{m.category}</span>}
      </>
    ),
    tag: { label: kindBadge[kind], variant: kind === 'pdf' ? 'danger' : 'accent' },
    details: fileInfo(m).split(' • '),
    status: mobile ? (
      <span className={`inline-flex items-center gap-1 font-semibold ${tone}`}>{valid ? 'Available offline' : 'Access expired'}</span>
    ) : (
      <span className={`inline-flex items-center gap-1.5 font-semibold ${tone}`}><i className={`size-1.5 rounded-full ${dot}`} />{valid ? 'Downloaded & Ready' : 'Offline access expired'}</span>
    ),
    statusAside: mobile ? saved : <span className={`font-semibold ${tone}`}>{saved}</span>,
    aside: m.progressLabel,
    actions: (
      <>
        <Button shape="pill" className="flex-1" onClick={() => onOpen(m.id)} leftIcon={<Icon size={14} />}>{mobile ? mobileLabel : desktop}</Button>
        <Button variant="icon" shape="pill" className="bg-mint" aria-label={`Remove ${m.title}`} onClick={() => onRemove(m)}><Trash2 size={15} /></Button>
      </>
    ),
  };
}
