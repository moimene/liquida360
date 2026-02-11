import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import type { GInvoiceRole } from '@/types'
import { Loader2 } from 'lucide-react'
import { isGInvoiceEnabled } from '@/lib/feature-flags'

interface GInvoiceRouteProps {
  children: React.ReactNode
  allowedRoles?: GInvoiceRole[]
}

export function GInvoiceRoute({ children, allowedRoles }: GInvoiceRouteProps) {
  const { user, role, ginvRole, loading } = useAuth()

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

  // Users with no role at all (pending approval) go to /pending
  if (!role && !ginvRole) {
    return <Navigate to="/pending" replace />
  }

  // Corresponsal users should be in the portal
  if (role === 'corresponsal') {
    return <Navigate to="/portal" replace />
  }

  // Must have G-Invoice enabled + role to access these routes
  if (!isGInvoiceEnabled(user)) {
    return <Navigate to="/" replace />
  }

  if (!ginvRole) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(ginvRole)) {
    return <Navigate to="/g-invoice" replace />
  }

  return <>{children}</>
}
