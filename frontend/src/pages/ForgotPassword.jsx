// Forgot Password Page
import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft, Send, Zap } from 'lucide-react'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      toast.error(err.message)
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
          <h2 className="text-2xl font-display font-bold text-white">Forgot Password</h2>
          <p className="text-slate-400 mt-1 text-sm">Enter your email to receive a reset link</p>
        </div>
        <div className="glass-card p-8 space-y-5">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-300 text-sm">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field pl-10" placeholder="your@email.com" required />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                Send Reset Link
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-5xl">📧</div>
              <p className="text-white font-semibold">Email Sent!</p>
              <p className="text-slate-400 text-sm">Check your inbox for the password reset link. Valid for 1 hour.</p>
            </div>
          )}
          <Link to="/login" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition justify-center">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
