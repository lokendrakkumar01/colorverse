// Reset Password Page
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Lock, Eye, EyeOff, Zap, CheckCircle } from 'lucide-react'

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      await api.post(`/auth/reset-password/${token}`, { password })
      toast.success('Password reset! Please log in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Reset failed. Link may have expired.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-grid opacity-10" />
      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Zap className="w-6 h-6 text-brand-400" />
            <span className="font-display font-black text-xl text-white">Color<span className="text-gradient">Verse</span></span>
          </Link>
          <h2 className="text-2xl font-display font-bold text-white">Set New Password</h2>
        </div>
        <div className="glass-card p-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'New Password', value: password, setter: setPassword },
              { label: 'Confirm Password', value: confirm, setter: setConfirm },
            ].map(({ label, value, setter }) => (
              <div key={label} className="space-y-1.5">
                <label className="text-slate-300 text-sm">{label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type={show ? 'text' : 'password'} value={value} onChange={e => setter(e.target.value)} className="input-field pl-10 pr-10" placeholder="••••••••" required minLength={8} />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
