import type { RouteObject } from 'react-router-dom';
import { OrganisationLayout } from '../components/layouts/OrganisationLayout';
import { PlatformLayout } from '../components/layouts/PlatformLayout';
import { ProtectedRoute } from '../components/layouts/ProtectedRoute';
import { HomeRedirect } from '../pages/HomeRedirect';
import { MemberHome } from '../pages/library/MemberHome';
import { NotFound } from '../pages/NotFound';
import { InvitationCodes } from '../pages/organisation/InvitationCodes';
import { ManageUsers } from '../pages/organisation/ManageUsers';
import { OrganisationOverview } from '../pages/organisation/OrganisationOverview';
import { RenewalRequests } from '../pages/organisation/RenewalRequests';
import { SupportTickets as OrganisationSupportTickets } from '../pages/organisation/SupportTickets';
import { LibrarySystem } from '../pages/platform/LibrarySystem';
import { Organisations } from '../pages/platform/Organisations';
import { PlatformOverview } from '../pages/platform/PlatformOverview';
import { RegistrationRequests } from '../pages/platform/RegistrationRequests';
import { RequestReview } from '../pages/platform/RequestReview';
import { SupportTickets as PlatformSupportTickets } from '../pages/platform/SupportTickets';
import { authRoutes } from './authRoutes';

export const appRoutes: RouteObject[] = [
  ...authRoutes,
  { path: '/', element: <HomeRedirect /> },
  {
    element: <ProtectedRoute allowedRoles={['platform_admin']} />,
    children: [
      {
        path: '/platform',
        element: <PlatformLayout />,
        children: [
          { index: true, element: <PlatformOverview /> },
          { path: 'requests', element: <RegistrationRequests /> },
          { path: 'requests/:requestId', element: <RequestReview /> },
          { path: 'organisations', element: <Organisations /> },
          { path: 'tickets', element: <PlatformSupportTickets /> },
          { path: 'system', element: <LibrarySystem /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['organisation_admin']} />,
    children: [
      {
        path: '/organisation',
        element: <OrganisationLayout />,
        children: [
          { index: true, element: <OrganisationOverview /> },
          { path: 'users', element: <ManageUsers /> },
          { path: 'invitations', element: <InvitationCodes /> },
          { path: 'renewals', element: <RenewalRequests /> },
          { path: 'tickets', element: <OrganisationSupportTickets /> },
        ],
      },
    ],
  },
  { element: <ProtectedRoute />, children: [{ path: '/library', element: <MemberHome /> }] },
  { path: '*', element: <NotFound /> },
];
