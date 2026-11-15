import { BookOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BookshelfBackground } from './BookshelfBackground';

interface AuthLayoutProps {
  title: string;
  /** Short helper text under the title. */
  description?: string;
  children: ReactNode;
  /** Secondary links below the form (e.g. "Back to login"). */
  footer?: ReactNode;
}

/** Shared frame for every pre-login screen: bookshelf backdrop, white card, LORIS wordmark. */
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <BookshelfBackground />
      <main className="relative w-full max-w-[480px] rounded-2xl bg-white px-8 py-9 sm:px-10">
        <Link to="/" className="mb-8 flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-brand" aria-label="Loris Web Library home">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-deep text-white">
            <BookOpen size={26} aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-[28px] font-medium text-deep">Loris Web Library</span>
            <span className="block text-[13px] font-semibold uppercase tracking-[0.12em] text-ink/70">Reading for everyone</span>
          </span>
        </Link>

        <h1 className="text-[26px] font-medium leading-tight text-deep">{title}</h1>
        {description && <p className="mt-2 text-[16px] leading-6 text-ink/80">{description}</p>}

        <div className="mt-6">{children}</div>

        {footer && <div className="mt-6 text-center text-[15px] text-ink/80">{footer}</div>}
      </main>
    </div>
  );
}
