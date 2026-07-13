// ============================================================
// Admin Dashboard Page
// ============================================================
import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Users, Gamepad2, CreditCard, ArrowDownCircle, TrendingUp, DollarSign, Shield, Activity } from 'lucide-react'

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

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/admin/dashboard')
        setData(res)
      } catch {}
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
    </div>
  )

  const s = data?.stats || {}

  return (
    <div className="space-y-6 animate-fade-in">
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
