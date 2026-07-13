// ============================================================
// App.jsx - ColorVerse Main Router
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
import Game from './pages/Game'
import Wallet from './pages/Wallet'
import Leaderboard from './pages/Leaderboard'
import Referral from './pages/Referral'
import Profile from './pages/Profile'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminDeposits from './pages/admin/AdminDeposits'
import AdminWithdrawals from './pages/admin/AdminWithdrawals'
import AdminGames from './pages/admin/AdminGames'
import AdminAnalytics from './pages/admin/AdminAnalytics'

// Route Guards
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

// Layout
import DashboardLayout from './layouts/DashboardLayout'
import AdminLayout from './layouts/AdminLayout'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a2e',
                color: '#e2e8f0',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: '12px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#22c55e', secondary: '#1a1a2e' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#1a1a2e' },
              },
            }}
          />

          <Routes>
            {/* ============================================================
                Public Routes
                ============================================================ */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />

            {/* Leaderboard - public */}
            <Route path="/leaderboard" element={<Leaderboard />} />

            {/* ============================================================
                Protected User Routes (inside Dashboard Layout)
                ============================================================ */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/game" element={<Game />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/referrals" element={<Referral />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>

            {/* ============================================================
                Admin Routes (inside Admin Layout)
                ============================================================ */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/deposits" element={<AdminDeposits />} />
                <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
                <Route path="/admin/games" element={<AdminGames />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
