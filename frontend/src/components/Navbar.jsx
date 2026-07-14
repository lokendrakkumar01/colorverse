// ============================================================
// Navbar Component - Top Bar with Live Notifications Dropdown
// ============================================================
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import {
  Menu, Bell, Wifi, WifiOff, ChevronDown, LogOut,
  User, Settings, Wallet, Zap, CheckCircle2, ShieldAlert
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const Navbar = ({ onMenuClick }) => {
  const { user, wallet, logout } = useAuth()
  const { connected } = useSocket()
  const navigate = useNavigate()
  
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  
  const [notifs, setNotifs] = useState([])
  const [notifCount, setNotifCount] = useState(0)

  const profileRef = useRef(null)
  const notifRef = useRef(null)

  const fetchNotifCount = async () => {
    try {
      const data = await api.get('/users/notifications?limit=5')
      setNotifs(data.notifications || [])
      setNotifCount(data.unreadCount || 0)
    } catch {}
  }

  useEffect(() => {
    fetchNotifCount()
    const interval = setInterval(fetchNotifCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Refetch notifications on opening dropdown
  useEffect(() => {
    if (notifDropdownOpen) {
      fetchNotifCount()
    }
  }, [notifDropdownOpen])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/users/notifications/read-all')
      setNotifCount(0)
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success('All notifications marked as read')
    } catch {}
  }

  const handleReadSingle = async (id) => {
    try {
      await api.patch(`/users/notifications/${id}/read`)
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
      setNotifCount(prev => Math.max(0, prev - 1))
    } catch {}
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

          {/* Notifications Dropdown Container */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="relative p-2 text-slate-400 hover:text-white hover:bg-dark-400/60 rounded-xl transition"
            >
              <Bell className="w-5 h-5" />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-xs font-bold
                  w-4 h-4 rounded-full flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>

            {/* Notifications Menu */}
            {notifDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-dark-600 border border-dark-300/40
                rounded-xl shadow-card p-4 space-y-3 animate-slide-down z-50">
                <div className="flex justify-between items-center border-b border-dark-300/30 pb-2">
                  <span className="text-white text-xs font-bold">Notifications</span>
                  {notifCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-brand-400 hover:text-brand-300 text-xxs font-bold">
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notification Items List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                  {notifs.length > 0 ? notifs.map(n => (
                    <div
                      key={n._id}
                      onClick={() => handleReadSingle(n._id)}
                      className={`p-2.5 rounded-lg border text-xxs leading-relaxed transition cursor-pointer flex items-start gap-2.5
                        ${n.isRead
                          ? 'bg-dark-700/40 border-transparent text-slate-400'
                          : 'bg-brand-600/10 border-brand-500/20 text-slate-200'
                        }`}
                    >
                      <div className="mt-0.5">
                        {n.color === 'green' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : n.color === 'red' ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-brand-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <p className="font-bold text-white text-xxs">{n.title}</p>
                        <p className="text-slate-400 text-xxs leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center py-6 text-slate-500 text-xxs">No new notifications</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-dark-400/60 transition"
            >
              <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-600/40
                flex items-center justify-center text-brand-300 font-bold text-sm">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <span className="hidden md:block text-white text-sm font-medium">{user?.username}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-dark-600 border border-dark-300/40
                rounded-xl shadow-card py-1 animate-slide-down z-50">
                <Link
                  to="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-dark-400/60 text-sm"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Link
                  to="/wallet"
                  onClick={() => setProfileDropdownOpen(false)}
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
