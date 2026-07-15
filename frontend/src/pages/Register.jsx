// ============================================================
// Register Page - ColorVerse
// ============================================================
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Mail, Lock, User, Phone, Hash, Zap, ArrowRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const Register = () => {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    referralCode: searchParams.get('ref') || '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [warmingUp, setWarmingUp] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', color: '', width: '0%' }
    const checks = [
      pwd.length >= 8,
      /[A-Z]/.test(pwd),
      /[0-9]/.test(pwd),
      /[^A-Za-z0-9]/.test(pwd),
    ]
    const score = checks.filter(Boolean).length
    const map = [
      { label: 'Weak', color: 'bg-red-500', width: '25%' },
      { label: 'Fair', color: 'bg-amber-500', width: '50%' },
      { label: 'Good', color: 'bg-blue-500', width: '75%' },
      { label: 'Strong', color: 'bg-emerald-500', width: '100%' },
    ]
    return map[score - 1] || { label: '', color: '', width: '0%' }
  }

  const strength = getPasswordStrength(formData.password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match')
    }
    if (formData.password.length < 8) {
      return toast.error('Password must be at least 8 characters')
    }

    setLoading(true)
    setWarmingUp(false)

    // Show "warming up" message after 5 seconds
    const warmTimer = setTimeout(() => setWarmingUp(true), 5000)

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        referralCode: formData.referralCode,
      })
      clearTimeout(warmTimer)
      navigate('/login', {
        state: {
          autoLogin: true,
          email: formData.email,
          password: formData.password,
        },
      })
    } catch (err) {
      clearTimeout(warmTimer)
      toast.error(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
      setWarmingUp(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-brand-700/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />

      <div className="w-full max-w-lg relative z-10 animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gaming-gradient flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-black text-2xl text-white">
              Color<span className="text-gradient">Verse</span>
            </span>
          </Link>
          <h2 className="text-3xl font-display font-bold text-white">Create Account</h2>
          <p className="text-slate-400 mt-2">Join the ultimate gaming platform</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-slate-300 text-sm font-medium">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="gamertag123"
                  className="input-field pl-10"
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="^[a-zA-Z0-9_]+$"
                />
              </div>
              <p className="text-slate-500 text-xs">Letters, numbers, underscores only</p>
            </div>

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
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-slate-300 text-sm font-medium">Phone (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="input-field pl-10"
                  maxLength={10}
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
                  placeholder="Min. 8 characters"
                  className="input-field pl-10 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength Indicator */}
              {formData.password && (
                <div className="space-y-1">
                  <div className="h-1 bg-dark-400 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">Strength: <span className={`font-medium text-${strength.color?.replace('bg-', '')}`}>{strength.label}</span></p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-slate-300 text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className={`input-field pl-10 ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-500' : ''
                  }`}
                  required
                />
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>

            {/* Referral Code */}
            <div className="space-y-1.5">
              <label className="text-slate-300 text-sm font-medium">
                Referral Code <span className="text-slate-500">(Optional - earn ₹50 bonus!)</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleChange}
                  placeholder="ABCD1234"
                  className="input-field pl-10 uppercase"
                  maxLength={8}
                />
              </div>
            </div>

            {/* Terms */}
            <p className="text-slate-500 text-xs text-center">
              By creating an account, you agree to our{' '}
              <span className="text-brand-400 cursor-pointer">Terms of Service</span>{' '}
              and confirm you are 18+ years old.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
            >
              {loading ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {warmingUp && (
                    <span className="text-xs text-white/70 mt-1">
                      ⏳ Server warming up, please wait...
                    </span>
                  )}
                </div>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
