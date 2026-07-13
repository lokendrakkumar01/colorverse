// ============================================================
// Auth Context - ColorVerse Frontend
// ============================================================
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('cv_token'))

  // ============================================================
  // Load user on mount / token change
  // ============================================================
  useEffect(() => {
    if (token) {
      fetchMe()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchMe = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get('/auth/me')
      setUser(data.user)
      setWallet(data.wallet)
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }, [])

  // ============================================================
  // Register
  // ============================================================
  const register = async (formData) => {
    const data = await api.post('/auth/register', formData)
    const { token: newToken, user: newUser, wallet: newWallet } = data
    localStorage.setItem('cv_token', newToken)
    setToken(newToken)
    setUser(newUser)
    setWallet(newWallet)
    toast.success('Account created! Please verify your email.')
    return data
  }

  // ============================================================
  // Login
  // ============================================================
  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password })
    const { token: newToken, user: newUser, wallet: newWallet } = data
    localStorage.setItem('cv_token', newToken)
    setToken(newToken)
    setUser(newUser)
    setWallet(newWallet)
    toast.success(`Welcome back, ${newUser.username}! 🎮`)
    return data
  }

  // ============================================================
  // Logout
  // ============================================================
  const logout = useCallback(() => {
    localStorage.removeItem('cv_token')
    localStorage.removeItem('cv_user')
    setToken(null)
    setUser(null)
    setWallet(null)
    toast.success('Logged out successfully')
  }, [])

  // ============================================================
  // Update wallet balance (called by socket events)
  // ============================================================
  const updateWallet = useCallback((walletData) => {
    setWallet(prev => ({ ...prev, ...walletData }))
  }, [])

  // ============================================================
  // Refresh user data
  // ============================================================
  const refreshUser = useCallback(() => {
    if (token) fetchMe()
  }, [token, fetchMe])

  const isAdmin = user?.role === 'admin'
  const isAuthenticated = !!user

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        token,
        loading,
        isAdmin,
        isAuthenticated,
        register,
        login,
        logout,
        updateWallet,
        refreshUser,
        setWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
