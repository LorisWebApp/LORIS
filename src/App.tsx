import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './modules/group-a/pages/LandingPage';
import AccountTypeSelect from './modules/group-a/pages/AccountTypeSelect';
import Login from './modules/group-a/pages/auth/Login';
import Register from './modules/group-a/pages/auth/Register';
import ForgotPassword from './modules/group-a/pages/auth/ForgotPassword';
import ResetPassword from './modules/group-a/pages/auth/ResetPassword';
import { GlobalLayout, PublicOnly, RequireRole } from './components/layout/GlobalLayout';
import Catalogue from './modules/group-b/pages/Catalogue';
import MaterialDetails from './modules/group-b/pages/MaterialDetails';
import OrganisationOverview from './modules/group-b/pages/OrganisationOverview';
import ManageMaterials from './modules/group-b/pages/ManageMaterials';
import Members from './modules/group-b/pages/Members';
import UploadMaterial from './modules/group-b/pages/UploadMaterial';
import Dashboard from './modules/group-c/pages/user/Dashboard';
import Favourites from './modules/group-c/pages/user/Favourites';
import NotesAndBookmarks from './modules/group-c/pages/user/NotesAndBookmarks';
import Profile from './modules/group-c/pages/user/Profile';
import Settings from './modules/group-c/pages/user/Settings';
import Support from './modules/group-c/pages/user/Support';
import { OfflineActionsProvider } from './modules/group-c/components/user/OfflineActionsContext';
import Reader from './modules/group-c/pages/user/Reader';
import OfflineLibrary from './pages/user/OfflineLibrary';
import OfflineEpubReader from './pages/user/OfflineEpubReader';
import OfflineViewer from './pages/user/OfflineViewer';
import ComponentShowcase from './pages/dev/ComponentShowcase';
import PlatformDashboard from './pages/platform/PlatformDashboard';
import PlatformOrganisations from './pages/platform/PlatformOrganisations';
import OrganisationRequests from './pages/platform/OrganisationRequests';
import { OrganisationRegistration } from './modules/nathan/pages/public/OrganisationRegistration';

export default function App() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/personal/login" element={<PublicOnly><Login /></PublicOnly>} />
    <Route path="/organisation/login" element={<PublicOnly adminOnly><Login /></PublicOnly>} />
    <Route path="/personal/register" element={<PublicOnly><Register /></PublicOnly>} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/organisation-registration" element={<OrganisationRegistration />} />
    <Route path="/login" element={<PublicOnly><AccountTypeSelect mode="login" /></PublicOnly>} />
    <Route path="/register" element={<PublicOnly><AccountTypeSelect mode="register" /></PublicOnly>} />

    <Route element={<GlobalLayout />}>
      <Route path="/dashboard" element={<RequireRole role="end_user"><OfflineActionsProvider><Dashboard /></OfflineActionsProvider></RequireRole>} />
      <Route path="/catalogue" element={<Catalogue />} />
      <Route path="/material/:id" element={<MaterialDetails />} />
      <Route path="/user/my-library" element={<RequireRole role="end_user"><OfflineActionsProvider><Favourites /></OfflineActionsProvider></RequireRole>} />
      <Route path="/user/favourites" element={<RequireRole role="end_user"><OfflineActionsProvider><Favourites /></OfflineActionsProvider></RequireRole>} />
      <Route path="/user/notes-bookmarks" element={<RequireRole role="end_user"><NotesAndBookmarks /></RequireRole>} />
      <Route path="/user/profile" element={<RequireRole role="end_user"><Profile /></RequireRole>} />
      <Route path="/user/settings" element={<RequireRole role="end_user"><Settings /></RequireRole>} />
      <Route path="/user/support" element={<RequireRole role="end_user"><Support /></RequireRole>} />
      <Route path="/user/reader/:id" element={<RequireRole role="end_user"><Reader /></RequireRole>} />
      <Route path="/offline-library" element={<RequireRole role="end_user"><OfflineLibrary /></RequireRole>} />
      <Route path="/offline-library/downloads" element={<RequireRole role="end_user"><Navigate to="/offline-library" replace /></RequireRole>} />
      <Route path="/offline-viewer/:id" element={<RequireRole role="end_user"><OfflineViewer /></RequireRole>} />
      <Route path="/offline-reader/:id" element={<RequireRole role="end_user"><OfflineEpubReader /></RequireRole>} />
      <Route path="/manage" element={<RequireRole role="admin"><OrganisationOverview /></RequireRole>} />
      <Route path="/manage/materials" element={<RequireRole role="admin"><ManageMaterials /></RequireRole>} />
      {/* Group B's updated dashboard links to /manage/table; keep it as a compatible alias. */}
      <Route path="/manage/table" element={<RequireRole role="admin"><ManageMaterials /></RequireRole>} />
      <Route path="/manage/members" element={<RequireRole role="admin"><Members /></RequireRole>} />
      <Route path="/upload" element={<RequireRole role="admin"><UploadMaterial /></RequireRole>} />
      <Route path="/platform" element={<RequireRole role="platform_manager"><PlatformDashboard /></RequireRole>} />
      <Route path="/platform/dashboard" element={<RequireRole role="platform_manager"><PlatformDashboard /></RequireRole>} />
      <Route path="/platform/organisations" element={<RequireRole role="platform_manager"><PlatformOrganisations /></RequireRole>} />
      <Route path="/platform/requests" element={<RequireRole role="platform_manager"><OrganisationRequests /></RequireRole>} />
      <Route path="/showcase" element={<ComponentShowcase />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
