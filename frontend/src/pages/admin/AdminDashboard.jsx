// ============================================================
// Admin Dashboard Page - System Settings & Finance Toggle
// ============================================================
import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Users, Gamepad2, CreditCard, ArrowDownCircle, TrendingUp, DollarSign, Shield, Activity, Sparkles, Settings, Percent } from 'lucide-react'
import toast from 'react-hot-toast'

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="glass-card p-5 space-y-3">
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-white text-2xl font-black font-mono">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  </div>
)

const AdminDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [gameMode, setGameMode] = useState('paid')
  const [commissionFee, setCommissionFee] = useState(10)
  
  const [updatingMode, setUpdatingMode] = useState(false)
  const [updatingFee, setUpdatingFee] = useState(false)

  const fetchDashboardData = async () => {
    try {
      const [dbRes, settingsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/settings')
      ])
      setData(dbRes)
      setGameMode(settingsRes.settings?.gameMode || 'paid')
      setCommissionFee(settingsRes.settings?.commissionFee !== undefined ? settingsRes.settings.commissionFee : 10)
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleToggleMode = async () => {
    const nextMode = gameMode === 'paid' ? 'free' : 'paid'
    try {
      setUpdatingMode(true)
      const res = await api.post('/admin/settings', { gameMode: nextMode })
      setGameMode(res.settings?.gameMode || nextMode)
      toast.success(`System set to ${nextMode === 'free' ? 'FREE PLAY' : 'PAID'} mode successfully!`)
    } catch (err) {
      toast.error(err.message || 'Failed to update system mode')
    } finally {
      setUpdatingMode(false)
    }
  }

  const handleUpdateFee = async () => {
    if (commissionFee < 0 || commissionFee > 50) {
      return toast.error('Commission fee must be between 0% and 50%')
    }
    try {
      setUpdatingFee(true)
      const res = await api.post('/admin/settings', { commissionFee })
      setCommissionFee(res.settings?.commissionFee !== undefined ? res.settings.commissionFee : commissionFee)
      toast.success(`Multiplayer lobby commission fee updated to ${commissionFee}% successfully!`)
    } catch (err) {
      toast.error(err.message || 'Failed to update commission fee')
    } finally {
      setUpdatingFee(false)
    }
  }

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
    </div>
  )

  const s = data?.stats || {}

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
        <Shield className="w-6 h-6 text-red-400" /> Admin Dashboard
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={s.users?.total || 0} sub={`+${s.users?.newToday || 0} today`} icon={Users} color="bg-blue-600/80" />
        <StatCard label="Active Users" value={s.users?.active || 0} sub={`${s.users?.banned || 0} banned`} icon={Activity} color="bg-emerald-600/80" />
        <StatCard label="Games Played" value={s.games?.completed || 0} sub={`${s.games?.total || 0} total rounds`} icon={Gamepad2} color="bg-brand-600/80" />
        <StatCard label="Pending Deposits" value={s.deposits?.pending || 0} sub={`${s.deposits?.total || 0} completed`} icon={CreditCard} color="bg-amber-600/80" />
        <StatCard label="Pending Withdrawals" value={s.withdrawals?.pending || 0} sub={`${s.withdrawals?.total || 0} total`} icon={ArrowDownCircle} color="bg-red-600/80" />
        <StatCard label="Total Deposited" value={`₹${(s.revenue?.totalDeposited || 0).toLocaleString()}`} sub={`Today: ₹${(s.revenue?.revenueToday || 0).toLocaleString()}`} icon={DollarSign} color="bg-emerald-600/80" />
        <StatCard label="Total Withdrawn" value={`₹${(s.revenue?.totalWithdrawn || 0).toLocaleString()}`} icon={TrendingUp} color="bg-orange-600/80" />
        <StatCard label="House Profit" value={`₹${(s.revenue?.houseProfit || 0).toLocaleString()}`} sub={`Bet: ₹${(s.revenue?.totalBet || 0).toLocaleString()}`} icon={TrendingUp} color="bg-purple-600/80" />
      </div>

      {/* System Configurations Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Game Mode Configuration */}
        <div className="glass-card p-6 bg-gradient-to-br from-dark-800 to-brand-950/20 border border-brand-500/20 rounded-2xl flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <h2 className="font-bold text-white text-md flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              Global Game Pricing Mode
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Toggle play style site-wide. Under <strong>Free Mode</strong>, all betting games are free for all users. Paid mode operates with real currency.
            </p>
          </div>
          <button
            onClick={handleToggleMode}
            disabled={updatingMode}
            className={`w-full py-3 rounded-xl font-display font-black text-xs whitespace-nowrap transition-all shadow-glow
              ${gameMode === 'free'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-glow-emerald'
                : 'bg-brand-600 hover:bg-brand-500 text-white'
              }`}
          >
            {updatingMode ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            ) : gameMode === 'free' ? (
              '🟢 FREE PLAY ACTIVE (Click to End)'
            ) : (
              '🔴 PAID MODE ACTIVE (Click to make Free)'
            )}
          </button>
        </div>

        {/* Commission Fee Configuration */}
        <div className="glass-card p-6 bg-gradient-to-br from-dark-800 to-accent/20 border border-brand-500/20 rounded-2xl flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <h2 className="font-bold text-white text-md flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-400" />
              Lobby Match Commission Rate
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Configure the cut kept by your platform from 1v1 challenges (like Ludo / Carrom). Default is <strong>10%</strong>. Max allowed is 50%.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input
                type="number"
                value={commissionFee}
                onChange={(e) => setCommissionFee(Math.max(0, Math.min(50, Number(e.target.value))))}
                className="input-field pl-9 pr-3 py-2 text-xs font-bold text-center"
                min={0}
                max={50}
              />
              <Percent className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={handleUpdateFee}
              disabled={updatingFee}
              className="btn-primary px-4 py-2.5 text-xs font-bold whitespace-nowrap"
            >
              {updatingFee ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Data */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="font-semibold text-white">Recent Users</h2>
          <div className="space-y-2">
            {data?.recentUsers?.map(u => (
              <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-600/40 transition">
                <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-600/40 flex items-center justify-center text-blue-300 text-sm font-bold">
                  {u.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{u.username}</p>
                  <p className="text-slate-500 text-xs">{u.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  {u.isBanned && <span className="badge badge-error text-xs">Banned</span>}
                  {!u.isEmailVerified && <span className="badge badge-warning text-xs">Unverified</span>}
                  {!u.isBanned && u.isEmailVerified && <span className="badge badge-success text-xs">Active</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Games */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="font-semibold text-white">Recent Games</h2>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Winner</th>
                  <th>Players</th>
                  <th>Total Bet</th>
                  <th>House P/L</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentGames?.map(g => (
                  <tr key={g._id}>
                    <td className="font-mono text-slate-400">#{g.roundNumber}</td>
                    <td>
                      <span className="capitalize font-medium">{g.winningColor}</span>
                    </td>
                    <td>{g.totalPlayers}</td>
                    <td className="font-mono">₹{g.totalBetAmount}</td>
                    <td className={`font-mono font-bold ${g.houseProfitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {g.houseProfitLoss >= 0 ? '+' : ''}₹{g.houseProfitLoss?.toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
