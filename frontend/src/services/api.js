// ============================================================
// Axios API Service - ColorVerse Frontend
// ============================================================
import axios from 'axios'

// Hardcoded production backend URL as primary fallback
const PRODUCTION_API = 'https://colorverse2.onrender.com/api'
const API_BASE_URL = import.meta.env.VITE_API_URL || PRODUCTION_API

console.log('🌐 API Base URL:', API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // 90 seconds for Render free tier cold starts
  headers: {
    'Content-Type': 'application/json',
  },
})

// ============================================================
// Request Interceptor - Attach JWT Token
// ============================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cv_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ============================================================
// Response Interceptor - Handle Errors
// ============================================================
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'Something went wrong'

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      message = 'Server is taking too long to respond. Please try again.'
    } else if (!error.response) {
      message = 'Cannot connect to server. Please check your connection.'
    } else {
      message =
        error.response?.data?.message ||
        error.message ||
        'Something went wrong'
    }

    // Auto-logout on 401
    if (error.response?.status === 401) {
      localStorage.removeItem('cv_token')
      localStorage.removeItem('cv_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject({ message, status: error.response?.status })
  }
)

// ============================================================
// Wake up backend on app start (Render free tier cold start fix)
// ============================================================
export const wakeUpBackend = async () => {
  try {
    await axios.get(`${API_BASE_URL.replace('/api', '')}/api/health`, {
      timeout: 30000,
    })
    console.log('✅ Backend is awake')
  } catch {
    console.log('⏳ Backend warming up...')
  }
}

export default api
