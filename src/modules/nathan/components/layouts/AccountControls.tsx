import { LogOut } from 'lucide-react';
import { UserMenu } from '../shared';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../routes/paths';
import { initials } from '../../utils/format';

/** Avatar + account menu with Log out, shared by the dashboard top bars. */
export function AccountControls() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <UserMenu
      user={{ name: user.fullName, email: user.email, initials: initials(user.fullName) }}
      items={[{ label: 'Log out', to: ROUTES.logout, icon: <LogOut size={16} aria-hidden />, tone: 'danger' }]}
    />
  );
}
