import type { RouteObject } from 'react-router-dom';
import { PublicOnlyRoute } from '../components/layouts/PublicOnlyRoute';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { Login } from '../pages/auth/Login';
import { Logout } from '../pages/auth/Logout';
import { Register } from '../pages/auth/Register';
import { ResetPassword } from '../pages/auth/ResetPassword';
import { VerifyEmail } from '../pages/auth/VerifyEmail';
import { OrganisationCodeEntry } from '../pages/public/OrganisationCodeEntry';
import { OrganisationRegistration } from '../pages/public/OrganisationRegistration';
import { ROUTES } from './paths';

/**
 * Spread these into the existing router:  createBrowserRouter([...authRoutes, ...existing])
 * Protect other areas with <ProtectedRoute allowedRoles={[...]} /> as a layout route.
 */
export const authRoutes: RouteObject[] = [
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: ROUTES.login, element: <Login /> },
      { path: ROUTES.register, element: <Register /> },
    ],
  },
  { path: ROUTES.logout, element: <Logout /> },
  { path: ROUTES.forgotPassword, element: <ForgotPassword /> },
  { path: ROUTES.resetPassword, element: <ResetPassword /> },
  { path: ROUTES.verifyEmail, element: <VerifyEmail /> },
  { path: ROUTES.organisationRegistration, element: <OrganisationRegistration /> },
  { path: ROUTES.organisationCode, element: <OrganisationCodeEntry /> },
];
