// Email Verification Page
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import { CheckCircle, XCircle, Loader, Zap } from 'lucide-react'

const VerifyEmail = () => {
  const { token } = useParams()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verify = async () => {
      try {
        const data = await api.get(`/auth/verify-email/${token}`)
        setStatus('success')
        setMessage(data.message)
      } catch (err) {
        setStatus('error')
        setMessage(err.message || 'Verification failed')
      }
    }
    verify()
  }, [token])

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-6 glass-card p-10">
        <Link to="/" className="inline-flex items-center gap-2 justify-center">
          <Zap className="w-6 h-6 text-brand-400" />
          <span className="font-display font-black text-xl text-white">Color<span className="text-gradient">Verse</span></span>
        </Link>
        {status === 'loading' && (
          <>
            <Loader className="w-12 h-12 text-brand-400 mx-auto animate-spin" />
            <p className="text-white font-semibold">Verifying your email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Email Verified! 🎉</h2>
            <p className="text-slate-400">{message}</p>
            <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">Start Playing</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Verification Failed</h2>
            <p className="text-slate-400">{message}</p>
            <Link to="/login" className="btn-secondary inline-flex items-center gap-2">Go to Login</Link>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail
