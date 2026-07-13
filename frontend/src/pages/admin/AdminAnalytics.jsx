// Admin Analytics Page
import { useState, useEffect } from 'react'
import api from '../../services/api'
import { BarChart3, TrendingUp, DollarSign, Users, Gamepad2, Target } from 'lucide-react'

const AdminAnalytics = () => {
  const [data, setData] = useState(null)
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/admin/analytics?period=${period}`)
        setData(res)
      } catch {}
      finally { setLoading(false) }
    }
    fetch()
  }, [period])

  const s = data?.summary || {}

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-red-400" /> Analytics
        </h1>
        <div className="flex gap-1 bg-dark-700/60 p-1 rounded-xl border border-dark-300/30">
          {['7d', '30d', '90d', 'all'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all
                ${period === p ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {p === 'all' ? 'All Time' : p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Revenue (Deposits)', value: `₹${(s.totalDeposits || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-600/20' },
              { label: 'Payouts (Withdrawals)', value: `₹${(s.totalWithdrawals || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-red-400', bg: 'bg-red-600/20' },
              { label: 'House Profit', value: `₹${(s.houseProfit || 0).toLocaleString()}`, icon: Target, color: 'text-brand-400', bg: 'bg-brand-600/20' },
              { label: 'New Users', value: s.newUsers || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-600/20' },
              { label: 'Games Played', value: s.totalGames || 0, icon: Gamepad2, color: 'text-amber-400', bg: 'bg-amber-600/20' },
              { label: 'Avg Bet Size', value: `₹${(s.avgBetAmount || 0).toFixed(0)}`, icon: BarChart3, color: 'text-purple-400', bg: 'bg-purple-600/20' },
            ].map(item => (
              <div key={item.label} className="glass-card p-5 space-y-3">
                <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">{item.label}</p>
                  <p className={`text-2xl font-black font-mono ${item.color}`}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Color Win Distribution */}
          {data?.colorDistribution && (
            <div className="glass-card p-5 space-y-4">
              <h2 className="font-semibold text-white">Winning Color Distribution</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Object.entries(data.colorDistribution).map(([color, count]) => (
                  <div key={color} className="text-center space-y-2">
                    <div className="h-20 bg-dark-600 rounded-xl overflow-hidden flex flex-col-reverse">
                      <div
                        className="rounded-xl transition-all"
                        style={{
                          height: `${Math.max(5, (count / (data.totalRounds || 1)) * 100)}%`,
                          backgroundColor: { red:'#ef4444', green:'#22c55e', blue:'#3b82f6', yellow:'#eab308', purple:'#a855f7', orange:'#f97316', pink:'#ec4899', teal:'#14b8a6', coral:'#fb7185', lime:'#84cc16' }[color],
                        }}
                      />
                    </div>
                    <p className="text-slate-400 text-xs capitalize">{color}</p>
                    <p className="text-white text-xs font-bold">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Revenue Table */}
          {data?.daily && data.daily.length > 0 && (
            <div className="glass-card p-5 space-y-4">
              <h2 className="font-semibold text-white">Daily Summary</h2>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>New Users</th>
                      <th>Games</th>
                      <th>Deposits</th>
                      <th>Withdrawals</th>
                      <th>House Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.daily.map((day, i) => (
                      <tr key={i}>
                        <td className="text-slate-300 font-mono text-xs">{day.date}</td>
                        <td>{day.newUsers || 0}</td>
                        <td>{day.games || 0}</td>
                        <td className="text-emerald-400 font-mono">₹{day.deposits || 0}</td>
                        <td className="text-red-400 font-mono">₹{day.withdrawals || 0}</td>
                        <td className={`font-mono font-bold ${(day.profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {(day.profit || 0) >= 0 ? '+' : ''}₹{day.profit || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminAnalytics
