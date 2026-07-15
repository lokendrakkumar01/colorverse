// ============================================================
// Login Page - ColorVerse
// ============================================================
import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Mail, Lock, Zap, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [warmingUp, setWarmingUp] = useState(false)
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Handle auto-login transition from successful registration
  useEffect(() => {
    const state = location.state
    if (state?.autoLogin && state?.email && state?.password) {
      setFormData({ email: state.email, password: state.password })
      setIsAutoLoggingIn(true)

      const performAutoLogin = async () => {
        setLoading(true)
        try {
          await login(state.email, state.password)
          toast.success('Registration successful! Welcome to your dashboard.')
          navigate('/dashboard')
        } catch (err) {
          toast.error(err.message || 'Auto-login failed. Please sign in manually.')
          setIsAutoLoggingIn(false)
        } finally {
          setLoading(false)
        }
      }

      // Small timeout to allow visual transition effect
      const timer = setTimeout(performAutoLogin, 1000)
      return () => clearTimeout(timer)
    }
  }, [location, navigate, login])

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
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
              <h2 className="text-2xl font-display font-bold text-white">
                {isAutoLoggingIn ? 'Creating Session...' : 'Welcome Back!'}
              </h2>
              <p className="text-slate-400 mt-1 text-sm font-medium">
                {isAutoLoggingIn ? 'Logging you in automatically, please wait...' : 'Sign in to continue playing'}
              </p>
            </div>

            {isAutoLoggingIn ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-brand-600/30 border-t-brand-500 rounded-full animate-spin" />
                <p className="text-xs text-brand-400 font-bold animate-pulse">Auto Authenticating...</p>
              </div>
            ) : (
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
                  <div className="flex justify-between items-center">
                    <label className="text-slate-300 text-sm font-medium">Password</label>
                    <Link to="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 font-semibold">
                      Forgot?
                    </Link>
                  </div>
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

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 mt-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Login <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {warmingUp && (
                  <p className="text-xxs text-amber-400 text-center animate-pulse font-semibold mt-2">
                    ⏳ Backend server warming up (Render cold start)... Please wait.
                  </p>
                )}
              </form>
            )}

            {!isAutoLoggingIn && (
              <div className="text-center pt-2">
                <p className="text-slate-400 text-xs font-semibold">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-brand-400 hover:text-brand-300">
                    Register Now
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
