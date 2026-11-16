import { Outlet } from 'react-router-dom';

/** Nathan's retained route subtree; the application shell supplies global navigation. */
export function RootLayout() {
  return <Outlet />;
}
