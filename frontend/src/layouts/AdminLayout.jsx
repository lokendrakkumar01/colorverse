// ============================================================
// Admin Layout
// ============================================================
import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, CreditCard, ArrowDownCircle,
  Gamepad2, BarChart3, LogOut, Menu, X, ChevronRight, Shield
} from 'lucide-react'

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/deposits', label: 'Deposits', icon: CreditCard },
  { to: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowDownCircle },
  { to: '/admin/games', label: 'Games', icon: Gamepad2 },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-dark-900">
      {/* Sidebar */}
      <>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/70 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed top-0 left-0 h-full w-64 bg-dark-700/95 backdrop-blur-md border-r border-dark-300/40
            flex flex-col z-50 transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        >
          {/* Logo */}
          <div className="p-6 border-b border-dark-300/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-display font-bold text-white">ColorVerse</p>
                <p className="text-xs text-red-400 font-medium">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {adminNav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                  ${isActive
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-dark-400/60'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User / Logout */}
          <div className="p-4 border-t border-dark-300/40 space-y-3">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-sm font-bold">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.username}</p>
                <p className="text-red-400 text-xs">Administrator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400
                hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </aside>
      </>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-dark-700/80 backdrop-blur-md border-b border-dark-300/40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-white font-semibold text-lg">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-2 text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20">
              <Shield className="w-3 h-3" />
              Admin Access
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
