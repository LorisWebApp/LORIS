import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingIndicator } from '../../components/shared';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../routes/paths';

/** Route target for "Log out" links/buttons: ends the session, then returns to login with a notice. */
export function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    logout()
      .catch(() => { /* the local session is cleared regardless */ })
      .finally(() => navigate(ROUTES.login, { replace: true, state: { notice: 'You have been signed out.' } }));
  }, [logout, navigate]);

  return (
    <AuthLayout title="Signing you out">
      <LoadingIndicator centered label="Signing you out…" />
    </AuthLayout>
  );
}
