import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { UserCircle, Save, MapPin, Building, Globe, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/features/auth'
import { usePortalCorrespondent } from '../hooks/use-portal-correspondent'
import { COUNTRIES } from '@/lib/countries'

export function PortalProfilePage() {
  const user = useAuth((s) => s.user)
  const { correspondent, loading, fetchCorrespondent, updateProfile } = usePortalCorrespondent()

  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchCorrespondent(user.id)
    }
  }, [user?.id, fetchCorrespondent])

  useEffect(() => {
    if (correspondent) {
      setAddress(correspondent.address ?? '')
      setEmail(correspondent.email ?? '')
      setPhone(correspondent.phone ?? '')
    }
  }, [correspondent])

  const countryName = correspondent
    ? (COUNTRIES.find((c) => c.code === correspondent.country)?.name ?? correspondent.country)
    : ''

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!correspondent?.id) return

    setSaving(true)
    const { error } = await updateProfile(correspondent.id, {
      address,
      email: email || null,
      phone: phone || null,
    })
    setSaving(false)

    if (error) {
      toast.error('Error al guardar', { description: error })
    } else {
      toast.success('Perfil actualizado correctamente')
    }
  }

  if (loading || !correspondent) {
    return (
      <div className="flex justify-center py-12">
        <span style={{ color: 'var(--g-text-secondary)' }}>Cargando perfil...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl">
      <div>
        <h1
          className="font-bold"
          style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
        >
          Mi perfil
        </h1>
        <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
          Consulta y actualiza los datos de tu despacho
        </p>
      </div>

      {/* Readonly data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Datos del despacho
          </CardTitle>
          <CardDescription>
            Estos datos solo pueden ser modificados por un administrador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-4">
            <ReadonlyField icon={Building} label="Nombre" value={correspondent.name} />
            <ReadonlyField icon={Globe} label="Pais" value={countryName} />
            <ReadonlyField icon={Hash} label="NIF / Tax ID" value={correspondent.tax_id} />
          </dl>
        </CardContent>
      </Card>

      {/* Editable data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Datos de contacto
          </CardTitle>
          <CardDescription>Puedes actualizar tu direccion y datos de contacto</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-address">Direccion</Label>
              <Textarea
                id="profile-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Direccion completa del despacho"
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-email">Email de contacto</Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@despacho.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-phone">Telefono</Label>
              <Input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34 600 000 000"
              />
            </div>

            <div className="flex justify-end mt-2">
              <Button type="submit" loading={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function ReadonlyField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0" style={{ color: 'var(--g-text-secondary)' }} />
      <div>
        <dt className="text-xs" style={{ color: 'var(--g-text-secondary)' }}>
          {label}
        </dt>
        <dd className="text-sm font-medium" style={{ color: 'var(--g-text-primary)' }}>
          {value}
        </dd>
      </div>
    </div>
  )
}
