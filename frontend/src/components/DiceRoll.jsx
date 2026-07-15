// ============================================================
// Dice Roll Game Component - Winzo Style with Free Practice Play
// ============================================================
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Zap, Play, ArrowLeft, Coins, Sparkles, RefreshCw } from 'lucide-react'

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000]

const DiceRoll = ({ onBack }) => {
  const { wallet, updateWallet } = useAuth()
  const [selectedNum, setSelectedNum] = useState(null)
  const [betAmount, setBetAmount] = useState(100)
  const [rolling, setRolling] = useState(false)
  const [diceResult, setDiceResult] = useState(1)
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
    if (!selectedNum) return toast.error('Please select a number (1-6) first!')
    if (betAmount < 10) return toast.error('Minimum bet is ₹10')

    const currentBalance = isDemoMode ? demoBalance : (wallet?.balance || 0)
    if (betAmount > currentBalance) return toast.error('Insufficient wallet balance')

    try {
      setRolling(true)
      setWinStatus(null)

      // Random result calculation
      const finalResult = Math.floor(Math.random() * 6) + 1
      const isWin = finalResult === selectedNum
      const winAmount = isWin ? betAmount * 6 : 0

      // Roll animation simulation
      let counter = 0
      const interval = setInterval(() => {
        setDiceResult(Math.floor(Math.random() * 6) + 1)
        counter++
        if (counter > 15) {
          clearInterval(interval)
          setDiceResult(finalResult)
          resolveGame(isWin, winAmount, finalResult)
        }
      }, 100)
    } catch (err) {
      toast.error('Failed to start game')
      setRolling(false)
    }
  }

  const resolveGame = async (isWin, winAmount, finalResult) => {
    if (isDemoMode) {
      if (isWin) {
        setDemoBalance(prev => prev + betAmount * 5) // add net win amount
        setWinStatus('win')
        toast.success(`🎉 Demo Win! Rolled ${finalResult} matching your pick. Won 🪙₹${winAmount}!`)
      } else {
        setDemoBalance(prev => prev - betAmount)
        setWinStatus('lose')
        toast.error(`Roll was ${finalResult}. Better luck next time!`)
      }
      setRolling(false)
      return
    }

    try {
      const data = await api.post('/game/instant-game', {
        gameType: 'dice',
        betAmount,
        won: isWin,
        winAmount,
        detail: `Selected: ${selectedNum}, Rolled: ${finalResult}`,
      })

      updateWallet({ balance: data.walletBalance })
      setWinStatus(isWin ? 'win' : 'lose')
      
      if (isWin) {
        toast.success(`🎉 Superb! You got a matching roll and won ₹${winAmount}!`, { duration: 5000 })
      } else {
        toast.error(`Roll was ${finalResult}. Better luck next time!`)
      }
    } catch (err) {
      toast.error(err.message || 'Error processing game reward')
    } finally {
      setRolling(false)
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
            onClick={() => { if(!rolling) setIsDemoMode(false) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!isDemoMode ? 'bg-brand-600 text-white shadow-glow-sm' : 'text-slate-400 hover:text-white'}`}
            disabled={rolling}
          >
            ₹ Real Play
          </button>
          <button
            onClick={() => { if(!rolling) setIsDemoMode(true) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isDemoMode ? 'bg-emerald-600 text-white shadow-glow-emerald' : 'text-slate-400 hover:text-white'}`}
            disabled={rolling}
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
        {/* Left column: Selecting numbers */}
        <div className="glass-card p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-display font-black text-white flex items-center gap-2">
              🎲 Dice Roll 6X {isDemoMode && <span className="text-xxs bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-sans uppercase font-black">Free Demo</span>}
            </h2>
            <p className="text-slate-400 text-sm mt-1">Pick a number, roll the dice. Match gets a massive 6x payout!</p>
          </div>

          {/* Number Selector */}
          <div className="space-y-3">
            <p className="text-slate-300 text-sm font-semibold">Select Target Dice Number</p>
            <div className="grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  disabled={rolling}
                  onClick={() => setSelectedNum(num)}
                  className={`aspect-square rounded-xl border-2 flex items-center justify-center font-black text-xl transition-all
                    ${selectedNum === num
                      ? isDemoMode 
                        ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-glow-emerald scale-105' 
                        : 'bg-brand-600/40 border-brand-400 text-white shadow-glow-sm scale-105'
                      : 'bg-dark-500/80 border-white/10 text-slate-300 hover:border-brand-500/30'
                    }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Betting Amount input */}
          <div className="space-y-3">
            <p className="text-slate-300 text-sm font-semibold">Enter Bet Amount</p>
            <div className="flex gap-2">
              <input
                type="number"
                disabled={rolling}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
                className="input-field text-xl font-bold font-mono flex-1 text-center"
                min={10}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  disabled={rolling}
                  onClick={() => setBetAmount(amt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition
                    ${betAmount === amt
                      ? isDemoMode ? 'bg-emerald-600 text-white border border-emerald-500/30' : 'bg-brand-600 text-white border border-brand-400/30'
                      : 'bg-dark-500 hover:bg-dark-400 text-slate-300'
                    }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Roll CTA button */}
          <button
            onClick={handlePlaceBet}
            disabled={rolling || !selectedNum}
            className={`w-full py-4 rounded-xl font-display font-black text-lg flex items-center justify-center gap-2 transition-all
              ${selectedNum && !rolling
                ? isDemoMode
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-emerald hover:shadow-glow-emerald-lg active:scale-95'
                  : 'btn-primary shadow-glow hover:shadow-glow-lg animate-glow'
                : 'bg-dark-500 text-slate-500 cursor-not-allowed'
              }`}
          >
            {rolling ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current text-yellow-400 animate-pulse" />
                {selectedNum ? `Roll & Bet ${isDemoMode ? '🪙' : ''}₹${betAmount}` : 'Select target number'}
              </>
            )}
          </button>
        </div>

        {/* Right column: 3D Roll visualizer */}
        <div className="glass-card p-6 flex flex-col items-center justify-center space-y-6 min-h-[350px] relative overflow-hidden">
          <div className={`absolute w-48 h-48 rounded-full blur-3xl opacity-30 transition-colors duration-500
            ${winStatus === 'win' ? 'bg-emerald-500' : winStatus === 'lose' ? 'bg-red-500' : isDemoMode ? 'bg-emerald-600' : 'bg-brand-600'}`}
          />

          {/* Dice Box */}
          <div className="relative z-10">
            <div
              className={`w-28 h-28 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-500 to-accent
                shadow-2xl flex items-center justify-center border-4 border-brand-400 font-display font-black text-white text-4xl
                transition-all duration-300 select-none
                ${rolling ? 'animate-spin scale-110 shadow-glow-lg' : ''}
                ${winStatus === 'win' ? 'border-emerald-500 scale-105' : winStatus === 'lose' ? 'border-red-500' : ''}`}
            >
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center font-black font-mono">
                {diceResult}
              </div>
            </div>
          </div>

          {/* Status Display */}
          <div className="text-center z-10 min-h-[50px]">
            {rolling && <p className="text-brand-400 font-bold animate-pulse">🎲 Dice is rolling...</p>}
            {winStatus === 'win' && (
              <div className="space-y-1">
                <p className="text-emerald-400 text-xl font-black">🎉 WINNER!</p>
                <p className="text-slate-400 text-xs">Result: {diceResult} matched your choice! (Won 6x)</p>
              </div>
            )}
            {winStatus === 'lose' && (
              <div className="space-y-1">
                <p className="text-red-400 text-xl font-black">😔 LOST</p>
                <p className="text-slate-400 text-xs">Result: {diceResult} (You chose {selectedNum})</p>
              </div>
            )}
            {!rolling && winStatus === null && (
              <p className="text-slate-500 text-sm">Select a target number and spin the dice!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiceRoll
