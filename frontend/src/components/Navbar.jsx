// ============================================================
// Navbar Component - Top Bar
// ============================================================
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import {
  Menu, Bell, Wifi, WifiOff, ChevronDown, LogOut,
  User, Settings, Wallet, Zap
} from 'lucide-react'
import api from '../services/api'

const Navbar = ({ onMenuClick }) => {
  const { user, wallet, logout } = useAuth()
  const { connected } = useSocket()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const dropdownRef = useRef(null)

  useEffect(() => {
    // Fetch unread notification count
    const fetchNotifCount = async () => {
      try {
        const data = await api.get('/users/notifications?limit=1')
        setNotifCount(data.unreadCount || 0)
      } catch {}
    }
    fetchNotifCount()
    const interval = setInterval(fetchNotifCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 bg-dark-700/80 backdrop-blur-xl border-b border-dark-300/30 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Menu button + Logo (mobile) */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-dark-400/60 rounded-lg transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-400" />
            <span className="font-display font-black text-white">
              Color<span className="text-gradient">Verse</span>
            </span>
          </div>
        </div>

        {/* Right: Stats + Connection + Profile */}
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
            ${connected
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {connected
              ? <><Wifi className="w-3 h-3" /> LIVE</>
              : <><WifiOff className="w-3 h-3" /> Offline</>
            }
          </div>

          {/* Wallet Balance */}
          <Link
            to="/wallet"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-700/20
              border border-brand-700/30 text-white text-sm font-semibold hover:bg-brand-700/30 transition"
          >
            <Wallet className="w-4 h-4 text-brand-400" />
            ₹{wallet?.balance?.toFixed(2) || '0.00'}
          </Link>

          {/* Notifications */}
          <Link
            to="/profile"
            className="relative p-2 text-slate-400 hover:text-white hover:bg-dark-400/60 rounded-xl transition"
          >
            <Bell className="w-5 h-5" />
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-xs font-bold
                w-4 h-4 rounded-full flex items-center justify-center">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </Link>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-dark-400/60 transition"
            >
              <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-600/40
                flex items-center justify-center text-brand-300 font-bold text-sm">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <span className="hidden md:block text-white text-sm font-medium">{user?.username}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-dark-600 border border-dark-300/40
                rounded-xl shadow-card py-1 animate-slide-down z-50">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-dark-400/60 text-sm"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Link
                  to="/wallet"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-dark-400/60 text-sm"
                >
                  <Wallet className="w-4 h-4" />
                  Wallet
                </Link>
                <hr className="my-1 border-dark-300/40" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
