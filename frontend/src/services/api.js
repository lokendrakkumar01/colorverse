// ============================================================
// Axios API Service - ColorVerse Frontend
// ============================================================
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
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
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong'

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

export default api
