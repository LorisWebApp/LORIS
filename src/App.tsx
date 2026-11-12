import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from './integration/loris';
import ChatInterface from './pages/user/ChatInterface';
import NotConnected from './pages/user/NotConnected';
import OfflineLibrary from './pages/user/OfflineLibrary';
import { EndUserLayout } from './components/layout/EndUserLayout';
import ComponentShowcase from './pages/dev/ComponentShowcase';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTES.offlineLibrary} replace />} />
      {/* End User application: the layout mounts the floating assistant once for all pages below. */}
      <Route element={<EndUserLayout />}>
        <Route path={ROUTES.offlineLibrary} element={<OfflineLibrary />} />
        <Route path={ROUTES.assistant} element={<ChatInterface />} />
        {/* Owned by other groups – replaced during integration. */}
        <Route path="*" element={<NotConnected />} />
      </Route>
      <Route path="/showcase" element={<ComponentShowcase />} />
    </Routes>
  );
}
