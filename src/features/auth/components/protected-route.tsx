import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import type { UserRole } from '@/types'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: 'var(--g-surface-page)' }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--g-brand-3308)' }} />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Users with no role (pending approval) go to /pending
  if (!role) {
    return <Navigate to="/pending" replace />
  }

  // Corresponsal users should be in the portal, not the internal app
  if (role === 'corresponsal') {
    return <Navigate to="/portal" replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
