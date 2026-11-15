import { Suspense, lazy } from 'react';
import { Outlet } from 'react-router-dom';
import { PREVIEW_MODE } from '../preview';

// Loaded only in preview mode, so it is not part of normal builds.
const PreviewSwitcher = PREVIEW_MODE
  ? lazy(() => import('../components/dev/PreviewSwitcher').then((m) => ({ default: m.PreviewSwitcher })))
  : null;

/** Wraps every route; hosts the preview switcher when preview mode is on. */
export function RootLayout() {
  return (
    <>
      <Outlet />
      {PreviewSwitcher && <Suspense fallback={null}><PreviewSwitcher /></Suspense>}
    </>
  );
}
