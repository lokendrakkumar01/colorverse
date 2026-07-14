// ============================================================
// Admin Games Page - Color Prediction History & Custom Lobbies
// ============================================================
import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Gamepad2, Users, Check, X, ShieldAlert, Image } from 'lucide-react'
import toast from 'react-hot-toast'

const COLOR_HEX = {
  red: '#ef4444', green: '#22c55e', blue: '#3b82f6', yellow: '#eab308',
  purple: '#a855f7', orange: '#f97316', pink: '#ec4899', teal: '#14b8a6',
  coral: '#fb7185', lime: '#84cc16',
}

const AdminGames = () => {
  const [activeTab, setActiveTab] = useState('prediction') // 'prediction' | 'lobbies'
  
  // Color Prediction states
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // Custom lobbies states
  const [lobbies, setLobbies] = useState([])
  const [loadingLobbies, setLoadingLobbies] = useState(true)
  const [selectedLobbyScreenshot, setSelectedLobbyScreenshot] = useState(null)

  // Fetch Color prediction games
  useEffect(() => {
    if (activeTab === 'prediction') {
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
    }
  }, [page, activeTab])

  // Fetch pending lobbies
  const fetchPendingLobbies = async () => {
    setLoadingLobbies(true)
    try {
      const data = await api.get('/lobby/admin/pending')
      setLobbies(data.lobbies || [])
    } catch {
      toast.error('Failed to load pending lobbies')
    } finally {
      setLoadingLobbies(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'lobbies') {
      fetchPendingLobbies()
    }
  }, [activeTab])

  const handleResolveLobby = async (lobbyId, action) => {
    try {
      await api.post(`/lobby/admin/resolve/${lobbyId}`, { action })
      toast.success(`Match successfully ${action === 'approve' ? 'Approved' : 'Rejected'}!`)
      fetchPendingLobbies()
    } catch (err) {
      toast.error(err.message || 'Action failed')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-red-400" /> Game Management
        </h1>

        {/* Tab switchers */}
        <div className="flex gap-2 p-1 bg-dark-800 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('prediction')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all
              ${activeTab === 'prediction'
                ? 'bg-brand-600 text-white shadow-glow-sm'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            Color Prediction
          </button>
          <button
            onClick={() => setActiveTab('lobbies')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all
              ${activeTab === 'lobbies'
                ? 'bg-brand-600 text-white shadow-glow-sm'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            Custom Lobbies
          </button>
        </div>
      </div>

      {activeTab === 'prediction' ? (
        /* Color prediction history tab */
        <div className="space-y-4">
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
                      <td className="font-mono font-bold">₹{g.totalBetAmount}</td>
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
      ) : (
        /* Lobbies Verification tab */
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-5 space-y-4">
            <h2 className="font-semibold text-white">Pending Match Approvals</h2>
            
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Game</th>
                    <th>Players</th>
                    <th>Entry Bet</th>
                    <th>Win Claims</th>
                    <th>Screenshot</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingLobbies ? (
                    <tr><td colSpan={6} className="text-center py-8 text-slate-400">Loading...</td></tr>
                  ) : lobbies.length > 0 ? lobbies.map(lobby => (
                    <tr key={lobby._id}>
                      <td className="font-bold text-white">{lobby.gameName}</td>
                      <td className="text-slate-300 text-xs">
                        <span className="text-brand-400 font-semibold">{lobby.creator}</span> vs {lobby.opponent}
                      </td>
                      <td className="font-mono text-white">₹{lobby.amount}</td>
                      <td>
                        <span className="badge badge-success text-xs capitalize">{lobby.winner} claimed</span>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedLobbyScreenshot(lobby.screenshot)}
                          className="btn-secondary p-1.5 text-xs flex items-center gap-1"
                        >
                          <Image className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResolveLobby(lobby._id, 'approve')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-lg transition"
                            title="Approve Win"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleResolveLobby(lobby._id, 'reject')}
                            className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg transition"
                            title="Reject/Refund Match"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="text-center py-8 text-slate-500">No custom matches pending approval</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Screenshot Preview details panel */}
          <div className="glass-card p-5 space-y-4">
            <h2 className="font-semibold text-white">Screenshot Verification Proof</h2>
            {selectedLobbyScreenshot ? (
              <div className="space-y-4">
                <img
                  src={selectedLobbyScreenshot}
                  alt="Win Proof Verification"
                  className="w-full h-auto rounded-lg border border-slate-700 max-h-96 object-contain bg-black"
                />
                <button
                  onClick={() => setSelectedLobbyScreenshot(null)}
                  className="btn-secondary w-full py-2 text-xs"
                >
                  Close Preview
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <ShieldAlert className="w-8 h-8 opacity-40" />
                <p className="text-xs">Select "View" in table list to see player submitted victory proof screenshot</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminGames
