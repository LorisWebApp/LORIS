import { Navigate, Route, Routes } from 'react-router-dom';
import { PlatformLayout } from './components/layouts/PlatformLayout';
import ForgotPassword from './pages/auth/ForgotPassword';
import Login from './pages/auth/Login';
import { AccessManagement } from './pages/platform-manager/AccessManagement';
import { ActivityLogs } from './pages/platform-manager/ActivityLogs';
import { Dashboard } from './pages/platform-manager/Dashboard';
import { Notifications } from './pages/platform-manager/Notifications';
import { OrganisationDetails } from './pages/platform-manager/OrganisationDetails';
import { OrganisationRequests } from './pages/platform-manager/OrganisationRequests';
import { Organisations } from './pages/platform-manager/Organisations';
import { PlatformSettings } from './pages/platform-manager/PlatformSettings';
import { PlatformUsers } from './pages/platform-manager/PlatformUsers';
import { Renewals } from './pages/platform-manager/Renewals';
import { SupportTickets } from './pages/platform-manager/SupportTickets';
import { SystemMonitoring } from './pages/platform-manager/SystemMonitoring';
import OrganisationRegistration from './pages/public/OrganisationRegistration';
import RegistrationPending from './pages/public/RegistrationPending';
import { ROUTES } from './utils/constants';

export default function App() {
  return (
    <Routes>
      <Route path={ROUTES.organisationLogin} element={<Login portal="organisation" />} />
      <Route path={ROUTES.organisationRegister} element={<OrganisationRegistration />} />
      <Route path="/organisation/registration/:reference" element={<RegistrationPending />} />
      <Route path={ROUTES.platformLogin} element={<Login portal="platform" />} />
      <Route path={ROUTES.forgotPassword} element={<ForgotPassword />} />

      <Route path={ROUTES.platformDashboard} element={<PlatformLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="requests" element={<OrganisationRequests />} />
        <Route path="requests/:requestId" element={<OrganisationDetails />} />
        <Route path="organisations" element={<Organisations />} />
        <Route path="renewals" element={<Renewals />} />
        <Route path="support-tickets" element={<SupportTickets />} />
        <Route path="access-management" element={<AccessManagement />} />
        <Route path="platform-users" element={<PlatformUsers />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="activity-logs" element={<ActivityLogs />} />
        <Route path="system-monitoring" element={<SystemMonitoring />} />
        <Route path="system" element={<PlatformSettings />} />
        <Route path="*" element={<Navigate to={ROUTES.platformDashboard} replace />} />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.organisationLogin} replace />} />
    </Routes>
  );
}
