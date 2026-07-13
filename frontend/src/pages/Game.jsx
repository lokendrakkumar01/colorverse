// ============================================================
// Game Page - ColorVerse (The Core Feature)
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Zap, Trophy, Clock, Users, TrendingUp, AlertCircle, CheckCircle, X, Minus, Plus } from 'lucide-react'

const COLORS = [
  { name: 'red',    hex: '#ef4444', label: 'Red',    emoji: '🔴' },
  { name: 'green',  hex: '#22c55e', label: 'Green',  emoji: '🟢' },
  { name: 'blue',   hex: '#3b82f6', label: 'Blue',   emoji: '🔵' },
  { name: 'yellow', hex: '#eab308', label: 'Yellow', emoji: '🟡' },
  { name: 'purple', hex: '#a855f7', label: 'Purple', emoji: '🟣' },
  { name: 'orange', hex: '#f97316', label: 'Orange', emoji: '🟠' },
  { name: 'pink',   hex: '#ec4899', label: 'Pink',   emoji: '🩷' },
  { name: 'teal',   hex: '#14b8a6', label: 'Teal',   emoji: '🩵' },
  { name: 'coral',  hex: '#fb7185', label: 'Coral',  emoji: '🪸' },
  { name: 'lime',   hex: '#84cc16', label: 'Lime',   emoji: '🟩' },
]

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000, 5000]

const Game = () => {
  const { wallet, updateWallet } = useAuth()
  const { currentGame, countdown, lastResult, recentRounds } = useSocket()

  const [selectedColor, setSelectedColor] = useState(null)
  const [betAmount, setBetAmount] = useState(100)
  const [placing, setPlacing] = useState(false)
  const [hasBet, setHasBet] = useState(false)
  const [myBetInfo, setMyBetInfo] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [resultInfo, setResultInfo] = useState(null)
  const [recentResults, setRecentResults] = useState([])
  const prevRoundRef = useRef(null)

  // Fetch recent rounds on mount
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const data = await api.get('/game/rounds?limit=20')
        setRecentResults(data.rounds || [])
      } catch {}
    }
    fetchRecent()
  }, [])

  // Detect new round to reset bet state
  useEffect(() => {
    if (currentGame && prevRoundRef.current !== currentGame.roundNumber) {
      if (prevRoundRef.current !== null) {
        setHasBet(false)
        setMyBetInfo(null)
        setSelectedColor(null)
      }
      prevRoundRef.current = currentGame.roundNumber
    }
  }, [currentGame?.roundNumber])

  // Show result notification
  useEffect(() => {
    if (lastResult && hasBet && myBetInfo) {
      const isWin = myBetInfo.color === lastResult.winningColor
      setResultInfo({
        won: isWin,
        color: lastResult.winningColor,
        winAmount: isWin ? myBetInfo.amount * 9 : 0,
        betAmount: myBetInfo.amount,
        betColor: myBetInfo.color,
      })
      setShowResult(true)
      // Auto-close after 5s
      setTimeout(() => setShowResult(false), 5000)
    }
    // Update recent results
    if (lastResult) {
      setRecentResults(prev => [lastResult, ...prev.slice(0, 19)])
    }
  }, [lastResult])

  const canBet = currentGame?.status === 'betting' && countdown > 5 && !hasBet

  const handlePlaceBet = async () => {
    if (!selectedColor) return toast.error('Please select a color!')
    if (!betAmount || betAmount < 10) return toast.error('Minimum bet is ₹10')
    if (betAmount > (wallet?.balance || 0)) return toast.error('Insufficient balance')
    if (!canBet) return toast.error('Betting is closed for this round')

    try {
      setPlacing(true)
      const data = await api.post('/game/bet', { color: selectedColor, amount: betAmount })
      setHasBet(true)
      setMyBetInfo({ color: selectedColor, amount: betAmount })
      updateWallet({ balance: data.walletBalance })
      toast.success(`Bet placed! ₹${betAmount} on ${selectedColor.toUpperCase()} 🎯`)
    } catch (err) {
      toast.error(err.message || 'Failed to place bet')
    } finally {
      setPlacing(false)
    }
  }

  const adjustAmount = (delta) => {
    setBetAmount(prev => Math.max(10, Math.min(50000, prev + delta)))
  }

  const timerPercent = currentGame ? (countdown / (currentGame.duration || 30)) * 100 : 0
  const timerColor = countdown > 10 ? '#7c3aed' : countdown > 5 ? '#f59e0b' : '#ef4444'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-brand-400" />
          Color Prediction Game
        </h1>
        <p className="text-slate-400 text-sm mt-1">Pick your color, place your bet, win 9x!</p>
      </div>

      {/* Result Overlay */}
      {showResult && resultInfo && (
        <div className={`relative rounded-2xl p-6 border-2 animate-scale-in flex items-center gap-4
          ${resultInfo.won
            ? 'bg-emerald-500/10 border-emerald-500/40 win-overlay'
            : 'bg-red-500/10 border-red-500/40'
          }`}
        >
          <div className="text-4xl">
            {resultInfo.won ? '🏆' : '😔'}
          </div>
          <div className="flex-1">
            <p className={`text-xl font-black font-display ${resultInfo.won ? 'text-emerald-400' : 'text-red-400'}`}>
              {resultInfo.won ? `You Won ₹${resultInfo.winAmount}!` : 'Better Luck Next Time!'}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Winning color: <span className="font-semibold capitalize">{resultInfo.color}</span>
              {!resultInfo.won && ` • You bet on ${resultInfo.betColor}`}
            </p>
          </div>
          <button onClick={() => setShowResult(false)} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Game Area */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Color Selection + Bet */}
        <div className="lg:col-span-2 space-y-5">
          {/* Game Status Bar */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full animate-pulse-fast ${
                  currentGame?.status === 'betting' ? 'bg-emerald-400' :
                  currentGame?.status === 'processing' ? 'bg-amber-400' : 'bg-slate-400'
                }`} />
                <span className="text-white font-semibold text-sm">
                  {currentGame?.status === 'betting' ? 'Betting Open' :
                   currentGame?.status === 'processing' ? 'Processing Result...' :
                   'Waiting for Round...'}
                </span>
                {currentGame && (
                  <span className="text-slate-400 text-xs font-mono">#{currentGame.roundNumber}</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {currentGame?.totalPlayers || 0} players
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  ₹{currentGame?.totalBetAmount?.toLocaleString() || 0}
                </span>
              </div>
            </div>

            {/* Timer Bar */}
            <div className="h-2 bg-dark-400 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${timerPercent}%`,
                  backgroundColor: timerColor,
                  boxShadow: `0 0 8px ${timerColor}80`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-slate-500 text-xs">Time remaining</span>
              <span className={`text-xs font-mono font-bold ${countdown <= 5 ? 'text-red-400 animate-pulse-fast' : 'text-white'}`}>
                {countdown}s
              </span>
            </div>
          </div>

          {/* Color Grid */}
          <div>
            <p className="text-slate-300 text-sm font-medium mb-3 flex items-center gap-2">
              <span>Step 1: Select Your Color</span>
              {hasBet && (
                <span className="badge badge-success">
                  <CheckCircle className="w-3 h-3" /> Bet Placed!
                </span>
              )}
            </p>
            <div className="grid grid-cols-5 gap-3">
              {COLORS.map((color) => {
                const betAmount_ = currentGame?.colorDistribution?.[color.name] || 0
                const isSelected = selectedColor === color.name
                const isMyBet = myBetInfo?.color === color.name

                return (
                  <button
                    key={color.name}
                    onClick={() => !hasBet && setSelectedColor(color.name)}
                    disabled={hasBet || !canBet}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-2xl
                      border-2 transition-all duration-200 text-center group
                      ${isSelected || isMyBet
                        ? 'scale-105 -translate-y-1 shadow-lg'
                        : 'hover:scale-105 hover:-translate-y-1'
                      }
                      ${hasBet && !isMyBet ? 'opacity-50' : ''}
                      ${!canBet && !hasBet ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                    `}
                    style={{
                      borderColor: isSelected || isMyBet ? color.hex : 'rgba(255,255,255,0.1)',
                      backgroundColor: isSelected || isMyBet
                        ? `${color.hex}20`
                        : 'rgba(26,26,46,0.6)',
                      boxShadow: isSelected || isMyBet ? `0 0 20px ${color.hex}50` : 'none',
                    }}
                  >
                    {/* Winning indicator */}
                    {lastResult?.winningColor === color.name && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-amber-400 rounded-full
                        flex items-center justify-center text-xs animate-bounce-slow">👑</div>
                    )}

                    <div
                      className="w-8 h-8 rounded-full mb-1 shadow-lg group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.hex, boxShadow: `0 0 12px ${color.hex}60` }}
                    />
                    <p className="text-white text-xs font-semibold">{color.label}</p>
                    {betAmount_ > 0 && (
                      <p className="text-slate-400 text-xs mt-0.5">₹{betAmount_.toLocaleString()}</p>
                    )}

                    {isMyBet && (
                      <div className="absolute inset-0 rounded-2xl border-2 border-white/30 animate-pulse pointer-events-none" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bet Amount */}
          <div className={hasBet ? 'opacity-50 pointer-events-none' : ''}>
            <p className="text-slate-300 text-sm font-medium mb-3">Step 2: Enter Bet Amount</p>
            <div className="glass-card p-4 space-y-4">
              {/* Amount Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => adjustAmount(-50)}
                  className="w-10 h-10 rounded-xl bg-dark-400 hover:bg-dark-300 text-white flex items-center justify-center transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(10, Math.min(50000, Number(e.target.value))))}
                    className="input-field pl-8 text-center text-xl font-black font-mono"
                    min={10}
                    max={50000}
                  />
                </div>
                <button
                  onClick={() => adjustAmount(50)}
                  className="w-10 h-10 rounded-xl bg-dark-400 hover:bg-dark-300 text-white flex items-center justify-center transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick amounts */}
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setBetAmount(amt)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                      ${betAmount === amt
                        ? 'bg-brand-600 text-white'
                        : 'bg-dark-400 text-slate-300 hover:bg-dark-300 hover:text-white'
                      }`}
                  >
                    ₹{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Info Row */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  Potential win: <span className="text-emerald-400 font-bold font-mono">₹{(betAmount * 9).toLocaleString()}</span>
                </span>
                <span className="text-slate-400">
                  Balance: <span className="text-white font-mono">₹{wallet?.balance?.toFixed(2) || '0'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Place Bet Button */}
          {!hasBet ? (
            <button
              onClick={handlePlaceBet}
              disabled={!selectedColor || !canBet || placing}
              className={`w-full py-4 rounded-2xl font-display font-black text-lg flex items-center justify-center gap-2
                transition-all duration-200
                ${selectedColor && canBet
                  ? 'btn-primary shadow-glow hover:shadow-glow-lg animate-glow'
                  : 'bg-dark-400 text-slate-500 cursor-not-allowed'
                }`}
            >
              {placing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  {!selectedColor ? 'Select a Color First' :
                   !canBet ? 'Betting Closed' :
                   `Place Bet ₹${betAmount.toLocaleString()}`}
                </>
              )}
            </button>
          ) : (
            <div className="w-full py-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center gap-2 text-emerald-400 font-bold">
              <CheckCircle className="w-5 h-5" />
              Bet Placed on <span className="capitalize ml-1">{myBetInfo?.color}</span>! Waiting for result...
            </div>
          )}
        </div>

        {/* Right Panel: Recent Results */}
        <div className="space-y-5">
          {/* Color Distribution */}
          {currentGame?.colorDistribution && Object.keys(currentGame.colorDistribution).length > 0 && (
            <div className="glass-card p-4 space-y-3">
              <p className="text-slate-300 text-sm font-semibold">Current Round Distribution</p>
              {COLORS.map(c => {
                const amount = currentGame.colorDistribution[c.name] || 0
                const total = currentGame.totalBetAmount || 1
                const pct = Math.round((amount / total) * 100)
                if (amount === 0) return null
                return (
                  <div key={c.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 capitalize">{c.label}</span>
                      <span className="text-slate-400">₹{amount} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-dark-400 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: c.hex }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Recent Results */}
          <div className="glass-card p-4 space-y-3">
            <p className="text-slate-300 text-sm font-semibold">Recent Results</p>
            <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
              {recentResults.length > 0 ? recentResults.map((r, i) => {
                const colorObj = COLORS.find(c => c.name === r.winningColor)
                return (
                  <div key={r.roundNumber || i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-dark-600/40 transition">
                    <div
                      className="w-7 h-7 rounded-full flex-shrink-0 shadow-md"
                      style={{ backgroundColor: colorObj?.hex || '#666', boxShadow: `0 0 8px ${colorObj?.hex || '#666'}50` }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium capitalize">{r.winningColor}</p>
                      <p className="text-slate-500 text-xs">Round #{r.roundNumber || '-'}</p>
                    </div>
                    <span className="text-slate-400 text-xs">
                      {r.totalPlayers || 0}p
                    </span>
                  </div>
                )
              }) : (
                <p className="text-slate-500 text-xs text-center py-4">No results yet</p>
              )}
            </div>
          </div>

          {/* Multiplier Info */}
          <div className="glass-card p-4 space-y-3">
            <p className="text-slate-300 text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-brand-400" />
              How to Win
            </p>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Win Multiplier</span>
                <span className="text-emerald-400 font-bold">9x</span>
              </div>
              <div className="flex justify-between">
                <span>Min Bet</span>
                <span className="text-white">₹10</span>
              </div>
              <div className="flex justify-between">
                <span>Max Bet</span>
                <span className="text-white">₹50,000</span>
              </div>
              <div className="flex justify-between">
                <span>Round Duration</span>
                <span className="text-white">30 seconds</span>
              </div>
              <div className="flex justify-between">
                <span>Colors</span>
                <span className="text-white">10 options</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-brand-600/10 border border-brand-600/20 text-xs text-slate-400">
              Pick the right color → Win <span className="text-emerald-400 font-bold">9x</span> your bet!
              With 10 colors and 9x payout, it's an exciting game of prediction.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Game
