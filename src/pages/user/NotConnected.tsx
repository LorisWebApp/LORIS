import { useLocation } from 'react-router-dom';

/** Stand-in for routes owned by other LORIS groups. */
export default function NotConnected() {
  const { pathname } = useLocation();
  return (
    <main className="grid min-h-[60vh] place-items-center px-6 text-center">
      <div>
        <h1 className="font-serif text-3xl text-deep">Not connected yet</h1>
        <p className="mt-2 max-w-sm text-sm text-muted">
          <code>{pathname}</code> is owned by another LORIS group and will be wired in during integration.
        </p>
      </div>
    </main>
  );
}
