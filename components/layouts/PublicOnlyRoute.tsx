import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingIndicator } from '../shared';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES, homeRouteForRole } from '../../routes/paths';

/** Keeps signed-in users out of login/register; sends them to their role's home. */
export function PublicOnlyRoute({ children }: { children?: ReactNode }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center"><LoadingIndicator centered label="Loading…" /></div>;
  }
  if (user) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
    return <Navigate to={user.emailVerified ? from ?? homeRouteForRole(user.role) : ROUTES.verifyEmail} replace />;
  }
  return <>{children ?? <Outlet />}</>;
}
