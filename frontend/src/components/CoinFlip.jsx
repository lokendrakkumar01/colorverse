// ============================================================
// Coin Flip Game Component - Winzo Style with Free Practice Play
// ============================================================
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Coins, Play, Sparkles, RefreshCw } from 'lucide-react'

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000]

const CoinFlip = ({ onBack }) => {
  const { wallet, updateWallet } = useAuth()
  const [selectedSide, setSelectedSide] = useState(null) // 'heads', 'tails'
  const [betAmount, setBetAmount] = useState(100)
  const [flipping, setFlipping] = useState(false)
  const [flipResult, setFlipResult] = useState('heads')
  const [winStatus, setWinStatus] = useState(null) // 'win', 'lose', null
  
  // Free Practice Play (Demo Mode)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoBalance, setDemoBalance] = useState(() => {
    const saved = localStorage.getItem('cv_demo_balance')
    return saved ? Number(saved) : 10000
  })

  useEffect(() => {
    localStorage.setItem('cv_demo_balance', demoBalance)
  }, [demoBalance])

  const handlePlaceBet = async () => {
    if (!selectedSide) return toast.error('Please select Heads or Tails first!')
    if (betAmount < 10) return toast.error('Minimum bet is ₹10')

    const currentBalance = isDemoMode ? demoBalance : (wallet?.balance || 0)
    if (betAmount > currentBalance) return toast.error('Insufficient wallet balance')

    try {
      setFlipping(true)
      setWinStatus(null)

      // Random result
      const sides = ['heads', 'tails']
      const finalResult = sides[Math.floor(Math.random() * 2)]
      const isWin = finalResult === selectedSide
      const winAmount = isWin ? betAmount * 2 : 0

      // Animation interval
      let counter = 0
      const interval = setInterval(() => {
        setFlipResult(prev => prev === 'heads' ? 'tails' : 'heads')
        counter++
        if (counter > 15) {
          clearInterval(interval)
          setFlipResult(finalResult)
          resolveGame(isWin, winAmount, finalResult)
        }
      }, 100)
    } catch {
      toast.error('Failed to start flip')
      setFlipping(false)
    }
  }

  const resolveGame = async (isWin, winAmount, finalResult) => {
    if (isDemoMode) {
      if (isWin) {
        setDemoBalance(prev => prev + betAmount)
        setWinStatus('win')
        toast.success(`🎉 Demo Win! Predicted correctly. Won 🪙₹${winAmount}!`)
      } else {
        setDemoBalance(prev => prev - betAmount)
        setWinStatus('lose')
        toast.error(`It was ${finalResult.toUpperCase()}. Try again!`)
      }
      setFlipping(false)
      return
    }

    try {
      const data = await api.post('/game/instant-game', {
        gameType: 'coin',
        betAmount,
        won: isWin,
        winAmount,
        detail: `Selected: ${selectedSide.toUpperCase()}, Result: ${finalResult.toUpperCase()}`,
      })

      updateWallet({ balance: data.walletBalance })
      setWinStatus(isWin ? 'win' : 'lose')

      if (isWin) {
        toast.success(`🎉 You predicted correctly! Won ₹${winAmount}!`, { duration: 4000 })
      } else {
        toast.error(`It was ${finalResult.toUpperCase()}. Try again!`)
      }
    } catch (err) {
      toast.error(err.message || 'Error processing payment')
    } finally {
      setFlipping(false)
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
            onClick={() => { if(!flipping) setIsDemoMode(false) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!isDemoMode ? 'bg-brand-600 text-white shadow-glow-sm' : 'text-slate-400 hover:text-white'}`}
            disabled={flipping}
          >
            ₹ Real Play
          </button>
          <button
            onClick={() => { if(!flipping) setIsDemoMode(true) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isDemoMode ? 'bg-emerald-600 text-white shadow-glow-emerald' : 'text-slate-400 hover:text-white'}`}
            disabled={flipping}
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
        {/* Left Side: Controls */}
        <div className="glass-card p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-display font-black text-white flex items-center gap-2">
              🪙 Coin Flip 2X {isDemoMode && <span className="text-xxs bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-sans uppercase font-black">Free Demo</span>}
            </h2>
            <p className="text-slate-400 text-sm mt-1">Predict heads or tails. Get double (2x) payout on win!</p>
          </div>

          {/* Side Selector */}
          <div className="space-y-3">
            <p className="text-slate-300 text-sm font-semibold">Pick Coin Side</p>
            <div className="grid grid-cols-2 gap-4">
              {['heads', 'tails'].map(side => (
                <button
                  key={side}
                  disabled={flipping}
                  onClick={() => setSelectedSide(side)}
                  className={`py-4 rounded-xl border-2 font-display font-bold text-lg capitalize transition-all
                    ${selectedSide === side
                      ? isDemoMode 
                        ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-glow-emerald' 
                        : 'bg-brand-600/40 border-brand-400 text-white shadow-glow-sm'
                      : 'bg-dark-500/80 border-white/10 text-slate-300 hover:border-brand-500/30'
                    }`}
                >
                  {side}
                </button>
              ))}
            </div>
          </div>

          {/* Bet Amount */}
          <div className="space-y-3">
            <p className="text-slate-300 text-sm font-semibold">Enter Bet Amount</p>
            <input
              type="number"
              disabled={flipping}
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
              className="input-field text-xl font-bold font-mono text-center"
              min={10}
            />
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  disabled={flipping}
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

          {/* Action button */}
          <button
            onClick={handlePlaceBet}
            disabled={flipping || !selectedSide}
            className={`w-full py-4 rounded-xl font-display font-black text-lg flex items-center justify-center gap-2 transition-all
              ${selectedSide && !flipping
                ? isDemoMode 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-emerald hover:shadow-glow-emerald-lg active:scale-95' 
                  : 'btn-primary shadow-glow hover:shadow-glow-lg animate-glow'
                : 'bg-dark-500 text-slate-500 cursor-not-allowed'
              }`}
          >
            {flipping ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                {selectedSide ? `Flip & Bet ${isDemoMode ? '🪙' : ''}₹${betAmount}` : 'Select Heads or Tails'}
              </>
            )}
          </button>
        </div>

        {/* Right Side: Coin flip visualizer */}
        <div className="glass-card p-6 flex flex-col items-center justify-center space-y-6 min-h-[350px] relative overflow-hidden">
          <div className={`absolute w-48 h-48 rounded-full blur-3xl opacity-30 transition-colors duration-500
            ${winStatus === 'win' ? 'bg-emerald-500' : winStatus === 'lose' ? 'bg-red-500' : isDemoMode ? 'bg-emerald-600' : 'bg-brand-600'}`}
          />

          {/* Spinning Coin */}
          <div className="relative z-10">
            <div
              className={`w-28 h-28 rounded-full bg-gradient-to-tr from-yellow-600 via-yellow-400 to-yellow-200
                shadow-2xl flex items-center justify-center border-4 border-yellow-300 font-display font-black text-yellow-950 text-2xl
                transition-all duration-300 select-none
                ${flipping ? 'animate-bounce scale-110 shadow-glow-gold' : ''}
                ${winStatus === 'win' ? 'border-emerald-400 scale-105' : winStatus === 'lose' ? 'border-red-400' : ''}`}
              style={{
                transform: flipping ? 'rotateY(720deg)' : 'none',
                transition: flipping ? 'transform 1.5s ease-out' : 'all 0.3s ease',
              }}
            >
              <div className="w-22 h-22 rounded-full border-2 border-dashed border-yellow-600/30 flex items-center justify-center font-black">
                {flipResult === 'heads' ? 'H' : 'T'}
              </div>
            </div>
          </div>

          {/* Results Status */}
          <div className="text-center z-10 min-h-[50px]">
            {flipping && <p className="text-yellow-400 font-bold animate-pulse">🪙 Coin is in the air...</p>}
            {winStatus === 'win' && (
              <div className="space-y-1">
                <p className="text-emerald-400 text-xl font-black">🎉 WINNER!</p>
                <p className="text-slate-400 text-xs">Result: {flipResult.toUpperCase()} (Won 2x)</p>
              </div>
            )}
            {winStatus === 'lose' && (
              <div className="space-y-1">
                <p className="text-red-400 text-xl font-black">😔 LOST</p>
                <p className="text-slate-400 text-xs">Result: {flipResult.toUpperCase()} (You chose {selectedSide.toUpperCase()})</p>
              </div>
            )}
            {!flipping && winStatus === null && (
              <p className="text-slate-500 text-sm">Pick Heads or Tails and start the flip!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CoinFlip
