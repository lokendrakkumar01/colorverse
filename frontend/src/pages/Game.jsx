// ============================================================
// Winzo-Style Game Arena - ColorVerse
// ============================================================
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  Gamepad2, Trophy, Clock, Users, TrendingUp, AlertCircle,
  CheckCircle, X, Minus, Plus, Search, Star, Zap, Play
} from 'lucide-react'

// Game components
import DiceRoll from '../components/DiceRoll'
import CoinFlip from '../components/CoinFlip'
import CrashRocket from '../components/CrashRocket'
import LudoMatch from '../components/LudoMatch'

const GAME_CARDS = [
  {
    id: 'color',
    title: 'Color Prediction',
    category: 'instant',
    developer: 'ColorVerse Studio',
    rating: 4.8,
    image: '/game-color.jpg',
    badge: 'LIVE 9X',
    players: '14.8K',
    description: 'Pick colors, place bids, win 9x payout every 30 seconds!'
  },
  {
    id: 'dice',
    title: 'Dice Roll 6X',
    category: 'instant',
    developer: 'ColorVerse Studio',
    rating: 4.7,
    image: '/game-dice.jpg',
    badge: 'INSTANT 6X',
    players: '8.4K',
    description: 'Roll the 3D dice. Predict the exact number to win 6x payout!'
  },
  {
    id: 'coin',
    title: 'Coin Flip 2X',
    category: 'instant',
    developer: 'ColorVerse Studio',
    rating: 4.6,
    image: '/game-coin.jpg',
    badge: 'INSTANT 2X',
    players: '11.2K',
    description: 'Heads or Tails? Flip the golden coin to instantly double your bet!'
  },
  {
    id: 'crash',
    title: 'Crash Rocket',
    category: 'instant',
    developer: 'ColorVerse Studio',
    rating: 4.9,
    image: '/game-crash.jpg',
    badge: 'HIGH MULTIPLIER',
    players: '23.5K',
    description: 'Cash out before the rocket crashes! Win up to 100x rewards.'
  },
  {
    id: 'ludo_king',
    title: 'Ludo King™',
    category: 'board',
    developer: 'Gametion',
    rating: 4.0,
    image: '/game-ludo.jpg',
    badge: 'LOBBY ACTIVE',
    players: '45.1K',
    description: 'Play official Ludo King with custom cash bids. Join open lobbies now!'
  },
  {
    id: 'carrom',
    title: 'Carrom Meta',
    category: 'board',
    developer: 'Yocheer',
    rating: 4.0,
    image: '/game-carrom.jpg',
    badge: 'LOBBY ACTIVE',
    players: '15.6K',
    description: 'Show your board disc skills. Play real-money Carrom tournaments!'
  },
  {
    id: 'ludo_buzz',
    title: 'Ludo Buzz',
    category: 'board',
    developer: 'Popup Games',
    rating: 3.4,
    image: '/game-ludo.jpg',
    badge: 'COMING SOON',
    players: '0',
    description: 'Classic multiplayer Ludo boards with instant cash rooms.'
  },
  {
    id: 'ludo_now',
    title: 'Ludo Now',
    category: 'board',
    developer: 'Comfun',
    rating: 3.3,
    image: '/game-ludo.jpg',
    badge: 'COMING SOON',
    players: '0',
    description: 'Fast boards, big prizes. Ludo Now matches coming very soon!'
  },
  {
    id: 'ludo_super',
    title: 'Ludo Super',
    category: 'board',
    developer: 'Comfun',
    rating: 2.9,
    image: '/game-ludo.jpg',
    badge: 'COMING SOON',
    players: '0',
    description: 'Fun board game lobbies for multi-player tournament play.'
  }
]

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

  const [activeGame, setActiveGame] = useState('hub')
  const [category, setCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Color prediction states
  const [selectedColor, setSelectedColor] = useState(null)
  const [betAmount, setBetAmount] = useState(100)
  const [placing, setPlacing] = useState(false)
  const [hasBet, setHasBet] = useState(false)
  const [myBetInfo, setMyBetInfo] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [resultInfo, setResultInfo] = useState(null)
  const [recentResults, setRecentResults] = useState([])
  const [prevRound, setPrevRound] = useState(null)

  // Fetch color game rounds
  useEffect(() => {
    if (activeGame === 'color') {
      const fetchRecent = async () => {
        try {
          const data = await api.get('/game/rounds?limit=20')
          setRecentResults(data.rounds || [])
        } catch {}
      }
      fetchRecent()
    }
  }, [activeGame])

  // Reset color bet states on new round
  useEffect(() => {
    if (currentGame && prevRound !== currentGame.roundNumber) {
      if (prevRound !== null) {
        setHasBet(false)
        setMyBetInfo(null)
        setSelectedColor(null)
      }
      setPrevRound(currentGame.roundNumber)
    }
  }, [currentGame?.roundNumber])

  // Process color result
  useEffect(() => {
    if (lastResult && hasBet && myBetInfo && activeGame === 'color') {
      const isWin = myBetInfo.color === lastResult.winningColor
      setResultInfo({
        won: isWin,
        color: lastResult.winningColor,
        winAmount: isWin ? myBetInfo.amount * 9 : 0,
        betAmount: myBetInfo.amount,
        betColor: myBetInfo.color,
      })
      setShowResult(true)
      setTimeout(() => setShowResult(false), 5000)
    }
    if (lastResult && activeGame === 'color') {
      setRecentResults(prev => [lastResult, ...prev.slice(0, 19)])
    }
  }, [lastResult])

  const canBet = currentGame?.status === 'betting' && countdown > 5 && !hasBet

  const handlePlaceColorBet = async () => {
    if (!selectedColor) return toast.error('Please select a color!')
    if (betAmount < 10) return toast.error('Minimum bet is ₹10')
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

  // Filter games based on selection
  const filteredGames = GAME_CARDS.filter(game => {
    const matchesCategory = category === 'all' || game.category === category
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Render Hub (Main view)
  if (activeGame === 'hub') {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Banner Hero */}
        <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-brand-900 via-dark-800 to-accent/20 border border-brand-500/20 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative">
          <div className="absolute right-0 top-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl" />
          
          <div className="space-y-4 max-w-lg relative z-10">
            <span className="bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              🎮 ColorVerse Game Arena
            </span>
            <h1 className="text-3xl md:text-4xl font-display font-black text-white leading-tight">
              India's Favorite <span className="text-gradient">Gaming Hub</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-md">
              Predict colors, roll dices, flip coins, or challenge opponents in classic Ludo. Play instantly and withdraw straight to your UPI!
            </p>
          </div>
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gaming-gradient flex items-center justify-center shadow-glow-lg animate-glow animate-bounce-slow">
            <Gamepad2 className="w-12 h-12 md:w-16 md:h-16 text-white" />
          </div>
        </div>

        {/* Categories & Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Categories selectors */}
          <div className="flex gap-2 p-1 bg-dark-800 rounded-xl border border-white/5 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Games' },
              { id: 'instant', label: 'Instant Win' },
              { id: 'board', label: 'Board Games' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap
                  ${category === cat.id
                    ? 'bg-brand-600 text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-dark-600'
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 text-sm py-2"
            />
          </div>
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map(game => {
            const isComingSoon = game.badge === 'COMING SOON'
            return (
              <div
                key={game.id}
                onClick={() => !isComingSoon && setActiveGame(game.id)}
                className={`glass-card overflow-hidden hover:border-brand-600/30 transition-all hover:-translate-y-1 group flex flex-col justify-between
                  ${isComingSoon ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {/* Thumbnail Image */}
                <div className="relative aspect-video w-full overflow-hidden bg-dark-900 border-b border-white/5">
                  <img
                    src={game.image}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Badge */}
                  <span className={`absolute top-3 left-3 text-xxs font-black px-2.5 py-1 rounded-full border
                    ${isComingSoon
                      ? 'bg-dark-900/80 border-slate-700 text-slate-400'
                      : 'bg-brand-600/80 border-brand-400/30 text-white animate-pulse'
                    }`}
                  >
                    {game.badge}
                  </span>
                  
                  {/* Active players count */}
                  {!isComingSoon && game.players !== '0' && (
                    <span className="absolute bottom-3 right-3 text-xxs bg-dark-900/80 border border-white/5 px-2 py-0.5 rounded-full text-slate-300 flex items-center gap-1">
                      <Users className="w-3 h-3 text-brand-400" />
                      {game.players} online
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-md group-hover:text-brand-300 transition">{game.title}</h3>
                      <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                        <Star className="w-3 h-3 fill-current" />
                        {game.rating}
                      </div>
                    </div>
                    <p className="text-slate-500 text-xxs font-medium">By {game.developer}</p>
                    <p className="text-slate-400 text-xs line-clamp-2 mt-2 leading-relaxed">{game.description}</p>
                  </div>

                  {/* Play Action */}
                  <button
                    disabled={isComingSoon}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold mt-4 flex items-center justify-center gap-1.5 transition-all
                      ${isComingSoon
                        ? 'bg-dark-500 text-slate-500 border border-slate-600/20'
                        : 'bg-brand-600 text-white group-hover:bg-brand-500 group-hover:shadow-glow-sm'
                      }`}
                  >
                    {isComingSoon ? (
                      'Coming Soon'
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Play Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render sub-game views
  if (activeGame === 'dice') {
    return <DiceRoll onBack={() => setActiveGame('hub')} />
  }

  if (activeGame === 'coin') {
    return <CoinFlip onBack={() => setActiveGame('hub')} />
  }

  if (activeGame === 'crash') {
    return <CrashRocket onBack={() => setActiveGame('hub')} />
  }

  if (activeGame === 'ludo_king') {
    return <LudoMatch gameName="Ludo King" onBack={() => setActiveGame('hub')} />
  }

  if (activeGame === 'carrom') {
    return <LudoMatch gameName="Carrom Meta" onBack={() => setActiveGame('hub')} />
  }

  // Default: Color prediction view (nested inside Game container)
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => setActiveGame('hub')} className="btn-secondary flex items-center gap-2 px-3 py-1.5 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">Balance:</span>
          <span className="text-white font-black font-mono">₹{wallet?.balance?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      {/* Result banner overlay */}
      {showResult && resultInfo && (
        <div className={`relative rounded-2xl p-6 border-2 animate-scale-in flex items-center gap-4
          ${resultInfo.won ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-red-500/10 border-red-500/40'}`}
        >
          <div className="text-4xl">{resultInfo.won ? '🏆' : '😔'}</div>
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

      {/* Main Game panel */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Game Info bar */}
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
                {currentGame && <span className="text-slate-400 text-xs font-mono">#{currentGame.roundNumber}</span>}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{currentGame?.totalPlayers || 0} players</span>
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />₹{currentGame?.totalBetAmount?.toLocaleString() || 0}</span>
              </div>
            </div>

            {/* Timer bar */}
            <div className="h-2 bg-dark-400 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${currentGame ? (countdown / (currentGame.duration || 30)) * 100 : 0}%`,
                  backgroundColor: countdown > 10 ? '#7c3aed' : countdown > 5 ? '#f59e0b' : '#ef4444',
                  boxShadow: `0 0 8px ${countdown > 10 ? '#7c3aed' : countdown > 5 ? '#f59e0b' : '#ef4444'}80`,
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

          {/* Color Matrix selector */}
          <div className="space-y-3">
            <p className="text-slate-300 text-sm font-semibold flex items-center gap-2">
              <span>Step 1: Select Your Color</span>
              {hasBet && <span className="badge badge-success"><CheckCircle className="w-3 h-3" /> Bet Placed!</span>}
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
                    className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all text-center group
                      ${isSelected || isMyBet ? 'scale-105 -translate-y-1 shadow-lg' : 'hover:scale-105 hover:-translate-y-1'}
                      ${hasBet && !isMyBet ? 'opacity-50' : ''}`}
                    style={{
                      borderColor: isSelected || isMyBet ? color.hex : 'rgba(255,255,255,0.1)',
                      backgroundColor: isSelected || isMyBet ? `${color.hex}20` : 'rgba(26,26,46,0.6)',
                      boxShadow: isSelected || isMyBet ? `0 0 20px ${color.hex}50` : 'none',
                    }}
                  >
                    <div className="w-8 h-8 rounded-full mb-1 shadow-lg" style={{ backgroundColor: color.hex, boxShadow: `0 0 12px ${color.hex}60` }} />
                    <p className="text-white text-xs font-semibold">{color.label}</p>
                    {betAmount_ > 0 && <p className="text-slate-400 text-xxs mt-0.5">₹{betAmount_}</p>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bet Input amount */}
          <div className={hasBet ? 'opacity-50 pointer-events-none' : ''}>
            <p className="text-slate-300 text-sm font-semibold mb-3">Step 2: Enter Bet Amount</p>
            <div className="glass-card p-4 space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setBetAmount(prev => Math.max(10, prev - 50))} className="w-10 h-10 rounded-xl bg-dark-400 hover:bg-dark-300 text-white flex items-center justify-center transition">
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
                    className="input-field pl-8 text-center text-xl font-black font-mono"
                  />
                </div>
                <button onClick={() => setBetAmount(prev => Math.min(50000, prev + 50))} className="w-10 h-10 rounded-xl bg-dark-400 hover:bg-dark-300 text-white flex items-center justify-center transition">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick bets list */}
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map(amt => (
                  <button key={amt} onClick={() => setBetAmount(amt)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${betAmount === amt ? 'bg-brand-600 text-white' : 'bg-dark-400 text-slate-300 hover:bg-dark-300'}`}>
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submitting button */}
          {!hasBet ? (
            <button
              onClick={handlePlaceColorBet}
              disabled={!selectedColor || !canBet || placing}
              className={`w-full py-4 rounded-2xl font-display font-black text-lg flex items-center justify-center gap-2 transition-all
                ${selectedColor && canBet ? 'btn-primary shadow-glow hover:shadow-glow-lg animate-glow' : 'bg-dark-400 text-slate-500 cursor-not-allowed'}`}
            >
              {placing ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : `Place Bet ₹${betAmount}`}
            </button>
          ) : (
            <div className="w-full py-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center gap-2 text-emerald-400 font-bold">
              <CheckCircle className="w-5 h-5" /> Bet Placed! Waiting for result...
            </div>
          )}
        </div>

        {/* Right Info panels */}
        <div className="space-y-5">
          {/* Distribution list */}
          {currentGame?.colorDistribution && Object.keys(currentGame.colorDistribution).length > 0 && (
            <div className="glass-card p-4 space-y-3">
              <p className="text-slate-300 text-sm font-semibold">Round Distribution</p>
              {COLORS.map(c => {
                const amount = currentGame.colorDistribution[c.name] || 0
                const pct = Math.round((amount / (currentGame.totalBetAmount || 1)) * 100)
                if (amount === 0) return null
                return (
                  <div key={c.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 capitalize">{c.label}</span>
                      <span className="text-slate-400">₹{amount} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-dark-400 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.hex }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Results list */}
          <div className="glass-card p-4 space-y-3">
            <p className="text-slate-300 text-sm font-semibold">Recent Results</p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
              {recentResults.map((r, i) => {
                const colorObj = COLORS.find(c => c.name === r.winningColor)
                return (
                  <div key={r.roundNumber || i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-600/40 transition text-xs">
                    <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: colorObj?.hex || '#666' }} />
                    <div className="flex-1">
                      <p className="text-white capitalize font-semibold">{r.winningColor}</p>
                      <p className="text-slate-500 text-xxs">Round #{r.roundNumber}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Game
