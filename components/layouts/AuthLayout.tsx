import { BookOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import bookshelf from '../../assets/images/bookshelf.svg';

interface AuthLayoutProps {
  title: string;
  /** Optional line under the title. */
  description?: string;
  children: ReactNode;
  /** Wider card for pages that show more than a short form. */
  wide?: boolean;
  /** Links or notes shown beneath the form inside the card. */
  footer?: ReactNode;
}

/** Full-screen bookshelf backdrop with a centred white card, used by every auth and registration page. */
export function AuthLayout({ title, description, children, footer, wide }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cover bg-center px-4 py-10" style={{ backgroundImage: `url(${bookshelf})` }}>
      <section aria-labelledby="auth-title" className={`w-full ${wide ? 'max-w-[680px]' : 'max-w-[460px]'} rounded-xl bg-white px-7 py-8 sm:px-10`}>
        <div className="mb-6 flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-ink text-white" aria-hidden>
            <BookOpen size={28} />
          </span>
          <div className="leading-tight">
            <p className="text-[28px] font-medium text-ink">Loris Web Library</p>
            <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-muted">Reading for everyone</p>
          </div>
        </div>
        <h1 id="auth-title" className="text-[26px] font-medium text-deep">
          {title}
        </h1>
        {description && <p className="mt-1 text-[16px] text-ink/75">{description}</p>}
        <div className="mt-5">{children}</div>
        {footer && <div className="mt-6 border-t border-line pt-4 text-[15px] text-ink/80">{footer}</div>}
      </section>
    </main>
  );
}
