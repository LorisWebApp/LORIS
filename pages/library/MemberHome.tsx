import { BookOpen } from 'lucide-react';
import { Button, EmptyState } from '../../components/shared';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../routes/paths';

/** Landing page for signed-in readers. The reading experience itself is a later milestone. */
export function MemberHome() {
  const { user } = useAuth();
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <EmptyState
        icon={<BookOpen size={32} />}
        title={`Welcome${user ? `, ${user.fullName.split(' ')[0]}` : ''}`}
        description="Your library is being prepared. Browsing and reading will arrive in a later release."
        action={<Button to={ROUTES.logout} variant="secondary">Log out</Button>}
      />
    </main>
  );
}
