import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '../hooks/use-auth'
import { Building, Users } from 'lucide-react'

type AccessMode = 'internal' | 'portal'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [accessMode, setAccessMode] = useState<AccessMode>('internal')
  const signIn = useAuth((s) => s.signIn)
  const role = useAuth((s) => s.role)
  const user = useAuth((s) => s.user)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setLoading(false)
      setError(error)
      return
    }

    // signIn() now updates the store directly, so role is immediately available
    const currentRole = useAuth.getState().role

    setLoading(false)

    // Validate role matches selected access mode
    if (accessMode === 'portal') {
      if (currentRole === 'corresponsal') {
        navigate('/portal')
      } else if (!currentRole) {
        navigate('/pending')
      } else {
        // Internal user tried to access portal
        await useAuth.getState().signOut()
        setError('Esta cuenta no tiene acceso al portal de corresponsales.')
      }
    } else {
      // accessMode === 'internal'
      if (currentRole === 'corresponsal') {
        // Corresponsal tried to access internal app
        await useAuth.getState().signOut()
        setError('Tu cuenta es de corresponsal. Selecciona "Portal corresponsal" para acceder.')
      } else if (!currentRole) {
        navigate('/pending')
      } else {
        navigate('/')
      }
    }
  }

  // If already logged in, redirect
  if (user && role === 'corresponsal') {
    return <Navigate to="/portal" replace />
  }
  if (user && role && role !== 'corresponsal') {
    return <Navigate to="/" replace />
  }

  const isPortal = accessMode === 'portal'

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ backgroundColor: 'var(--g-surface-page)' }}
    >
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 text-center">
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h1)', color: 'var(--g-brand-3308)' }}
          >
            LIQUIDA360
          </h1>
          <p
            className="mt-2"
            style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}
          >
            Gestion de pagos a corresponsales
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Iniciar sesion</CardTitle>
            <CardDescription>
              {isPortal
                ? 'Accede al portal de tu despacho'
                : 'Introduce tus credenciales para acceder'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Access mode selector */}
            <div
              className="grid grid-cols-2 gap-1 p-1 mb-5"
              style={{
                backgroundColor: 'var(--g-surface-secondary)',
                borderRadius: 'var(--g-radius-md)',
              }}
              role="tablist"
              aria-label="Tipo de acceso"
            >
              <button
                type="button"
                role="tab"
                aria-selected={!isPortal}
                onClick={() => {
                  setAccessMode('internal')
                  setError(null)
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium transition-all"
                style={{
                  borderRadius: 'var(--g-radius-sm)',
                  backgroundColor: !isPortal ? 'var(--g-surface-primary)' : 'transparent',
                  color: !isPortal ? 'var(--g-brand-3308)' : 'var(--g-text-secondary)',
                  boxShadow: !isPortal ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <Users className="h-4 w-4" />
                Interno
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isPortal}
                onClick={() => {
                  setAccessMode('portal')
                  setError(null)
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium transition-all"
                style={{
                  borderRadius: 'var(--g-radius-sm)',
                  backgroundColor: isPortal ? 'var(--g-surface-primary)' : 'transparent',
                  color: isPortal ? 'var(--g-brand-3308)' : 'var(--g-text-secondary)',
                  boxShadow: isPortal ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <Building className="h-4 w-4" />
                Corresponsal
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isPortal ? 'email@despacho.com' : 'usuario@empresa.com'}
                  required
                  autoComplete="email"
                  error={!!error}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Contrasena</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contrasena"
                  required
                  autoComplete="current-password"
                  error={!!error}
                />
              </div>

              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="text-sm p-3"
                  style={{
                    color: 'var(--status-error)',
                    backgroundColor: 'hsl(0, 84%, 60%, 0.1)',
                    borderRadius: 'var(--g-radius-sm)',
                  }}
                >
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full mt-2">
                {loading ? 'Accediendo...' : isPortal ? 'Acceder al portal' : 'Acceder'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                ¿Aun no tienes cuenta?{' '}
                <Link
                  to="/register"
                  className="font-medium underline"
                  style={{ color: 'var(--g-brand-3308)' }}
                >
                  Registrate aqui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
