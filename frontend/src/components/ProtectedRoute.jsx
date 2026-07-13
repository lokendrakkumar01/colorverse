// Protected Route - Redirects to login if not authenticated
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingSpinner fullScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <Outlet />
}

export default ProtectedRoute
