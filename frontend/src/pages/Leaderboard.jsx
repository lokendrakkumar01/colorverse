// ============================================================
// Leaderboard Page - ColorVerse
// ============================================================
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Trophy, TrendingUp, Gamepad2, Medal, Crown, Star, Zap } from 'lucide-react'

const TABS = [
  { key: 'earnings', label: 'Top Earners', icon: TrendingUp },
  { key: 'wins', label: 'Most Wins', icon: Trophy },
  { key: 'games', label: 'Most Active', icon: Gamepad2 },
]

const RANK_ICONS = ['🥇', '🥈', '🥉']

const Leaderboard = () => {
  const { isAuthenticated } = useAuth()
  const [type, setType] = useState('earnings')
  const [period, setPeriod] = useState('all')
  const [leaders, setLeaders] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [type, period])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const data = await api.get(`/leaderboard?type=${type}&period=${period}&limit=50`)
      setLeaders(data.leaderboard || [])
      setMyRank(data.myRank)
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-dark-900 relative">
      <div className="fixed inset-0 bg-grid opacity-10 pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-64 h-64 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-2 text-amber-400 text-sm">
            <Crown className="w-4 h-4" />
            Global Rankings
          </div>
          <h1 className="text-4xl font-display font-black text-white">
            <span className="text-gradient-gold">Leaderboard</span>
          </h1>
          <p className="text-slate-400">Top players competing on ColorVerse</p>
          {!isAuthenticated && (
            <Link to="/register" className="btn-primary text-sm py-2 px-6 inline-flex items-center gap-2">
              <Zap className="w-4 h-4" /> Join to Compete
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-1 bg-dark-700/60 p-1 rounded-xl border border-dark-300/30">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${type === t.key ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-dark-700/60 p-1 rounded-xl border border-dark-300/30">
            {['all', 'weekly', 'monthly'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all
                  ${period === p ? 'bg-dark-400 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {p === 'all' ? 'All Time' : p}
              </button>
            ))}
          </div>
        </div>

        {/* My Rank Banner */}
        {myRank && isAuthenticated && (
          <div className="glass-card p-4 border-brand-600/30 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-600/30 border border-brand-600/40 flex items-center justify-center text-brand-400 font-black text-lg">
              #{myRank}
            </div>
            <div>
              <p className="text-white font-semibold">Your Rank</p>
              <p className="text-slate-400 text-sm">Keep playing to climb the leaderboard!</p>
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        {!loading && leaders.length >= 3 && (
          <div className="grid grid-cols-3 gap-4">
            {/* 2nd Place */}
            <div className="glass-card p-4 text-center mt-6 space-y-2">
              <div className="text-2xl">🥈</div>
              <div className="w-12 h-12 rounded-full bg-slate-500/30 border-2 border-slate-500/40 flex items-center justify-center text-white font-bold text-lg mx-auto">
                {leaders[1]?.username?.[0]?.toUpperCase()}
              </div>
              <p className="text-white font-semibold text-sm truncate">{leaders[1]?.username}</p>
              <p className="text-emerald-400 font-bold font-mono text-sm">
                {type === 'earnings' ? `₹${leaders[1]?.totalEarnings?.toLocaleString()}` :
                 type === 'wins' ? `${leaders[1]?.totalWins} wins` :
                 `${leaders[1]?.totalGames} games`}
              </p>
            </div>

            {/* 1st Place */}
            <div className="glass-card p-5 text-center border-amber-500/30 bg-amber-500/5 space-y-2 relative">
              <Crown className="w-6 h-6 text-amber-400 mx-auto animate-bounce-slow" />
              <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-white font-black text-xl mx-auto">
                {leaders[0]?.username?.[0]?.toUpperCase()}
              </div>
              <p className="text-white font-bold truncate">{leaders[0]?.username}</p>
              <p className="text-amber-400 font-black font-mono">
                {type === 'earnings' ? `₹${leaders[0]?.totalEarnings?.toLocaleString()}` :
                 type === 'wins' ? `${leaders[0]?.totalWins} wins` :
                 `${leaders[0]?.totalGames} games`}
              </p>
              <div className="absolute inset-0 rounded-xl bg-amber-400/5 pointer-events-none" />
            </div>

            {/* 3rd Place */}
            <div className="glass-card p-4 text-center mt-10 space-y-2">
              <div className="text-2xl">🥉</div>
              <div className="w-12 h-12 rounded-full bg-amber-900/30 border-2 border-amber-900/40 flex items-center justify-center text-white font-bold text-lg mx-auto">
                {leaders[2]?.username?.[0]?.toUpperCase()}
              </div>
              <p className="text-white font-semibold text-sm truncate">{leaders[2]?.username}</p>
              <p className="text-emerald-400 font-bold font-mono text-sm">
                {type === 'earnings' ? `₹${leaders[2]?.totalEarnings?.toLocaleString()}` :
                 type === 'wins' ? `${leaders[2]?.totalWins} wins` :
                 `${leaders[2]?.totalGames} games`}
              </p>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="glass-card p-5 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
            </div>
          ) : leaders.length > 0 ? (
            <div className="space-y-2">
              {leaders.map((player, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all
                    ${index < 3 ? 'bg-dark-600/60' : 'hover:bg-dark-600/30'}`}
                >
                  {/* Rank */}
                  <div className={`w-8 text-center font-black font-mono
                    ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-700' : 'text-slate-500'}`}>
                    {index < 3 ? RANK_ICONS[index] : `#${player.rank}`}
                  </div>

                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-sm
                    ${index === 0 ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' :
                      index === 1 ? 'border-slate-500/50 bg-slate-500/10 text-slate-400' :
                      index === 2 ? 'border-amber-800/50 bg-amber-900/10 text-amber-700' :
                      'border-dark-300/40 bg-dark-400/60 text-slate-400'}`}
                  >
                    {player.username?.[0]?.toUpperCase()}
                  </div>

                  {/* Name & Stats */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{player.username}</p>
                    <p className="text-slate-500 text-xs">{player.totalGames} games • {player.winRate}% win rate</p>
                  </div>

                  {/* Main Stat */}
                  <div className="text-right">
                    <p className={`font-mono font-bold ${index < 3 ? 'text-white' : 'text-slate-300'}`}>
                      {type === 'earnings' ? `₹${player.totalEarnings?.toLocaleString()}` :
                       type === 'wins' ? `${player.totalWins} wins` :
                       `${player.totalGames} games`}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {type === 'earnings' ? `${player.totalWins} wins` :
                       type === 'wins' ? `₹${player.totalEarnings?.toLocaleString()}` :
                       `${player.winRate}% win`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">No players found</p>
          )}
        </div>

        {/* Footer CTA */}
        {!isAuthenticated && (
          <div className="text-center glass-card p-8 space-y-4">
            <Star className="w-10 h-10 text-amber-400 mx-auto" />
            <p className="text-white font-bold text-xl">Want to be on this list?</p>
            <Link to="/register" className="btn-primary py-3 px-8 inline-flex items-center gap-2">
              <Zap className="w-4 h-4" /> Start Playing Now
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard
