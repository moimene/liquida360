import { useEffect, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { UserCircle, Save, MapPin, Building, Globe, Hash, Landmark, FileUp, FileText, AlertTriangle } from 'lucide-react'
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
  const [bankAccountHolder, setBankAccountHolder] = useState('')
  const [bankAccountIban, setBankAccountIban] = useState('')
  const [bankSwiftBic, setBankSwiftBic] = useState('')
  const [bankCertificateFile, setBankCertificateFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const bankFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.id) {
      fetchCorrespondent(user.id)
    }
  }, [user?.id, fetchCorrespondent])

  useEffect(() => {
    if (correspondent) {
      queueMicrotask(() => {
        setAddress(correspondent.address ?? '')
        setEmail(correspondent.email ?? '')
        setPhone(correspondent.phone ?? '')
        setBankAccountHolder(correspondent.bank_account_holder ?? '')
        setBankAccountIban(correspondent.bank_account_iban ?? '')
        setBankSwiftBic(correspondent.bank_swift_bic ?? '')
      })
    }
  }, [correspondent])

  const countryName = correspondent
    ? (COUNTRIES.find((c) => c.code === correspondent.country)?.name ?? correspondent.country)
    : ''

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!correspondent?.id) return

    const bankDataChanged =
      bankAccountHolder !== (correspondent.bank_account_holder ?? '') ||
      bankAccountIban !== (correspondent.bank_account_iban ?? '') ||
      bankSwiftBic !== (correspondent.bank_swift_bic ?? '')

    if (bankDataChanged && !bankCertificateFile) {
      toast.error('Debes adjuntar un nuevo certificado de titularidad para guardar cambios bancarios')
      return
    }

    setSaving(true)
    const { error } = await updateProfile(correspondent.id, {
      address,
      email: email || null,
      phone: phone || null,
      bank_account_holder: bankAccountHolder || null,
      bank_account_iban: bankAccountIban || null,
      bank_swift_bic: bankSwiftBic || null,
    }, bankCertificateFile ?? undefined)
    setSaving(false)

    if (error) {
      toast.error('Error al guardar', { description: error })
    } else {
      toast.success('Perfil actualizado correctamente')
      setBankCertificateFile(null)
      if (bankFileRef.current) {
        bankFileRef.current.value = ''
      }
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
            Datos de contacto y bancarios
          </CardTitle>
          <CardDescription>
            Puedes actualizar datos de contacto y cuenta bancaria.
          </CardDescription>
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

            <div
              className="my-2"
              style={{ borderTop: '1px solid var(--g-border-default)' }}
            />

            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4" style={{ color: 'var(--g-brand-3308)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--g-text-primary)' }}>
                Datos bancarios
              </p>
            </div>

            <div
              className="flex items-start gap-2 p-3 text-xs"
              style={{
                backgroundColor: 'var(--status-warning-bg)',
                color: 'var(--status-warning)',
                borderRadius: 'var(--g-radius-sm)',
              }}
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Si cambias los datos bancarios, debes adjuntar un nuevo certificado de titularidad.
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-bank-holder">Titular cuenta bancaria</Label>
              <Input
                id="profile-bank-holder"
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
                placeholder="Titular de la cuenta"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-bank-iban">Cuenta bancaria (IBAN)</Label>
                <Input
                  id="profile-bank-iban"
                  value={bankAccountIban}
                  onChange={(e) => setBankAccountIban(e.target.value)}
                  placeholder="ES12 3456 7890 1234 5678 9012"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-bank-swift">SWIFT / BIC</Label>
                <Input
                  id="profile-bank-swift"
                  value={bankSwiftBic}
                  onChange={(e) => setBankSwiftBic(e.target.value)}
                  placeholder="BBVAESMMXXX"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-bank-cert">Certificado titularidad bancaria (PDF)</Label>
              <label
                htmlFor="profile-bank-cert"
                className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors"
                style={{
                  border: '1px dashed var(--g-border-default)',
                  borderRadius: 'var(--g-radius-sm)',
                  color: 'var(--g-text-secondary)',
                }}
              >
                <FileUp className="h-4 w-4" />
                <span className="text-sm">
                  {bankCertificateFile ? bankCertificateFile.name : 'Seleccionar certificado...'}
                </span>
              </label>
              <input
                ref={bankFileRef}
                id="profile-bank-cert"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(event) => setBankCertificateFile(event.target.files?.[0] ?? null)}
              />

              {correspondent.bank_certificate_url && (
                <a
                  href={correspondent.bank_certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs"
                  style={{ color: 'var(--g-brand-3308)' }}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Ver certificado actual
                </a>
              )}
              {correspondent.bank_data_updated_at && (
                <span className="text-xs" style={{ color: 'var(--g-text-secondary)' }}>
                  Ultima actualizacion: {new Date(correspondent.bank_data_updated_at).toLocaleDateString('es-ES')}
                </span>
              )}
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
