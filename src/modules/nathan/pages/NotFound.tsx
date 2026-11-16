import { Button, EmptyState } from '../components/shared';

export function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <EmptyState title="Page not found" description="The page you're looking for doesn't exist or has moved." action={<Button to="/" variant="secondary">Go to the start</Button>} />
    </main>
  );
}
