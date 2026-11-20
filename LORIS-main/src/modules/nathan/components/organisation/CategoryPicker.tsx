import { X } from 'lucide-react';
import { Select } from '../common/Select';

interface CategoryPickerProps {
  /** Categories that exist for the organisation. */
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
}

/** Pick one or more categories: a dropdown to add, removable chips for what is selected. */
export function CategoryPicker({ options, value, onChange, label = 'Categories *', error, disabled }: CategoryPickerProps) {
  const remaining = options.filter((o) => !value.includes(o));
  return (
    <div>
      <Select label={label} placeholder={remaining.length ? 'Choose a category' : 'All categories selected'} options={remaining} value="" disabled={disabled || remaining.length === 0} error={error}
        onChange={(e) => { if (e.target.value) onChange([...value, e.target.value]); }} />
      {value.length > 0 && (
        <div className="mt-2">
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Selected categories">
            {value.map((c) => (
              <li key={c} className="inline-flex items-center gap-1 rounded-full bg-mint py-1 pl-3 pr-1 text-[14px] font-medium text-deep">
                {c}
                <button type="button" disabled={disabled} onClick={() => onChange(value.filter((x) => x !== c))} aria-label={`Remove category ${c}`} className="grid size-5 place-items-center rounded-full hover:bg-line focus-visible:outline-2 focus-visible:outline-brand"><X size={12} aria-hidden /></button>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[13px] text-muted">Selected: {value.join(' · ')}. Members will find this material under {value.length === 1 ? 'this category' : value.length === 2 ? 'both categories' : 'all of these categories'}.</p>
        </div>
      )}
    </div>
  );
}
