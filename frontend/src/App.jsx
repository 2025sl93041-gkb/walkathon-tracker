import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Sidebar from './components/Sidebar'
import { Routes, Route } from 'react-router-dom'

import Login from './pages/Login'
import Register from './pages/Register'

import MemberDashboard from './pages/member/Dashboard'
import MemberGrouping from './pages/member/Grouping'
import MemberDailyLog from './pages/member/DailyLog'
import MemberLeaderboard from './pages/member/Leaderboard'
import MemberResults from './pages/member/Results'

import AdminDashboard from './pages/admin/Dashboard'
import AdminEventConfig from './pages/admin/EventConfig'
import AdminUsers from './pages/admin/Users'
import AdminGrouping from './pages/admin/Grouping'
import AdminLogs from './pages/admin/Logs'
import AdminLeaderboard from './pages/admin/Leaderboard'
import AdminResults from './pages/admin/Results'

function RoleLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-60 pt-16 lg:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="spinner" /></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }
  return <Outlet />
}

function RootRedirect() {
  const { isAuthenticated, user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="spinner" /></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Member routes */}
      <Route element={<ProtectedRoute allowedRoles={['member', 'admin']} />}>
        <Route element={<RoleLayout />}>
          <Route path="/dashboard" element={<MemberDashboard />} />
          <Route path="/grouping" element={<MemberGrouping />} />
          <Route path="/daily-log" element={<MemberDailyLog />} />
          <Route path="/leaderboard" element={<MemberLeaderboard />} />
          <Route path="/results" element={<MemberResults />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<RoleLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/event" element={<AdminEventConfig />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/grouping" element={<AdminGrouping />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/leaderboard" element={<AdminLeaderboard />} />
          <Route path="/admin/results" element={<AdminResults />} />
        </Route>
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
