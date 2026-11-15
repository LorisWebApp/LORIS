import { Outlet } from 'react-router-dom';

/** Navigation is provided by the application-wide LORIS GlobalLayout. */
export function UserLayout() {
  return <Outlet />;
}
export default UserLayout;
