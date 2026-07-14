// ============================================================
// Dice Roll Game Component - Winzo Style
// ============================================================
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Zap, Play, RotateCcw, HelpCircle, ArrowLeft, Coins } from 'lucide-react'

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000]

const DiceRoll = ({ onBack }) => {
  const { wallet, updateWallet } = useAuth()
  const [selectedNum, setSelectedNum] = useState(null)
  const [betAmount, setBetAmount] = useState(100)
  const [rolling, setRolling] = useState(false)
  const [diceResult, setDiceResult] = useState(1)
  const [winStatus, setWinStatus] = useState(null) // 'win', 'lose', null

  const handlePlaceBet = async () => {
    if (!selectedNum) return toast.error('Please select a number (1-6) first!')
    if (betAmount < 10) return toast.error('Minimum bet is ₹10')
    if (betAmount > (wallet?.balance || 0)) return toast.error('Insufficient wallet balance')

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
        {/* Left column: Selecting numbers */}
        <div className="glass-card p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-display font-black text-white flex items-center gap-2">
              🎲 Dice Roll 6X
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
                      ? 'bg-brand-600/40 border-brand-400 text-white shadow-glow-sm scale-105'
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
                      ? 'bg-brand-600 text-white border border-brand-400/30'
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
            disabled={rolling || !selectedNum}
            className={`w-full py-4 rounded-xl font-display font-black text-lg flex items-center justify-center gap-2 transition-all
              ${selectedNum && !rolling
                ? 'btn-primary shadow-glow hover:shadow-glow-lg animate-glow'
                : 'bg-dark-500 text-slate-500 cursor-not-allowed'
              }`}
          >
            {rolling ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                {selectedNum ? `Roll & Bet ₹${betAmount}` : 'Select a Number'}
              </>
            )}
          </button>
        </div>

        {/* Right column: The Rolling Dice visualization */}
        <div className="glass-card p-6 flex flex-col items-center justify-center space-y-6 min-h-[350px] relative overflow-hidden">
          {/* Neon background pulse */}
          <div className={`absolute w-48 h-48 rounded-full blur-3xl opacity-30 transition-colors duration-500
            ${winStatus === 'win' ? 'bg-emerald-500' : winStatus === 'lose' ? 'bg-red-500' : 'bg-brand-600'}`}
          />

          {/* The Dice */}
          <div className="relative z-10">
            <div
              className={`w-28 h-28 rounded-2xl bg-white text-dark-900 shadow-2xl flex items-center justify-center
                border-4 border-slate-200 transition-all duration-300
                ${rolling ? 'animate-spin scale-110 shadow-glow-lg' : ''}
                ${winStatus === 'win' ? 'border-emerald-500 scale-105' : winStatus === 'lose' ? 'border-red-500' : ''}`}
            >
              {/* Render Pip Dots based on diceResult */}
              <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-16 h-16 relative">
                {/* Custom dot placement matching standard dice layouts */}
                {/* Top Left */}
                {[2, 3, 4, 5, 6].includes(diceResult) && <div className="w-3.5 h-3.5 bg-dark-900 rounded-full justify-self-center col-start-1 row-start-1" />}
                {/* Top Right */}
                {[4, 5, 6].includes(diceResult) && <div className="w-3.5 h-3.5 bg-dark-900 rounded-full justify-self-center col-start-3 row-start-1" />}
                {/* Middle Left */}
                {diceResult === 6 && <div className="w-3.5 h-3.5 bg-dark-900 rounded-full justify-self-center col-start-1 row-start-2" />}
                {/* Center dot */}
                {[1, 3, 5].includes(diceResult) && <div className="w-3.5 h-3.5 bg-dark-900 rounded-full justify-self-center col-start-2 row-start-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />}
                {/* Middle Right */}
                {diceResult === 6 && <div className="w-3.5 h-3.5 bg-dark-900 rounded-full justify-self-center col-start-3 row-start-2" />}
                {/* Bottom Left */}
                {[4, 5, 6].includes(diceResult) && <div className="w-3.5 h-3.5 bg-dark-900 rounded-full justify-self-center col-start-1 row-start-3" />}
                {/* Bottom Right */}
                {[2, 3, 4, 5, 6].includes(diceResult) && <div className="w-3.5 h-3.5 bg-dark-900 rounded-full justify-self-center col-start-3 row-start-3" />}
              </div>
            </div>
          </div>

          {/* Status Text overlay */}
          <div className="text-center z-10 min-h-[50px]">
            {rolling && <p className="text-brand-300 font-bold animate-pulse">🎲 Rolling Dice...</p>}
            {winStatus === 'win' && (
              <div className="space-y-1">
                <p className="text-emerald-400 text-xl font-black">🎉 YOU WON!</p>
                <p className="text-slate-400 text-xs">Matching roll: {diceResult} (Won 6x)</p>
              </div>
            )}
            {winStatus === 'lose' && (
              <div className="space-y-1">
                <p className="text-red-400 text-xl font-black">😔 DEFEAT</p>
                <p className="text-slate-400 text-xs">Rolled: {diceResult} (You chose {selectedNum})</p>
              </div>
            )}
            {!rolling && winStatus === null && (
              <p className="text-slate-500 text-sm">Select a number and hit Roll to begin!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiceRoll
