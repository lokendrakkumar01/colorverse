// Admin Route Guard
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

const AdminRoute = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) return <LoadingSpinner fullScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return <Outlet />
}

export default AdminRoute
