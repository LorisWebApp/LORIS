import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from './integration/loris';
import ChatInterface from './pages/user/ChatInterface';
import NotConnected from './pages/user/NotConnected';
import OfflineLibrary from './pages/user/OfflineLibrary';
import ComponentShowcase from './pages/dev/ComponentShowcase';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTES.offlineLibrary} replace />} />
      <Route path={ROUTES.offlineLibrary} element={<OfflineLibrary />} />
      <Route path={ROUTES.assistant} element={<ChatInterface />} />
      <Route path="/showcase" element={<ComponentShowcase />} />
      {/* Owned by other groups – replaced during integration. */}
      <Route path="*" element={<NotConnected />} />
    </Routes>
  );
}
