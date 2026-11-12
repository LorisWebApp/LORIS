import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from './integration/loris';
import ChatInterface from './pages/user/ChatInterface';
import NotConnected from './pages/user/NotConnected';
import OfflineLibrary from './pages/user/OfflineLibrary';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTES.offlineLibrary} replace />} />
      <Route path={ROUTES.offlineLibrary} element={<OfflineLibrary />} />
      <Route path={ROUTES.assistant} element={<ChatInterface />} />
      {/* Owned by other groups – replaced during integration. */}
      <Route path="*" element={<NotConnected />} />
    </Routes>
  );
}
