// Admin Games Page
import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Gamepad2 } from 'lucide-react'

const COLOR_HEX = {
  red: '#ef4444', green: '#22c55e', blue: '#3b82f6', yellow: '#eab308',
  purple: '#a855f7', orange: '#f97316', pink: '#ec4899', teal: '#14b8a6',
  coral: '#fb7185', lime: '#84cc16',
}

const AdminGames = () => {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const data = await api.get(`/admin/games?page=${page}&limit=20`)
        setGames(data.games || [])
        setTotal(data.pagination?.total || 0)
      } catch {}
      finally { setLoading(false) }
    }
    fetch()
  }, [page])

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
        <Gamepad2 className="w-6 h-6 text-red-400" /> Game History
        <span className="text-slate-400 text-base font-normal">({total} rounds)</span>
      </h1>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Round</th>
                <th>Period</th>
                <th>Winner</th>
                <th>Players</th>
                <th>Total Bet</th>
                <th>Win Paid</th>
                <th>House P/L</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : games.map(g => (
                <tr key={g._id}>
                  <td className="font-mono text-slate-400">#{g.roundNumber}</td>
                  <td className="font-mono text-xs text-slate-500">{g.period}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: COLOR_HEX[g.winningColor] }} />
                      <span className="capitalize">{g.winningColor}</span>
                    </div>
                  </td>
                  <td>{g.totalPlayers}</td>
                  <td className="font-mono">₹{g.totalBetAmount}</td>
                  <td className="font-mono text-amber-400">₹{g.totalWinAmount?.toFixed(0) || 0}</td>
                  <td className={`font-mono font-bold ${g.houseProfitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {g.houseProfitLoss >= 0 ? '+' : ''}₹{g.houseProfitLoss?.toFixed(0) || 0}
                  </td>
                  <td className="text-slate-400 text-xs">
                    {new Date(g.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-slate-400 text-sm">Page {page}</p>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Prev</button>
          <button onClick={() => setPage(p => p+1)} disabled={games.length < 20} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  )
}

export default AdminGames
