import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Icon from './Icon'

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Icon name="progress_activity" className="animate-spin text-primary text-4xl" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={`/${user.role}/dashboard`} replace />

  return <Outlet />
}
