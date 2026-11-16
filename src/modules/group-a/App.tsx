import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from './contexts/AuthContext'

import LandingPage from './pages/LandingPage'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Personal account authentication */}
          <Route path="/personal/login" element={<Login />} />
          <Route path="/personal/register" element={<Register />} />

          {/* Password recovery */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Redirect old login links */}
          <Route
            path="/login"
            element={<Navigate to="/personal/login" replace />}
          />

          {/* Organisation routes - pending Nathan's implementation */}

          {/* Unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App