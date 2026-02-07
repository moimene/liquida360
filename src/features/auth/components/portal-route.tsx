import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { Loader2 } from 'lucide-react'

interface PortalRouteProps {
  children: React.ReactNode
}

export function PortalRoute({ children }: PortalRouteProps) {
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

  // Users without a role are pending approval
  if (!role) {
    return <Navigate to="/pending" replace />
  }

  // Only corresponsal role can access the portal
  if (role !== 'corresponsal') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
