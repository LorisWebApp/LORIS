import { Navigate } from 'react-router-dom';
import { LoadingIndicator } from '../components/shared';
import { useAuth } from '../hooks/useAuth';
import { ROUTES, homeRouteForRole } from '../routes/paths';

/** "/" sends people to their role's home, or to login. */
export function HomeRedirect() {
  const { user, status } = useAuth();
  if (status === 'loading') return <div className="flex min-h-screen items-center justify-center"><LoadingIndicator centered label="Loading…" /></div>;
  return <Navigate to={user ? homeRouteForRole(user.role) : ROUTES.login} replace />;
}
