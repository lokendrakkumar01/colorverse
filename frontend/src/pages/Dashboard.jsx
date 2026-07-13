// ============================================================
// Dashboard Page - ColorVerse
// ============================================================
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import api from '../services/api'
import {
  Gamepad2, TrendingUp, TrendingDown, Wallet, Trophy,
  ArrowRight, Target, BarChart3, Clock, Zap, RefreshCw,
  ChevronRight, Circle
} from 'lucide-react'

const COLOR_MAP = {
  red: '#ef4444', green: '#22c55e', blue: '#3b82f6', yellow: '#eab308',
  purple: '#a855f7', orange: '#f97316', pink: '#ec4899', teal: '#14b8a6',
  coral: '#fb7185', lime: '#84cc16',
}

const StatCard = ({ icon: Icon, label, value, sub, color, to }) => (
  <Link to={to || '#'} className="glass-card p-5 hover:border-brand-600/30 transition-all hover:-translate-y-0.5 group">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
    </div>
    <p className="text-slate-400 text-sm font-medium">{label}</p>
    <p className="text-white text-2xl font-black font-mono mt-1">{value}</p>
    {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
  </Link>
)

const Dashboard = () => {
  const { user, wallet } = useAuth()
  const { currentGame, countdown, lastResult, recentRounds } = useSocket()
  const [transactions, setTransactions] = useState([])
  const [gameHistory, setGameHistory] = useState([])
  const [loadingTx, setLoadingTx] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txRes, gameRes] = await Promise.all([
          api.get('/wallet/transactions?limit=5'),
          api.get('/game/history?limit=5'),
        ])
        setTransactions(txRes.transactions || [])
        setGameHistory(gameRes.games || [])
      } catch {}
      finally { setLoadingTx(false) }
    }
    fetchData()
  }, [])

  const profitLoss = (user?.totalWinAmount || 0) - (user?.totalLossAmount || 0)
  const winRate = user?.totalGames > 0
    ? ((user.totalWins / user.totalGames) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">
            Welcome back, <span className="text-gradient">{user?.username}</span>! 🎮
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {!user?.isEmailVerified && (
              <span className="text-amber-400">⚠️ Please verify your email to unlock all features. </span>
            )}
            Ready to play? A new round starts every 30 seconds.
          </p>
        </div>
        <Link to="/game" className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Gamepad2 className="w-4 h-4" />
          Play Now
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Wallet}
          label="Wallet Balance"
          value={`₹${wallet?.balance?.toFixed(2) || '0.00'}`}
          sub={`Bonus: ₹${wallet?.bonusBalance?.toFixed(0) || '0'}`}
          color="bg-brand-600/80"
          to="/wallet"
        />
        <StatCard
          icon={Gamepad2}
          label="Total Games"
          value={user?.totalGames || 0}
          sub={`${user?.totalWins || 0} wins • ${user?.totalLosses || 0} losses`}
          color="bg-blue-600/80"
          to="/game"
        />
        <StatCard
          icon={Trophy}
          label="Win Rate"
          value={`${winRate}%`}
          sub={`${user?.totalWins || 0} successful predictions`}
          color="bg-amber-600/80"
          to="/game"
        />
        <StatCard
          icon={profitLoss >= 0 ? TrendingUp : TrendingDown}
          label="Profit / Loss"
          value={`${profitLoss >= 0 ? '+' : ''}₹${profitLoss.toFixed(2)}`}
          sub={`Bet: ₹${(user?.totalBetAmount || 0).toFixed(0)} • Won: ₹${(user?.totalWinAmount || 0).toFixed(0)}`}
          color={profitLoss >= 0 ? 'bg-emerald-600/80' : 'bg-red-600/80'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Live Game Status */}
        <div className="lg:col-span-1 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-fast" />
              Live Round
            </h2>
            {currentGame && (
              <span className="text-xs text-slate-400 font-mono">#{currentGame.roundNumber}</span>
            )}
          </div>

          {currentGame ? (
            <div className="space-y-4">
              {/* Timer */}
              <div className="flex flex-col items-center py-4">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="#1a1a2e" strokeWidth="6" />
                    <circle
                      cx="48" cy="48" r="40" fill="none"
                      stroke={countdown > 10 ? '#7c3aed' : '#ef4444'}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - countdown / 30)}`}
                      className="timer-circle"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className={`text-2xl font-black font-mono ${countdown <= 5 ? 'text-red-400 animate-pulse-fast' : 'text-white'}`}>
                      {countdown}
                    </span>
                    <span className="text-slate-500 text-xs">sec</span>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mt-2">
                  {currentGame.status === 'betting' && countdown > 5 ? 'Betting Open' :
                   currentGame.status === 'betting' && countdown <= 5 ? 'Closing Soon!' :
                   currentGame.status === 'processing' ? 'Determining Result...' :
                   'Round Complete'}
                </p>
              </div>

              {/* Players & Bets */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-dark-700/60 rounded-xl p-3 text-center">
                  <p className="text-slate-400 text-xs">Players</p>
                  <p className="text-white font-bold">{currentGame.totalPlayers || 0}</p>
                </div>
                <div className="bg-dark-700/60 rounded-xl p-3 text-center">
                  <p className="text-slate-400 text-xs">Total Bet</p>
                  <p className="text-white font-bold">₹{currentGame.totalBetAmount?.toLocaleString() || 0}</p>
                </div>
              </div>

              <Link to="/game" className="btn-primary w-full text-center flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                Place Bet
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin-slow" />
              <p className="text-sm">Loading game...</p>
            </div>
          )}

          {/* Last Result */}
          {lastResult && (
            <div className="border-t border-dark-300/30 pt-4 space-y-2">
              <p className="text-slate-400 text-xs font-medium">Last Result</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white/20 shadow-lg"
                  style={{ backgroundColor: COLOR_MAP[lastResult.winningColor] }}
                />
                <div>
                  <p className="text-white font-semibold capitalize">{lastResult.winningColor}</p>
                  <p className="text-slate-500 text-xs">Round #{lastResult.roundNumber}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent Transactions</h2>
            <Link to="/wallet" className="text-brand-400 text-sm hover:text-brand-300 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loadingTx ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="skeleton h-12 rounded-xl" />
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-600/40 transition">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg
                    ${tx.type === 'game_win' || tx.type === 'deposit' || tx.type === 'referral_bonus'
                      ? 'bg-emerald-500/20'
                      : 'bg-red-500/20'
                    }`}>
                    {tx.type === 'game_win' ? '🏆' :
                     tx.type === 'game_bet' ? '🎯' :
                     tx.type === 'deposit' ? '💰' :
                     tx.type === 'withdrawal' ? '💸' :
                     tx.type === 'referral_bonus' ? '🎁' : '📊'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-slate-500 text-xs">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`font-mono font-bold text-sm whitespace-nowrap ${
                    tx.type === 'game_win' || tx.type === 'deposit' || tx.type === 'referral_bonus'
                      ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {tx.type === 'game_win' || tx.type === 'deposit' || tx.type === 'referral_bonus' ? '+' : '-'}₹{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 gap-3 text-slate-400">
              <BarChart3 className="w-10 h-10 opacity-40" />
              <p className="text-sm">No transactions yet. Start playing!</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Game History */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Recent Game History</h2>
          <Link to="/game" className="text-brand-400 text-sm hover:text-brand-300 flex items-center gap-1">
            Full History <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {gameHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>My Color</th>
                  <th>Winning Color</th>
                  <th>Bet</th>
                  <th>Result</th>
                  <th>Win Amount</th>
                </tr>
              </thead>
              <tbody>
                {gameHistory.map(g => (
                  <tr key={g.roundNumber}>
                    <td className="font-mono text-slate-400">#{g.roundNumber}</td>
                    <td>
                      {g.myBet && (
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLOR_MAP[g.myBet.color] }} />
                          <span className="capitalize">{g.myBet.color}</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLOR_MAP[g.winningColor] }} />
                        <span className="capitalize">{g.winningColor}</span>
                      </span>
                    </td>
                    <td className="font-mono">₹{g.myBet?.amount || '-'}</td>
                    <td>
                      <span className={`badge ${g.myBet?.result === 'win' ? 'badge-success' : 'badge-error'}`}>
                        {g.myBet?.result?.toUpperCase() || '-'}
                      </span>
                    </td>
                    <td className={`font-mono font-bold ${g.myBet?.result === 'win' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {g.myBet?.result === 'win' ? `+₹${g.myBet.winAmount}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8 gap-3 text-slate-400">
            <Gamepad2 className="w-10 h-10 opacity-40" />
            <p className="text-sm">No games played yet. Let's change that!</p>
            <Link to="/game" className="btn-primary text-sm py-2 px-4">
              Play First Game
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
