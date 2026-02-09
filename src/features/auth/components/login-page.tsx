import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '../hooks/use-auth'
import { Building, Users, FlaskConical, Shield } from 'lucide-react'

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

        {/* Test credentials table */}
        <div
          className="mt-4 animate-fade-in"
          style={{
            border: '1px dashed var(--g-border-subtle)',
            borderRadius: 'var(--g-radius-lg)',
            backgroundColor: 'var(--g-surface-card)',
            overflow: 'hidden',
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2.5"
            style={{
              backgroundColor: 'var(--g-surface-muted)',
              borderBottom: '1px solid var(--g-border-default)',
            }}
          >
            <FlaskConical className="h-3.5 w-3.5" style={{ color: 'var(--g-text-secondary)' }} />
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--g-text-secondary)' }}
            >
              Usuarios de prueba — clic para autocompletar
            </span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                <th
                  className="px-3 py-2 text-left font-medium"
                  style={{ color: 'var(--g-text-secondary)' }}
                >
                  {isPortal ? 'Despacho' : 'Rol'}
                </th>
                <th
                  className="px-3 py-2 text-left font-medium"
                  style={{ color: 'var(--g-text-secondary)' }}
                >
                  Email
                </th>
              </tr>
            </thead>
            <tbody>
              {(isPortal
                ? [
                    { badge: '🇲🇽 MX', label: 'Bufete Rodriguez', email: 'corresponsal.mx@test.liquida360.com', pw: 'Test1234!' },
                    { badge: '🇨🇱 CL', label: 'Estudio Pacifico', email: 'corresponsal.cl@test.liquida360.com', pw: 'Test1234!' },
                    { badge: '🇨🇳 CN', label: 'Zhu & Partners', email: 'corresponsal.cn@test.liquida360.com', pw: 'Test1234!' },
                    { badge: '🇺🇸 US', label: 'Thompson & Reed', email: 'corresponsal.us@test.liquida360.com', pw: 'Test1234!' },
                    { badge: '🇨🇴 CO', label: 'Mendoza Arias', email: 'corresponsal.co@test.liquida360.com', pw: 'Test1234!' },
                  ]
                : [
                    { badge: 'Admin', label: 'Pedro Martinez', email: 'admin@liquida360.demo', pw: 'Demo2026!' },
                    { badge: 'Supervisor', label: 'Carlos Lopez', email: 'supervisor@liquida360.demo', pw: 'Demo2026!' },
                    { badge: 'Pagador', label: 'Ana Garcia', email: 'pagador@liquida360.demo', pw: 'Demo2026!' },
                    { badge: 'Financiero', label: 'Maria Torres', email: 'financiero@liquida360.demo', pw: 'Demo2026!' },
                  ]
              ).map((t) => (
                <tr
                  key={t.email}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid var(--g-border-default)' }}
                  onClick={() => {
                    setEmail(t.email)
                    setPassword(t.pw)
                    setError(null)
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--g-surface-muted)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <td className="px-3 py-2" style={{ color: 'var(--g-text-primary)' }}>
                    <span className="font-medium">{t.badge}</span>
                    <span className="ml-1.5" style={{ color: 'var(--g-text-secondary)' }}>
                      {t.label}
                    </span>
                  </td>
                  <td
                    className="px-3 py-2 font-mono"
                    style={{ color: 'var(--g-brand-3308)', fontSize: '10px' }}
                  >
                    {t.email}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div
            className="px-3 py-2 text-center"
            style={{
              backgroundColor: 'var(--g-surface-muted)',
              borderTop: '1px solid var(--g-border-default)',
            }}
          >
            <span
              className="text-xs font-mono"
              style={{ color: 'var(--g-text-secondary)' }}
            >
              Password: {isPortal ? 'Test1234!' : 'Demo2026!'}
            </span>
          </div>
        </div>

        {/* Security manifest link */}
        <div className="mt-4 text-center">
          <Link
            to="/security"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              color: 'var(--g-text-secondary)',
              borderRadius: 'var(--g-radius-md)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--g-brand-3308)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--g-text-secondary)'
            }}
          >
            <Shield className="h-4 w-4" />
            Manifiesto de Seguridad
          </Link>
        </div>
      </div>
    </div>
  )
}
