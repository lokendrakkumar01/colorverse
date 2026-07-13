// Profile Page
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Lock, Bell, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

const Profile = () => {
  const { user, refreshUser } = useAuth()
  const [username, setUsername] = useState(user?.username || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [saving, setSaving] = useState(false)
  const [changingPass, setChangingPass] = useState(false)
  const [resending, setResending] = useState(false)

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/users/profile', { username, phone })
      refreshUser()
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.message || 'Update failed')
    } finally { setSaving(false) }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPass !== confirmPass) return toast.error('Passwords do not match')
    setChangingPass(true)
    try {
      await api.put('/users/change-password', { currentPassword: currentPass, newPassword: newPass })
      toast.success('Password changed successfully!')
      setCurrentPass(''); setNewPass(''); setConfirmPass('')
    } catch (err) {
      toast.error(err.message || 'Failed to change password')
    } finally { setChangingPass(false) }
  }

  const handleResendVerification = async () => {
    setResending(true)
    try {
      await api.post('/auth/resend-verification')
      toast.success('Verification email sent! Check your inbox.')
    } catch (err) {
      toast.error(err.message)
    } finally { setResending(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
        <User className="w-6 h-6 text-brand-400" /> Profile Settings
      </h1>

      {/* Email Verification Banner */}
      {!user?.isEmailVerified && (
        <div className="glass-card p-4 border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-white text-sm font-semibold">Email not verified</p>
              <p className="text-slate-400 text-xs">Verify your email to unlock all features</p>
            </div>
          </div>
          <button onClick={handleResendVerification} disabled={resending}
            className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1 whitespace-nowrap">
            {resending ? <div className="w-3 h-3 border border-brand-400 border-t-transparent rounded-full animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Resend
          </button>
        </div>
      )}

      {/* Account Info */}
      <div className="glass-card p-6 space-y-5">
        <h2 className="font-semibold text-white">Account Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-slate-400">Member Since</p><p className="text-white">{new Date(user?.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
          <div><p className="text-slate-400">Referral Code</p><p className="text-brand-400 font-mono font-bold text-lg">{user?.referralCode}</p></div>
          <div><p className="text-slate-400">Email Status</p>
            <span className={`badge ${user?.isEmailVerified ? 'badge-success' : 'badge-warning'}`}>
              {user?.isEmailVerified ? '✓ Verified' : 'Not Verified'}
            </span>
          </div>
          <div><p className="text-slate-400">Account Role</p><span className="badge badge-brand capitalize">{user?.role}</span></div>
        </div>
      </div>

      {/* Update Profile */}
      <form onSubmit={handleUpdateProfile} className="glass-card p-6 space-y-4">
        <h2 className="font-semibold text-white">Update Profile</h2>
        <div className="space-y-1.5">
          <label className="text-slate-300 text-sm">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="input-field pl-10" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-slate-300 text-sm">Email (read-only)</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="email" value={user?.email} disabled className="input-field pl-10 opacity-50 cursor-not-allowed" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-slate-300 text-sm">Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input-field pl-10" placeholder="9876543210" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Save Changes
        </button>
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="glass-card p-6 space-y-4">
        <h2 className="font-semibold text-white">Change Password</h2>
        {[
          { label: 'Current Password', value: currentPass, setter: setCurrentPass },
          { label: 'New Password', value: newPass, setter: setNewPass },
          { label: 'Confirm New Password', value: confirmPass, setter: setConfirmPass },
        ].map(({ label, value, setter }) => (
          <div key={label} className="space-y-1.5">
            <label className="text-slate-300 text-sm">{label}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="password" value={value} onChange={e => setter(e.target.value)} className="input-field pl-10" placeholder="••••••••" />
            </div>
          </div>
        ))}
        <button type="submit" disabled={changingPass} className="btn-primary flex items-center gap-2">
          {changingPass ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
          Change Password
        </button>
      </form>

      {/* Gaming Stats */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-semibold text-white">Gaming Statistics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Games', value: user?.totalGames || 0 },
            { label: 'Total Wins', value: user?.totalWins || 0 },
            { label: 'Total Losses', value: user?.totalLosses || 0 },
            { label: 'Total Bet', value: `₹${(user?.totalBetAmount || 0).toFixed(0)}` },
            { label: 'Total Won', value: `₹${(user?.totalWinAmount || 0).toFixed(0)}` },
            { label: 'Win Rate', value: `${user?.totalGames > 0 ? ((user.totalWins / user.totalGames) * 100).toFixed(1) : 0}%` },
          ].map(s => (
            <div key={s.label} className="bg-dark-700/60 rounded-xl p-3 text-center">
              <p className="text-slate-400 text-xs">{s.label}</p>
              <p className="text-white font-bold font-mono mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Profile
