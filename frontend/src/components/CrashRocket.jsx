// ============================================================
// Crash Rocket Game Component - Winzo Style with Free Practice Play
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Coins, Rocket, Play, ShieldAlert, Award, Sparkles, RefreshCw } from 'lucide-react'

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000]

const CrashRocket = ({ onBack }) => {
  const { wallet, updateWallet } = useAuth()
  const [betAmount, setBetAmount] = useState(100)
  const [gameState, setGameState] = useState('idle') // 'idle', 'running', 'cashed_out', 'crashed'
  const [multiplier, setMultiplier] = useState(1.00)
  const [crashPoint, setCrashPoint] = useState(1.00)
  
  const timerRef = useRef(null)
  const currentMultRef = useRef(1.00)

  // Free Practice Play (Demo Mode)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoBalance, setDemoBalance] = useState(() => {
    const saved = localStorage.getItem('cv_demo_balance')
    return saved ? Number(saved) : 10000
  })

  useEffect(() => {
    localStorage.setItem('cv_demo_balance', demoBalance)
  }, [demoBalance])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startCrashGame = () => {
    if (betAmount < 10) return toast.error('Minimum bet is ₹10')
    
    const currentBalance = isDemoMode ? demoBalance : (wallet?.balance || 0)
    if (betAmount > currentBalance) return toast.error('Insufficient wallet balance')

    // Determine target crash point using weighted probabilities
    const rand = Math.random()
    let targetCrash = 1.00
    if (rand < 0.20) {
      targetCrash = 1.00 + Math.random() * 0.2 // 20% instant crash below 1.2x
    } else if (rand < 0.60) {
      targetCrash = 1.20 + Math.random() * 0.8 // 40% crash between 1.2x and 2x
    } else if (rand < 0.90) {
      targetCrash = 2.00 + Math.random() * 3.0 // 30% crash between 2x and 5x
    } else {
      targetCrash = 5.00 + Math.random() * 15.0 // 10% massive win up to 20x
    }

    setCrashPoint(targetCrash)
    setMultiplier(1.00)
    currentMultRef.current = 1.00
    setGameState('running')

    // Debit bet first
    debitBetAmount()

    const startTime = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      // Formula for multiplier curve
      const nextMult = parseFloat((1 + Math.pow(elapsed, 1.4) * 0.15).toFixed(2))

      if (nextMult >= targetCrash) {
        clearInterval(timerRef.current)
        setMultiplier(targetCrash)
        setGameState('crashed')
        if (isDemoMode) {
          setDemoBalance(prev => prev - betAmount)
        }
        toast.error(`💥 Rocket Crashed at ${targetCrash.toFixed(2)}x!`)
      } else {
        setMultiplier(nextMult)
        currentMultRef.current = nextMult
      }
    }, 100)
  }

  const debitBetAmount = async () => {
    if (isDemoMode) return; // skip for demo play

    try {
      const data = await api.post('/game/instant-game', {
        gameType: 'crash',
        betAmount,
        won: false,
        winAmount: 0,
        detail: `Bet Placed, waiting for Cashout`,
      })
      updateWallet({ balance: data.walletBalance })
    } catch (err) {
      clearInterval(timerRef.current)
      setGameState('idle')
      toast.error(err.message || 'Bet placement failed')
    }
  }

  const handleCashout = async () => {
    if (gameState !== 'running') return
    clearInterval(timerRef.current)
    const finalMult = currentMultRef.current
    const winAmount = Math.round(betAmount * finalMult)

    if (isDemoMode) {
      setGameState('cashed_out')
      setDemoBalance(prev => prev + (winAmount - betAmount)) // net gains
      toast.success(`🚀 Demo Cashout! Won 🪙₹${winAmount} at ${finalMult}x!`)
      return
    }

    try {
      setGameState('cashed_out')
      // Update wallet and record result
      const data = await api.post('/game/instant-game', {
        gameType: 'crash',
        betAmount,
        won: true,
        winAmount,
        detail: `Cashed out at ${finalMult}x (Bet: ₹${betAmount})`,
      })

      // Refund the initial bet + credit the full win amount
      updateWallet({ balance: data.walletBalance })
      toast.success(`🚀 Cashed Out! Won ₹${winAmount} at ${finalMult}x!`, { duration: 5000 })
    } catch (err) {
      toast.error(err.message || 'Error processing Cashout')
    }
  }

  const handleRefillDemo = () => {
    setDemoBalance(10000)
    toast.success('Demo Balance reset to 🪙₹10,000 for practice!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2 px-3 py-1.5 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>

        {/* Play style toggler */}
        <div className="flex items-center gap-2 bg-dark-800 p-1.5 rounded-xl border border-white/5">
          <button
            onClick={() => { if(gameState !== 'running') setIsDemoMode(false) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!isDemoMode ? 'bg-brand-600 text-white shadow-glow-sm' : 'text-slate-400 hover:text-white'}`}
            disabled={gameState === 'running'}
          >
            ₹ Real Play
          </button>
          <button
            onClick={() => { if(gameState !== 'running') setIsDemoMode(true) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isDemoMode ? 'bg-emerald-600 text-white shadow-glow-emerald' : 'text-slate-400 hover:text-white'}`}
            disabled={gameState === 'running'}
          >
            🟢 Practice Free
          </button>
        </div>

        <div className="flex items-center gap-4">
          {isDemoMode ? (
            <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 text-xs">Demo Coins:</span>
              <span className="text-emerald-400 font-black font-mono">₹{demoBalance.toFixed(2)}</span>
              {demoBalance < 100 && (
                <button onClick={handleRefillDemo} title="Refill Demo Balance" className="ml-1 text-slate-400 hover:text-white transition">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-brand-950/20 border border-brand-700/20 px-3 py-1.5 rounded-xl">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-slate-300 text-xs">Real Cash:</span>
              <span className="text-white font-black font-mono">₹{wallet?.balance?.toFixed(2) || '0.00'}</span>
            </div>
          )}
        </div>
      </div>

      {isDemoMode && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 px-4 py-3 rounded-2xl flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse flex-shrink-0" />
          <p className="text-xs text-emerald-300 leading-relaxed">
            You are playing in <strong>Free Practice Mode</strong>. Bids will use virtual demo coins and won't affect your real wallet balance. Practice as much as you like!
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Side Controls */}
        <div className="glass-card p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-display font-black text-white flex items-center gap-2">
                🚀 Crash Rocket {isDemoMode && <span className="text-xxs bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-sans uppercase font-black">Free Demo</span>}
              </h2>
              <p className="text-slate-400 text-sm mt-1">Watch the multiplier climb. Cash out before the rocket crashes to win up to 100x!</p>
            </div>

            {/* Bet Input */}
            <div className="space-y-3">
              <p className="text-slate-300 text-sm font-semibold">Enter Bet Amount</p>
              <input
                type="number"
                disabled={gameState === 'running'}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
                className="input-field text-xl font-bold font-mono text-center"
                min={10}
              />
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    disabled={gameState === 'running'}
                    onClick={() => setBetAmount(amt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition
                      ${betAmount === amt
                        ? isDemoMode ? 'bg-emerald-600 text-white' : 'bg-brand-600 text-white'
                        : 'bg-dark-500 hover:bg-dark-400 text-slate-300'
                      }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="pt-4">
            {gameState === 'running' ? (
              <button
                onClick={handleCashout}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500
                  hover:from-amber-600 hover:to-yellow-600 text-dark-900 font-display font-black text-xl
                  shadow-glow-gold hover:shadow-glow-gold-lg animate-pulse"
              >
                CASH OUT AT {multiplier.toFixed(2)}x (Payout: {isDemoMode ? '🪙' : ''}₹{Math.round(betAmount * multiplier)})
              </button>
            ) : (
              <button
                onClick={startCrashGame}
                disabled={gameState === 'running'}
                className={`w-full py-4 rounded-xl font-display font-black text-lg flex items-center justify-center gap-2 transition-all
                  ${isDemoMode 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-emerald hover:shadow-glow-emerald-lg active:scale-95' 
                    : 'btn-primary shadow-glow hover:shadow-glow-lg animate-glow'
                  }`}
              >
                <Play className="w-5 h-5 fill-current" />
                Start Rocket & Bet {isDemoMode ? '🪙' : ''}₹{betAmount}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Rocket Graph */}
        <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden bg-gradient-to-b from-dark-900 via-dark-800 to-dark-950">
          {/* Ambient Glow */}
          <div className={`absolute w-64 h-64 rounded-full blur-3xl opacity-20 transition-all duration-1000
            ${gameState === 'running' ? 'bg-amber-500 scale-125' :
              gameState === 'cashed_out' ? 'bg-emerald-500' :
              gameState === 'crashed' ? 'bg-red-500' : isDemoMode ? 'bg-emerald-600' : 'bg-brand-600'}`}
          />

          {/* Floating Stars */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black/20" />

          {/* Rocket and Multiplier */}
          <div className="relative z-10 flex flex-col items-center space-y-8">
            {/* Multiplier Text */}
            <div className="text-center space-y-1">
              <span className={`text-6xl font-display font-black font-mono tracking-tighter transition-colors duration-300
                ${gameState === 'running' ? 'text-amber-400' :
                  gameState === 'cashed_out' ? 'text-emerald-400' :
                  gameState === 'crashed' ? 'text-red-500' : 'text-slate-500'}`}
              >
                {multiplier.toFixed(2)}x
              </span>
              <p className="text-slate-500 text-xxs font-bold uppercase tracking-widest mt-1">Current Multiplier</p>
            </div>

            {/* Rocket Icon Container */}
            <div
              className={`p-6 rounded-full bg-dark-700/80 border-2 transition-all duration-300
                ${gameState === 'running' ? 'border-amber-400 animate-bounce scale-110 shadow-glow-gold' :
                  gameState === 'cashed_out' ? 'border-emerald-400 shadow-glow-emerald' :
                  gameState === 'crashed' ? 'border-red-500' : 'border-white/10'}`}
              style={{
                transform: gameState === 'running' ? `translateY(-${(multiplier - 1) * 8}px)` : 'none'
              }}
            >
              <Rocket
                className={`w-16 h-16 transition-transform duration-300
                  ${gameState === 'running' ? 'text-amber-400 rotate-45 animate-pulse' :
                    gameState === 'cashed_out' ? 'text-emerald-400 rotate-45' :
                    gameState === 'crashed' ? 'text-red-500 rotate-180 translate-y-3' : 'text-slate-400'}`}
              />
            </div>

            {/* Status updates */}
            <div className="text-center min-h-[40px] px-4">
              {gameState === 'running' && (
                <p className="text-amber-400 text-xs font-semibold animate-pulse flex items-center justify-center gap-1.5">
                  <Play className="w-3.5 h-3.5 fill-current animate-spin" /> Rocket is flying high...
                </p>
              )}
              {gameState === 'cashed_out' && (
                <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/25 py-1 px-3 rounded-full text-emerald-400 text-xs font-bold">
                  <Award className="w-4 h-4" />
                  Successfully Cashed Out!
                </div>
              )}
              {gameState === 'crashed' && (
                <div className="flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/25 py-1 px-3 rounded-full text-red-400 text-xs font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  Rocket Crashed!
                </div>
              )}
              {gameState === 'idle' && (
                <p className="text-slate-500 text-xs">Set your bid and launch the rocket to begin!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CrashRocket
