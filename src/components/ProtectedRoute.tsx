import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="min-h-screen bg-[#0c0a1e] flex items-center justify-center"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, profileLoading } = useAuth()
  // Wait for session AND profile — isAdmin depends on profile.role
  if (loading || profileLoading) return <div className="min-h-screen bg-[#0c0a1e] flex items-center justify-center"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}
