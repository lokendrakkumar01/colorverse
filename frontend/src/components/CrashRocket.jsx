// ============================================================
// Crash Rocket Game Component - Winzo Style
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Coins, Rocket, Play, ShieldAlert, Award } from 'lucide-react'

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000]

const CrashRocket = ({ onBack }) => {
  const { wallet, updateWallet } = useAuth()
  const [betAmount, setBetAmount] = useState(100)
  const [gameState, setGameState] = useState('idle') // 'idle', 'running', 'cashed_out', 'crashed'
  const [multiplier, setMultiplier] = useState(1.00)
  const [crashPoint, setCrashPoint] = useState(1.00)
  
  const timerRef = useRef(null)
  const currentMultRef = useRef(1.00)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startCrashGame = () => {
    if (betAmount < 10) return toast.error('Minimum bet is ₹10')
    if (betAmount > (wallet?.balance || 0)) return toast.error('Insufficient wallet balance')

    // Determine target crash point using weighted probabilities (most games crash early, some go high)
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
    deditBetAmount()

    const startTime = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      // Formula for multiplier curve
      const nextMult = parseFloat((1 + Math.pow(elapsed, 1.4) * 0.15).toFixed(2))

      if (nextMult >= targetCrash) {
        clearInterval(timerRef.current)
        setMultiplier(targetCrash)
        setGameState('crashed')
        toast.error(`💥 Rocket Crashed at ${targetCrash.toFixed(2)}x!`)
      } else {
        setMultiplier(nextMult)
        currentMultRef.current = nextMult
      }
    }, 100)
  }

  const deditBetAmount = async () => {
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
      // Our instant endpoint debits the bet first, so if we win we get winAmount
      updateWallet({ balance: data.walletBalance })
      toast.success(`🚀 Cashed Out! Won ₹${winAmount} at ${finalMult}x!`, { duration: 5000 })
    } catch (err) {
      toast.error(err.message || 'Error processing Cashout')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2 px-3 py-1.5 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-400" />
          <span className="text-slate-400 text-sm">Balance:</span>
          <span className="text-white font-black font-mono">₹{wallet?.balance?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Side Controls */}
        <div className="glass-card p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-display font-black text-white flex items-center gap-2">
                🚀 Crash Rocket
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
                        ? 'bg-brand-600 text-white'
                        : 'bg-dark-500 hover:bg-dark-400 text-slate-300'
                      }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div>
            {gameState === 'running' ? (
              <button
                onClick={handleCashout}
                className="w-full py-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-display font-black text-xl shadow-glow-emerald animate-pulse flex flex-col items-center justify-center"
              >
                <span>CASH OUT NOW</span>
                <span className="text-sm font-medium mt-0.5 opacity-90">
                  Receive ₹{Math.round(betAmount * multiplier)} ({multiplier}x)
                </span>
              </button>
            ) : (
              <button
                onClick={startCrashGame}
                disabled={gameState === 'running'}
                className="w-full py-5 rounded-xl btn-primary shadow-glow hover:shadow-glow-lg animate-glow font-display font-black text-lg flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                Launch Rocket (₹{betAmount})
              </button>
            )}
          </div>
        </div>

        {/* Right Side Visualizer */}
        <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden bg-dark-900/60 border border-slate-800">
          {/* Ambient space background grid */}
          <div className="absolute inset-0 bg-grid opacity-10" />

          {/* Stars animation when running */}
          {gameState === 'running' && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute w-2 h-2 bg-white/40 rounded-full top-10 left-10 animate-ping" />
              <div className="absolute w-1.5 h-1.5 bg-white/30 rounded-full top-1/2 left-2/3 animate-ping" style={{ animationDelay: '1s' }} />
              <div className="absolute w-1 h-1 bg-white/20 rounded-full top-1/4 left-3/4 animate-ping" style={{ animationDelay: '0.5s' }} />
            </div>
          )}

          {/* Glowing ring */}
          <div className={`absolute w-64 h-64 rounded-full blur-3xl opacity-20 transition-all duration-300
            ${gameState === 'crashed' ? 'bg-red-500' : gameState === 'cashed_out' ? 'bg-emerald-500' : 'bg-brand-600'}`}
          />

          {/* Multiplier display */}
          <div className="relative z-10 text-center space-y-4">
            <div className="space-y-1">
              <p className={`text-6xl font-black font-mono tracking-tight transition-colors duration-300
                ${gameState === 'crashed' ? 'text-red-500' : gameState === 'cashed_out' ? 'text-emerald-400 font-bold' : 'text-brand-400'}`}>
                {multiplier.toFixed(2)}x
              </p>
              <p className="text-slate-500 text-xs tracking-wider uppercase font-semibold">Current Multiplier</p>
            </div>

            {/* Rocket animation */}
            <div className="h-28 flex items-center justify-center relative">
              {gameState === 'running' && (
                <div className="animate-bounce">
                  <Rocket className="w-16 h-16 text-brand-400 transform -rotate-45 drop-shadow-glow" />
                  {/* Fire particles */}
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-orange-500 rounded-full blur-sm animate-pulse" />
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full blur-xs animate-ping" />
                </div>
              )}
              {gameState === 'crashed' && (
                <div className="text-center space-y-2">
                  <span className="text-5xl">💥</span>
                  <p className="text-red-500 font-bold text-sm flex items-center gap-1.5 justify-center">
                    <ShieldAlert className="w-4 h-4" /> Busted! Crashed at {crashPoint.toFixed(2)}x
                  </p>
                </div>
              )}
              {gameState === 'cashed_out' && (
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <Award className="w-7 h-7" />
                  </div>
                  <p className="text-emerald-400 font-bold text-sm">Successfully Cashed Out!</p>
                </div>
              )}
              {gameState === 'idle' && (
                <Rocket className="w-16 h-16 text-slate-700 transform -rotate-45" />
              )}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              {gameState === 'running' && 'Cash out before the rocket crashes!'}
              {gameState === 'idle' && 'Place your bet and launch to start.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CrashRocket
