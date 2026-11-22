import { Outlet } from 'react-router-dom';

import { OfflineActionsProvider } from './OfflineActionsContext';

/** Navigation is provided by the application-wide LORIS GlobalLayout. */
export function UserLayout() {
  return (
    <OfflineActionsProvider>
      <Outlet />
    </OfflineActionsProvider>
  );
}
export default UserLayout;
