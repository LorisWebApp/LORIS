import type { RouteObject } from 'react-router-dom';
import { OrganisationLayout } from '../components/layouts/OrganisationLayout';
import { PlatformLayout } from '../components/layouts/PlatformLayout';
import { ProtectedRoute } from '../components/layouts/ProtectedRoute';
import { HomeRedirect } from '../pages/HomeRedirect';
import { MemberHome } from '../pages/library/MemberHome';
import { NotFound } from '../pages/NotFound';
import { InvitationCodes } from '../pages/organisation-admin/InvitationCodes';
import { ManageUsers } from '../pages/organisation-admin/ManageUsers';
import { OrganisationOverview } from '../pages/organisation-admin/OrganisationOverview';
import { RenewalRequests } from '../pages/organisation-admin/RenewalRequests';
import { SupportTickets as OrganisationSupportTickets } from '../pages/organisation-admin/SupportTickets';
import { PlatformSettings } from '../pages/platform-manager/PlatformSettings';
import { Organisations } from '../pages/platform-manager/Organisations';
import { Dashboard } from '../pages/platform-manager/Dashboard';
import { OrganisationRequests } from '../pages/platform-manager/OrganisationRequests';
import { OrganisationDetails } from '../pages/platform-manager/OrganisationDetails';
import { SupportTickets as PlatformSupportTickets } from '../pages/platform-manager/SupportTickets';
import { AccessManagement } from '../pages/platform-manager/AccessManagement';
import { ActivityLogs } from '../pages/platform-manager/ActivityLogs';
import { Notifications } from '../pages/platform-manager/Notifications';
import { PlatformUsers } from '../pages/platform-manager/PlatformUsers';
import { Renewals } from '../pages/platform-manager/Renewals';
import { SystemMonitoring } from '../pages/platform-manager/SystemMonitoring';
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
          { index: true, element: <Dashboard /> },
          { path: 'requests', element: <OrganisationRequests /> },
          { path: 'requests/:requestId', element: <OrganisationDetails /> },
          { path: 'organisations', element: <Organisations /> },
          { path: 'access', element: <AccessManagement /> },
          { path: 'renewals', element: <Renewals /> },
          { path: 'users', element: <PlatformUsers /> },
          { path: 'tickets', element: <PlatformSupportTickets /> },
          { path: 'notifications', element: <Notifications /> },
          { path: 'activity', element: <ActivityLogs /> },
          { path: 'monitoring', element: <SystemMonitoring /> },
          { path: 'system', element: <PlatformSettings /> },
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
