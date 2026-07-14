// ============================================================
// Coin Flip Game Component - Winzo Style
// ============================================================
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Coins, Play } from 'lucide-react'

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000]

const CoinFlip = ({ onBack }) => {
  const { wallet, updateWallet } = useAuth()
  const [selectedSide, setSelectedSide] = useState(null) // 'heads', 'tails'
  const [betAmount, setBetAmount] = useState(100)
  const [flipping, setFlipping] = useState(false)
  const [flipResult, setFlipResult] = useState('heads')
  const [winStatus, setWinStatus] = useState(null) // 'win', 'lose', null

  const handlePlaceBet = async () => {
    if (!selectedSide) return toast.error('Please select Heads or Tails first!')
    if (betAmount < 10) return toast.error('Minimum bet is ₹10')
    if (betAmount > (wallet?.balance || 0)) return toast.error('Insufficient wallet balance')

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
        {/* Left Side: Controls */}
        <div className="glass-card p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-display font-black text-white flex items-center gap-2">
              🪙 Coin Flip 2X
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
                      ? 'bg-brand-600/40 border-brand-400 text-white shadow-glow-sm'
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
                      ? 'bg-brand-600 text-white'
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
                ? 'btn-primary shadow-glow hover:shadow-glow-lg animate-glow'
                : 'bg-dark-500 text-slate-500 cursor-not-allowed'
              }`}
          >
            {flipping ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                {selectedSide ? `Flip & Bet ₹${betAmount}` : 'Select Heads or Tails'}
              </>
            )}
          </button>
        </div>

        {/* Right Side: Coin flip visualizer */}
        <div className="glass-card p-6 flex flex-col items-center justify-center space-y-6 min-h-[350px] relative overflow-hidden">
          <div className={`absolute w-48 h-48 rounded-full blur-3xl opacity-30 transition-colors duration-500
            ${winStatus === 'win' ? 'bg-emerald-500' : winStatus === 'lose' ? 'bg-red-500' : 'bg-brand-600'}`}
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
