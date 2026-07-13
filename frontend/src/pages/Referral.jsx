// ============================================================
// Referral Page - ColorVerse
// ============================================================
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Copy, Users, Gift, TrendingUp, CheckCircle, Share2, Link as LinkIcon } from 'lucide-react'

const Referral = () => {
  const { user, wallet } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/referrals/dashboard')
        setData(res)
      } catch {}
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const referralLink = `${window.location.origin}/register?ref=${user?.referralCode}`

  const copyCode = async () => {
    await navigator.clipboard.writeText(user?.referralCode || '')
    setCopied(true)
    toast.success('Referral code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink)
    toast.success('Referral link copied!')
  }

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Join ColorVerse!',
        text: 'I\'m winning on ColorVerse! Use my referral code to get ₹50 bonus when you deposit.',
        url: referralLink,
      })
    } else {
      copyLink()
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
        <Gift className="w-6 h-6 text-brand-400" />
        Referral Program
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Referrals', value: data?.stats?.totalReferrals || 0, icon: Users, color: 'text-brand-400', bg: 'bg-brand-600/20' },
          { label: 'Completed', value: data?.stats?.completedReferrals || 0, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-600/20' },
          { label: 'Total Earned', value: `₹${data?.stats?.totalEarned?.toFixed(0) || 0}`, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-600/20' },
          { label: 'Referral Balance', value: `₹${wallet?.referralEarnings?.toFixed(0) || 0}`, icon: Gift, color: 'text-purple-400', bg: 'bg-purple-600/20' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 space-y-3">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-slate-400 text-xs">{s.label}</p>
              <p className={`text-xl font-black font-mono ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Referral Code & Link */}
      <div className="glass-card p-6 space-y-5">
        <h2 className="font-semibold text-white">Your Referral Details</h2>
        <div className="space-y-4">
          {/* Code */}
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-2">Referral Code</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-dark-700 border border-dark-300/40 rounded-xl px-4 py-3 font-mono text-2xl font-black text-brand-400 tracking-widest">
                {user?.referralCode}
              </div>
              <button
                onClick={copyCode}
                className={`p-3 rounded-xl transition-all border ${
                  copied
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-dark-400 border-dark-300/40 text-slate-300 hover:text-white'
                }`}
              >
                {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Link */}
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-2">Referral Link</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-dark-700 border border-dark-300/40 rounded-xl px-4 py-3 font-mono text-xs text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap">
                {referralLink}
              </div>
              <button onClick={copyLink} className="p-3 rounded-xl bg-dark-400 border border-dark-300/40 text-slate-300 hover:text-white transition">
                <LinkIcon className="w-5 h-5" />
              </button>
              <button onClick={shareLink} className="p-3 rounded-xl bg-brand-600/20 border border-brand-600/30 text-brand-400 hover:bg-brand-600/30 transition">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-dark-300/30">
          {[
            { icon: '👥', title: 'Share Code', desc: 'Share your unique code with friends' },
            { icon: '💰', title: 'Friend Deposits', desc: 'They register and make first deposit' },
            { icon: '🎁', title: 'Earn ₹50', desc: 'You earn ₹50 bonus instantly!' },
          ].map(s => (
            <div key={s.title} className="text-center space-y-2">
              <div className="text-3xl">{s.icon}</div>
              <p className="text-white font-semibold text-sm">{s.title}</p>
              <p className="text-slate-400 text-xs">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referred Users Table */}
      {data?.referrals && data.referrals.length > 0 && (
        <div className="glass-card p-5 space-y-4">
          <h2 className="font-semibold text-white">Referred Users ({data.referrals.length})</h2>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Joined</th>
                  <th>Games Played</th>
                  <th>Status</th>
                  <th>Bonus</th>
                </tr>
              </thead>
              <tbody>
                {data.referrals.map(r => (
                  <tr key={r.id}>
                    <td className="text-white font-medium">{r.referee?.username || 'Unknown'}</td>
                    <td className="text-slate-400 text-xs">
                      {new Date(r.referee?.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="text-slate-300">{r.referee?.totalGames || 0}</td>
                    <td><span className={`badge ${r.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{r.status}</span></td>
                    <td className={`font-mono font-bold ${r.bonusPaid ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {r.bonusPaid ? `+₹${r.bonusAmount}` : 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Referral
