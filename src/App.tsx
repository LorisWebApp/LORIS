import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import RoleProtectedRoute from './components/layouts/RoleProtectedRoute'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Dashboard from './pages/Dashboard'

import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/layouts/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<RoleProtectedRoute allowedRoles={['end_user']} />}>
            <Route path="/user-dashboard" element={<Dashboard />} />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={['platform_manager']} />}>
            <Route path="/manager-dashboard" element={<Dashboard />} />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
           <Route path="/admin-dashboard" element={<Dashboard />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App