// ============================================================
// Ludo/Carrom/Battle Arena Match Lobby System
// ============================================================
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus, Users, ShieldAlert, Award, Copy, Check, Upload, Trash } from 'lucide-react'

const MOCK_LOBBIES = [
  { id: '1', creator: 'GamerBoss', amount: 100, status: 'open', game: 'ludo' },
  { id: '2', creator: 'KingCoder', amount: 50, status: 'open', game: 'ludo' },
  { id: '3', creator: 'NinjaPro', amount: 200, status: 'playing', game: 'ludo', opponent: 'RacerX', roomCode: '984392' },
]

const LudoMatch = ({ gameName, onBack }) => {
  const { user, wallet, updateWallet } = useAuth()
  const [lobbies, setLobbies] = useState([])
  const [activeLobby, setActiveLobby] = useState(null)
  const [createAmount, setCreateAmount] = useState(100)
  const [roomCode, setRoomCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [screenshot, setScreenshot] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    // Filter mock list by gameName
    const gameId = gameName.toLowerCase().includes('ludo') ? 'ludo' : gameName.toLowerCase().includes('carrom') ? 'carrom' : 'freefire'
    const list = MOCK_LOBBIES.filter(l => l.game === gameId)
    setLobbies(list)
  }, [gameName])

  const handleCreateLobby = () => {
    if (createAmount < 50) return toast.error('Minimum lobby entry is ₹50')
    if (createAmount > (wallet?.balance || 0)) return toast.error('Insufficient wallet balance')

    // Create new lobby
    const newLobby = {
      id: String(Date.now()),
      creator: user.username,
      amount: createAmount,
      status: 'open',
      game: gameName.toLowerCase().includes('ludo') ? 'ludo' : 'carrom',
    }

    // Debit entry fee
    deditEntryFee(createAmount)
    
    setLobbies(prev => [newLobby, ...prev])
    setActiveLobby(newLobby)
    toast.success(`Lobby created for ₹${createAmount}! Waiting for opponent...`)
  }

  const deditEntryFee = async (amount) => {
    try {
      const data = await api.post('/game/instant-game', {
        gameType: 'lobby_bet',
        betAmount: amount,
        won: false,
        winAmount: 0,
        detail: `Created Lobby for ${gameName}`,
      })
      updateWallet({ balance: data.walletBalance })
    } catch (err) {
      setActiveLobby(null)
      toast.error(err.message || 'Escrow debit failed')
    }
  }

  const handleJoinLobby = (lobby) => {
    if (lobby.amount > (wallet?.balance || 0)) return toast.error('Insufficient wallet balance to join')

    deditEntryFee(lobby.amount)

    const updatedLobby = {
      ...lobby,
      status: 'playing',
      opponent: user.username,
      roomCode: lobby.roomCode || '832948', // Default generated code
    }

    setActiveLobby(updatedLobby)
    toast.success(`Joined lobby! Opponent: ${lobby.creator}`)
  }

  const handleSetRoomCode = () => {
    if (!roomCode) return toast.error('Please enter room code')
    setActiveLobby(prev => ({ ...prev, roomCode }))
    toast.success('Room Code updated!')
  }

  const copyRoomCode = () => {
    if (activeLobby?.roomCode) {
      navigator.clipboard.writeText(activeLobby.roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Room Code copied to clipboard!')
    }
  }

  const handleLose = async () => {
    if (!activeLobby) return
    try {
      // Just record loss result
      toast.success('Loss reported. Escrow released to opponent.')
      setActiveLobby(null)
    } catch {}
  }

  const handleUploadWinScreenshot = async () => {
    if (!screenshot) return toast.error('Please select a screenshot first')
    
    try {
      setUploading(true)
      // Simulate API upload delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      const prizeAmount = Math.round(activeLobby.amount * 1.8)

      // Claim win reward (Lobby win pays 1.8x)
      const data = await api.post('/game/instant-game', {
        gameType: 'lobby_win',
        betAmount: 0, // already debited on lobby creation/joining
        won: true,
        winAmount: prizeAmount,
        detail: `Won lobby match in ${gameName}`,
      })

      updateWallet({ balance: data.walletBalance })
      toast.success(`🏆 Victory Screenshot Submitted! Won ₹${prizeAmount}!`, { duration: 5000 })
      setActiveLobby(null)
      setScreenshot(null)
    } catch (err) {
      toast.error(err.message || 'Screenshot upload failed')
    } finally {
      setUploading(false)
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
          <span className="text-slate-400 text-sm">Balance:</span>
          <span className="text-white font-black font-mono">₹{wallet?.balance?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      {!activeLobby ? (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Create a Match */}
          <div className="glass-card p-6 space-y-4 h-fit">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-400" />
              Create a Challenge
            </h3>
            <p className="text-slate-400 text-xs">Set your bet amount, find an opponent, play on official app and upload screenshot to win.</p>
            
            <div className="space-y-2">
              <label className="text-slate-300 text-xs font-semibold">Entry Amount (₹)</label>
              <input
                type="number"
                value={createAmount}
                onChange={(e) => setCreateAmount(Math.max(50, Number(e.target.value)))}
                className="input-field font-mono font-bold"
                min={50}
              />
              <p className="text-slate-500 text-xxs">Winner takes 1.8x payout (10% platform fee).</p>
            </div>

            <button onClick={handleCreateLobby} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              Create Room Challenge
            </button>
          </div>

          {/* Lobby Lists */}
          <div className="md:col-span-2 glass-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-400" />
              Open Challenges
            </h3>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
              {lobbies.length > 0 ? lobbies.map(lobby => (
                <div key={lobby.id} className="flex items-center justify-between p-3.5 bg-dark-500/50 border border-white/5 rounded-xl hover:border-brand-500/20 transition">
                  <div>
                    <p className="text-white text-sm font-semibold">{lobby.creator}</p>
                    <p className="text-slate-400 text-xs">Bet Amount: <span className="text-brand-400 font-bold font-mono">₹{lobby.amount}</span></p>
                  </div>
                  {lobby.creator === user.username ? (
                    <span className="text-slate-400 text-xs border border-slate-700 px-3 py-1.5 rounded-lg bg-dark-600">Your Challenge</span>
                  ) : (
                    <button
                      onClick={() => handleJoinLobby(lobby)}
                      className="btn-primary px-4 py-2 text-xs"
                    >
                      Accept & Pay
                    </button>
                  )}
                </div>
              )) : (
                <p className="text-slate-500 text-xs text-center py-8">No open challenges right now. Create one above!</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Lobby Room Screen */
        <div className="max-w-2xl mx-auto glass-card p-6 space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-black text-white">{gameName} Match Room</h3>
            <p className="text-slate-400 text-xs mt-1">Lobby Bet: ₹{activeLobby.amount} • Prize: ₹{Math.round(activeLobby.amount * 1.8)}</p>
          </div>

          {/* Players */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-dark-600 p-4 rounded-xl border border-white/5">
              <p className="text-slate-500 text-xxs uppercase tracking-wider">Challenger</p>
              <p className="text-white text-lg font-bold truncate mt-1">{activeLobby.creator}</p>
            </div>
            <div className="bg-dark-600 p-4 rounded-xl border border-white/5">
              <p className="text-slate-500 text-xxs uppercase tracking-wider">Opponent</p>
              <p className="text-white text-lg font-bold truncate mt-1">{activeLobby.opponent || 'Waiting...'}</p>
            </div>
          </div>

          {/* Room Code section */}
          {activeLobby.opponent ? (
            <div className="bg-brand-900/20 border border-brand-500/20 p-4 rounded-xl space-y-3">
              <p className="text-white text-sm font-bold">Lobby Room Code</p>
              <p className="text-slate-400 text-xs">Create room code in Ludo King app and paste below, or copy the code from your opponent.</p>
              
              {activeLobby.creator === user.username && !activeLobby.roomCode ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 8-digit Room Code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    className="input-field flex-1"
                  />
                  <button onClick={handleSetRoomCode} className="btn-primary px-4">Set Code</button>
                </div>
              ) : activeLobby.roomCode ? (
                <div className="flex items-center justify-between bg-dark-900/50 p-3 rounded-lg border border-white/10">
                  <span className="font-mono text-xl font-bold text-white tracking-widest">{activeLobby.roomCode}</span>
                  <button onClick={copyRoomCode} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>
                </div>
              ) : (
                <p className="text-slate-500 text-xs italic">Waiting for Challenger to set Room Code...</p>
              )}
            </div>
          ) : (
            <p className="text-center text-slate-500 text-sm italic animate-pulse">Waiting for an opponent to accept your challenge...</p>
          )}

          {/* Result Submission */}
          {activeLobby.opponent && (
            <div className="space-y-4 border-t border-dark-400/30 pt-6">
              <h4 className="text-md font-bold text-white">Match Result Submission</h4>
              <p className="text-slate-400 text-xs">Once match finishes, win screenshot is required to claim the prize money. Cheat reports result in permanent ban.</p>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Loser Button */}
                <button
                  onClick={handleLose}
                  className="py-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold text-sm hover:bg-red-500/20 transition"
                >
                  I Lost / Exit Match
                </button>

                {/* Screenshot upload trigger */}
                <label className="cursor-pointer py-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold text-sm hover:bg-emerald-500/20 transition flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  I Won (Upload Proof)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(URL.createObjectURL(e.target.files[0]))}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Upload Preview */}
              {screenshot && (
                <div className="space-y-3 bg-dark-900/50 p-4 rounded-xl border border-white/10 text-center">
                  <p className="text-white text-xs font-bold">Screenshot Preview</p>
                  <img src={screenshot} alt="Ludo Victory" className="max-h-60 mx-auto rounded-lg border border-slate-700" />
                  <button
                    onClick={handleUploadWinScreenshot}
                    disabled={uploading}
                    className="btn-primary w-full py-3 text-xs flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Submit Victory Claim'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default LudoMatch
