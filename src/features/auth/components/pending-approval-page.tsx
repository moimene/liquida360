import { useNavigate } from 'react-router-dom'
import { Clock, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '../hooks/use-auth'

export function PendingApprovalPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ backgroundColor: 'var(--g-surface-page)' }}
    >
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h1)', color: 'var(--g-brand-3308)' }}
          >
            LIQUIDA360
          </h1>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-8">
            <div
              className="flex h-16 w-16 items-center justify-center"
              style={{
                backgroundColor: 'var(--status-alert-bg-soft)',
                borderRadius: 'var(--g-radius-full)',
              }}
            >
              <Clock className="h-8 w-8" style={{ color: 'var(--status-alert)' }} />
            </div>

            <div className="text-center">
              <h2
                className="font-bold mb-2"
                style={{ fontSize: 'var(--g-text-h3)', color: 'var(--g-text-primary)' }}
              >
                Registro pendiente de aprobacion
              </h2>
              <p
                className="max-w-sm"
                style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}
              >
                Tu solicitud de acceso esta siendo revisada por un administrador. Recibiras un email
                de confirmacion cuando sea aprobada.
              </p>
            </div>

            {user && (
              <p
                className="text-sm px-3 py-1.5"
                style={{
                  backgroundColor: 'var(--g-surface-muted)',
                  borderRadius: 'var(--g-radius-full)',
                  color: 'var(--g-text-secondary)',
                }}
              >
                {user.email}
              </p>
            )}

            <Button variant="outline" onClick={handleSignOut} className="mt-2">
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
