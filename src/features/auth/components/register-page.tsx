import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '../hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { COUNTRIES } from '@/lib/countries'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firmName, setFirmName] = useState('')
  const [country, setCountry] = useState('')
  const [taxId, setTaxId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const signUp = useAuth((s) => s.signUp)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!firmName.trim() || !country || !taxId.trim()) {
      setError('Todos los campos son obligatorios')
      return
    }

    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    // 1. Sign up the user (no role yet - pending approval)
    const { data, error: signUpError } = await signUp(email, password)

    if (signUpError || !data?.user) {
      setLoading(false)
      setError(signUpError ?? 'Error al crear la cuenta')
      return
    }

    // 2. Create correspondent record with pending_approval status
    const { error: insertError } = await supabase.from('correspondents').insert({
      name: firmName.trim(),
      country,
      tax_id: taxId.trim(),
      address: '',
      email,
      status: 'pending_approval',
      user_id: data.user.id,
    })

    setLoading(false)

    if (insertError) {
      setError(`Cuenta creada pero error al registrar datos: ${insertError.message}`)
      return
    }

    navigate('/pending')
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
          <p
            className="mt-2"
            style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}
          >
            Portal de corresponsales
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registro de corresponsal</CardTitle>
            <CardDescription>
              Completa tus datos para solicitar acceso al portal. Un administrador revisara tu
              solicitud.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="firmName">Nombre del despacho</Label>
                <Input
                  id="firmName"
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="Despacho Juridico Ejemplo S.L."
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="country">Pais</Label>
                <Select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                >
                  <option value="">Selecciona un pais</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="taxId">NIF / Tax ID</Label>
                <Input
                  id="taxId"
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="B12345678"
                  required
                />
              </div>

              <div className="border-t my-2" style={{ borderColor: 'var(--g-border-default)' }} />

              <div className="flex flex-col gap-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contacto@despacho.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="reg-password">Contrasena</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  required
                  autoComplete="new-password"
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
                {loading ? 'Registrando...' : 'Solicitar acceso'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                ¿Ya tienes cuenta?{' '}
                <Link
                  to="/login"
                  className="font-medium underline"
                  style={{ color: 'var(--g-brand-3308)' }}
                >
                  Inicia sesion
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
