import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Pencil, Building2, FileCheck, Receipt, Mail, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCorrespondents } from '../hooks/use-correspondents'
import { CorrespondentForm } from './correspondent-form'
import { CorrespondentCertificatesTab } from '@/features/certificates'
import { CorrespondentLiquidationsTab } from '@/features/liquidations'
import { useAuth } from '@/features/auth'
import { supabase } from '@/lib/supabase'
import type { CorrespondentFormData } from '../schemas/correspondent-schema'
import { COUNTRIES } from '@/lib/countries'

type TabId = 'datos' | 'certificados' | 'pagos'

export function CorrespondentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { correspondents, loading, fetchCorrespondents, updateCorrespondent } = useCorrespondents()
  const [editOpen, setEditOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('datos')

  const role = useAuth((s) => s.role)
  const session = useAuth((s) => s.session)
  const [inviting, setInviting] = useState(false)
  const [approving, setApproving] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [showInviteInput, setShowInviteInput] = useState(false)

  const correspondent = useMemo(() => correspondents.find((c) => c.id === id), [correspondents, id])

  useEffect(() => {
    if (correspondents.length === 0) {
      fetchCorrespondents()
    }
  }, [correspondents.length, fetchCorrespondents])

  async function handleInvite() {
    if (!id || !inviteEmail || !session?.access_token) return
    setInviting(true)

    const { data, error } = await supabase.functions.invoke('invite-correspondent', {
      body: { correspondentId: id, email: inviteEmail },
    })

    setInviting(false)

    if (error || data?.error) {
      toast.error('Error al invitar', { description: data?.error ?? error?.message })
    } else {
      toast.success(`Invitacion enviada a ${inviteEmail}`)
      setShowInviteInput(false)
      setInviteEmail('')
      fetchCorrespondents()
    }
  }

  async function handleApprove() {
    if (!id || !session?.access_token) return
    setApproving(true)

    const { data, error } = await supabase.functions.invoke('approve-correspondent', {
      body: { correspondentId: id },
    })

    setApproving(false)

    if (error || data?.error) {
      toast.error('Error al aprobar', { description: data?.error ?? error?.message })
    } else {
      toast.success('Corresponsal aprobado correctamente')
      fetchCorrespondents()
    }
  }

  const countryName = useMemo(() => {
    const found = COUNTRIES.find((c) => c.code === correspondent?.country)
    return found?.name ?? correspondent?.country ?? ''
  }, [correspondent?.country])

  async function handleUpdate(data: CorrespondentFormData) {
    if (!id) return
    setSubmitting(true)
    const { error } = await updateCorrespondent(id, data)
    setSubmitting(false)

    if (error) {
      toast.error('Error al actualizar', { description: error })
    } else {
      toast.success('Corresponsal actualizado')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="skeleton h-8 w-64 rounded" />
        <div className="skeleton h-48 w-full rounded" />
      </div>
    )
  }

  if (!correspondent) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[40vh]">
        <p style={{ color: 'var(--g-text-secondary)' }}>Corresponsal no encontrado</p>
        <Button variant="outline" onClick={() => navigate('/correspondents')}>
          <ArrowLeft className="h-4 w-4" />
          Volver al listado
        </Button>
      </div>
    )
  }

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'datos', label: 'Datos', icon: Building2 },
    { id: 'certificados', label: 'Certificados', icon: FileCheck },
    { id: 'pagos', label: 'Histórico de pagos', icon: Receipt },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Back + Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/correspondents')}
            aria-label="Volver al listado"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2
                className="font-bold"
                style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
              >
                {correspondent.name}
              </h2>
              <Badge
                variant={
                  correspondent.status === 'active'
                    ? 'success'
                    : correspondent.status === 'pending_approval'
                      ? 'warning'
                      : 'secondary'
                }
              >
                {correspondent.status === 'active'
                  ? 'Activo'
                  : correspondent.status === 'pending_approval'
                    ? 'Pendiente'
                    : 'Inactivo'}
              </Badge>
              {correspondent.user_id && (
                <Badge variant="outline">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Portal activo
                </Badge>
              )}
            </div>
            <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
              {countryName} · {correspondent.tax_id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Approve button for pending_approval correspondents (admin only) */}
          {correspondent.status === 'pending_approval' && role === 'admin' && (
            <Button onClick={handleApprove} loading={approving}>
              <UserCheck className="h-4 w-4" />
              Aprobar
            </Button>
          )}

          {/* Invite to portal button (admin only, when no user linked) */}
          {!correspondent.user_id && correspondent.status === 'active' && role === 'admin' && (
            <>
              {showInviteInput ? (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                    className="px-3 py-1.5 text-sm border"
                    style={{
                      borderColor: 'var(--g-border-default)',
                      borderRadius: 'var(--g-radius-sm)',
                    }}
                  />
                  <Button size="sm" onClick={handleInvite} loading={inviting} disabled={!inviteEmail}>
                    Enviar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowInviteInput(false)
                      setInviteEmail('')
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setShowInviteInput(true)}>
                  <Mail className="h-4 w-4" />
                  Invitar al portal
                </Button>
              )}
            </>
          )}

          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-0"
        role="tablist"
        aria-label="Secciones del corresponsal"
        style={{ borderBottom: '2px solid var(--g-border-default)' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors -mb-[2px]"
              style={{
                color: isActive ? 'var(--g-brand-3308)' : 'var(--g-text-secondary)',
                borderBottom: isActive ? '2px solid var(--g-brand-3308)' : '2px solid transparent',
              }}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div role="tabpanel">
        {activeTab === 'datos' && (
          <DatosTab correspondent={correspondent} countryName={countryName} />
        )}
        {activeTab === 'certificados' && (
          <CorrespondentCertificatesTab
            correspondent={correspondent}
            allCorrespondents={correspondents}
          />
        )}
        {activeTab === 'pagos' && <CorrespondentLiquidationsTab correspondent={correspondent} />}
      </div>

      {/* Edit Form */}
      <CorrespondentForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleUpdate}
        correspondent={correspondent}
        loading={submitting}
      />
    </div>
  )
}

function DatosTab({
  correspondent,
  countryName,
}: {
  correspondent: {
    name: string
    country: string
    tax_id: string
    address: string
    email: string | null
    phone: string | null
    created_at: string
  }
  countryName: string
}) {
  const fields = [
    { label: 'Nombre', value: correspondent.name },
    { label: 'País de origen', value: countryName },
    { label: 'NIF / Tax ID', value: correspondent.tax_id },
    { label: 'Dirección fiscal', value: correspondent.address },
    { label: 'Email', value: correspondent.email ?? '—' },
    { label: 'Teléfono', value: correspondent.phone ?? '—' },
    {
      label: 'Fecha de alta',
      value: new Date(correspondent.created_at).toLocaleDateString('es-ES'),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos del corresponsal</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {fields.map((field) => (
            <div key={field.label}>
              <dt
                className="text-xs font-medium uppercase tracking-wider mb-1"
                style={{ color: 'var(--g-text-secondary)' }}
              >
                {field.label}
              </dt>
              <dd style={{ color: 'var(--g-text-primary)', fontSize: 'var(--g-text-body)' }}>
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
