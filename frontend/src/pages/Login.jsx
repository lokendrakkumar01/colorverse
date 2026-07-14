// ============================================================
// Login Page - ColorVerse
// ============================================================
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Mail, Lock, Zap, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [warmingUp, setWarmingUp] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      return toast.error('Please fill in all fields')
    }

    setLoading(true)
    setWarmingUp(false)
    const warmTimer = setTimeout(() => setWarmingUp(true), 5000)

    try {
      await login(formData.email, formData.password)
      clearTimeout(warmTimer)
      navigate('/dashboard')
    } catch (err) {
      clearTimeout(warmTimer)
      toast.error(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
      setWarmingUp(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-900 to-dark-900 items-center justify-center">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 text-center p-12 space-y-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gaming-gradient flex items-center justify-center shadow-glow-lg animate-glow">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-display font-black text-white">
            Color<span className="text-gradient">Verse</span>
          </h1>
          <p className="text-slate-400 text-xl max-w-md leading-relaxed">
            The ultimate color prediction gaming platform.
            Predict. Win. Withdraw.
          </p>

          {/* Color circles decoration */}
          <div className="flex gap-3 justify-center flex-wrap max-w-xs mx-auto">
            {['bg-game-red','bg-game-green','bg-game-blue','bg-game-yellow','bg-game-purple',
              'bg-game-orange','bg-game-pink','bg-game-teal','bg-game-coral','bg-game-lime'].map((c, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-full ${c} animate-float shadow-lg`}
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            {[
              { label: 'Players', value: '50K+' },
              { label: 'Games/Day', value: '2,880' },
            ].map(s => (
              <div key={s.label} className="glass-card p-4 text-center">
                <p className="text-2xl font-black text-gradient-gold">{s.value}</p>
                <p className="text-slate-400 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-grid opacity-10" />

        <div className="w-full max-w-md relative z-10 animate-slide-up">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Zap className="w-6 h-6 text-brand-400" />
            <span className="font-display font-black text-2xl text-white">
              Color<span className="text-gradient">Verse</span>
            </span>
          </div>

          <div className="glass-card p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-white">Welcome Back!</h2>
              <p className="text-slate-400 mt-1 text-sm">Sign in to continue playing</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-slate-300 text-sm font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="input-field pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-slate-300 text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input-field pl-10 pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-brand-400 text-sm hover:text-brand-300 transition">
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
              >
                {loading ? (
                  <div className="flex flex-col items-center gap-1 w-full">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {warmingUp && (
                      <span className="text-xs text-white/70">
                        ⏳ Server warming up, please wait...
                      </span>
                    )}
                  </div>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Register Link */}
            <p className="text-center text-slate-400 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
