// ============================================================
// Sidebar Component - ColorVerse
// ============================================================
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Gamepad2, Wallet, Trophy, Users,
  User, LogOut, X, Zap, Settings, MessageSquare
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/game', label: 'Play Game', icon: Gamepad2, highlight: true },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/referrals', label: 'Referrals', icon: Users },
  { to: '/profile', label: 'Profile', icon: User },
]

const Sidebar = ({ open, onClose }) => {
  const { user, wallet, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
    onClose()
  }

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col
          bg-dark-700/95 backdrop-blur-xl border-r border-brand-700/20
          transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-dark-300/30">
          <div className="flex items-center justify-between">
            <NavLink to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gaming-gradient flex items-center justify-center shadow-glow animate-glow">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-display font-black text-xl text-white tracking-wide">
                  Color<span className="text-gradient">Verse</span>
                </p>
                <p className="text-xs text-slate-500">Gaming Platform</p>
              </div>
            </NavLink>
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="mx-4 mt-4 p-4 rounded-xl bg-gradient-to-br from-brand-700/20 to-accent/10 border border-brand-700/30">
          <p className="text-slate-400 text-xs font-medium mb-1">Wallet Balance</p>
          <p className="text-white text-2xl font-black font-mono">
            ₹{wallet?.balance?.toFixed(2) || '0.00'}
          </p>
          <p className="text-brand-400 text-xs mt-1">
            Bonus: ₹{wallet?.bonusBalance?.toFixed(2) || '0.00'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map(({ to, label, icon: Icon, highlight }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                ${highlight
                  ? isActive
                    ? 'bg-brand-600/40 text-white border border-brand-500/40 shadow-glow-sm'
                    : 'bg-brand-600/20 text-brand-400 border border-brand-600/30 hover:bg-brand-600/30 hover:text-white'
                  : isActive
                    ? 'bg-dark-400/80 text-white border border-dark-300/40'
                    : 'text-slate-400 hover:text-white hover:bg-dark-400/60'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
              {highlight && (
                <span className="ml-auto text-xs bg-brand-600/30 text-brand-400 px-2 py-0.5 rounded-full border border-brand-600/30">
                  LIVE
                </span>
              )}
            </NavLink>
          ))}

          {/* Admin Link */}
          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 mt-2
                ${isActive
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                }`
              }
            >
              <Settings className="w-5 h-5" />
              Admin Panel
              <span className="ml-auto text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                ADMIN
              </span>
            </NavLink>
          )}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-dark-300/30 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-brand-600/30 border border-brand-600/40 flex items-center justify-center text-brand-300 font-bold text-sm">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.username}</p>
              <p className="text-slate-500 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400
              hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
