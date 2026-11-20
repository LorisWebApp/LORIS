import { BookOpenText } from 'lucide-react';

export function LorisLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="grid size-9 place-items-center rounded-[10px] bg-ink text-white">
        <BookOpenText size={18} strokeWidth={1.8} />
      </span>
      <span className="font-serif text-[17px] tracking-wide text-deep">LORIS</span>
    </span>
  );
}
