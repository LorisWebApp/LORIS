import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { cx } from '../utils/cx';

export interface SearchBarProps {
  placeholder?: string;
  /** Controlled value. Omit to let the component manage its own text. */
  value?: string;
  defaultValue?: string;
  /** Fires on every keystroke. */
  onChange?: (value: string) => void;
  /** Fires when the user submits (Enter) and, if `debounceMs` is set, after typing pauses. */
  onSearch?: (query: string) => void;
  debounceMs?: number;
  /** `line` = underline only (editorial default), `filled` = tinted field, `pill` = tinted rounded field, `raised` = white rounded field for use on tinted pages. */
  appearance?: 'line' | 'filled' | 'pill' | 'raised';
  clearable?: boolean;
  /** Accessible name; defaults to the placeholder. */
  'aria-label'?: string;
  className?: string;
}

export function SearchBar({ placeholder = 'Search…', value, defaultValue = '', onChange, onSearch, debounceMs, appearance = 'line', clearable = true, className, ...rest }: SearchBarProps) {
  const [inner, setInner] = useState(defaultValue);
  const text = value ?? inner;
  const firstRun = useRef(true);

  const update = (v: string) => { if (value === undefined) setInner(v); onChange?.(v); };

  useEffect(() => {
    if (!debounceMs || !onSearch) return;
    if (firstRun.current) { firstRun.current = false; return; }
    const t = setTimeout(() => onSearch(text), debounceMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, debounceMs]);

  const submit = (e: FormEvent) => { e.preventDefault(); onSearch?.(text); };

  return (
    <form role="search" onSubmit={submit} className={cx('flex items-center gap-2.5', appearance === 'line' ? 'border-b border-ink/30 pb-2 focus-within:border-ink' : cx('px-4 py-2.5', appearance === 'raised' ? 'bg-white' : 'bg-mint', appearance === 'pill' || appearance === 'raised' ? 'rounded-full' : 'rounded-[4px]'), className)}>
      <Search size={16} className="shrink-0 text-muted" aria-hidden />
      <input
        type="search"
        value={text}
        onChange={(e) => update(e.target.value)}
        placeholder={placeholder}
        aria-label={rest['aria-label'] ?? placeholder}
        className="min-w-0 flex-1 bg-transparent text-[16px] text-deep outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
      />
      {clearable && text && (
        <button type="button" aria-label="Clear search" onClick={() => { update(''); onSearch?.(''); }} className="text-muted hover:text-deep"><X size={14} /></button>
      )}
    </form>
  );
}
