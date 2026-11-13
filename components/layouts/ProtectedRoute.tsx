import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Button, LoadingIndicator } from '../shared';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES, homeRouteForRole } from '../../routes/paths';
import type { UserRole } from '../../types/user';

interface ProtectedRouteProps {
  /** Restrict to these roles. Omit to allow any signed-in user. */
  allowedRoles?: UserRole[];
  /** Send signed-in users with an unverified email to the verification screen (default true). */
  requireVerifiedEmail?: boolean;
  /** Use as a wrapper; when omitted, nested routes render through <Outlet />. */
  children?: ReactNode;
}

export function ProtectedRoute({ allowedRoles, requireVerifiedEmail = true, children }: ProtectedRouteProps) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center"><LoadingIndicator centered label="Checking your session…" /></div>;
  }

  if (!user) {
    return <Navigate to={ROUTES.login} replace state={{ from: { pathname: location.pathname, search: location.search } }} />;
  }

  if (requireVerifiedEmail && !user.emailVerified) {
    return <Navigate to={ROUTES.verifyEmail} replace state={{ email: user.email }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div role="alert" className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="text-[28px] font-medium text-deep">You don't have access to this page</h1>
        <p className="mt-2 max-w-md text-[16px] text-muted">Your account's role doesn't include permission to view this area.</p>
        <div className="mt-6"><Button to={homeRouteForRole(user.role)} variant="secondary">Go to your home page</Button></div>
      </div>
    );
  }

  return <>{children ?? <Outlet />}</>;
}
