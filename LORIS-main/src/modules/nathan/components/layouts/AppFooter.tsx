import type { ReactNode } from 'react';

export function AppFooter({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1312px] flex-wrap items-center justify-between gap-2 px-8 py-5 text-[14px] text-muted">
        <p>{left}</p>
        {right && <p>{right}</p>}
      </div>
    </footer>
  );
}
