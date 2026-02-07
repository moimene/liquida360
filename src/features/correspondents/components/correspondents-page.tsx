import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InfoPanel } from '@/components/ui/info-panel'
import { CORRESPONDENTS_HELP } from '../constants/help-texts'
import { useCorrespondents } from '../hooks/use-correspondents'
import { useAuth } from '@/features/auth'
import { supabase } from '@/lib/supabase'
import { CorrespondentsTable } from './correspondents-table'
import { CorrespondentForm } from './correspondent-form'
import type { CorrespondentFormData } from '../schemas/correspondent-schema'

export function CorrespondentsPage() {
  const { correspondents, loading, fetchCorrespondents, createCorrespondent } = useCorrespondents()
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const role = useAuth((s) => s.role)
  const session = useAuth((s) => s.session)

  const pendingCount = useMemo(
    () => correspondents.filter((c) => c.status === 'pending_approval').length,
    [correspondents],
  )

  useEffect(() => {
    fetchCorrespondents()
  }, [fetchCorrespondents])

  async function handleCreate(data: CorrespondentFormData) {
    setSubmitting(true)
    const { error } = await createCorrespondent(data)
    setSubmitting(false)

    if (error) {
      toast.error('Error al crear corresponsal', { description: error })
    } else {
      toast.success('Corresponsal creado correctamente')
    }
  }

  async function handleApprove(correspondentId: string) {
    if (!session?.access_token) return
    setApprovingId(correspondentId)

    const { data, error } = await supabase.functions.invoke('approve-correspondent', {
      body: { correspondentId },
    })

    setApprovingId(null)

    if (error || data?.error) {
      toast.error('Error al aprobar corresponsal', { description: data?.error ?? error?.message })
    } else {
      toast.success('Corresponsal aprobado correctamente')
      fetchCorrespondents()
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            Corresponsales
          </h2>
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Gestiona los corresponsales y sus datos fiscales
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo corresponsal
        </Button>
      </div>

      {/* Pending approvals alert */}
      {pendingCount > 0 && role === 'admin' && (
        <div
          className="flex items-center gap-3 p-4"
          style={{
            backgroundColor: 'hsl(45, 93%, 47%, 0.08)',
            borderRadius: 'var(--g-radius-md)',
            border: '1px solid hsl(45, 93%, 47%, 0.25)',
          }}
          role="alert"
        >
          <UserCheck className="h-5 w-5 shrink-0" style={{ color: 'hsl(45, 93%, 47%)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--g-text-primary)' }}>
            {pendingCount === 1
              ? 'Hay 1 corresponsal pendiente de aprobación.'
              : `Hay ${pendingCount} corresponsales pendientes de aprobación.`}
            {' '}Usa el botón &quot;Aprobar&quot; en la tabla o accede al detalle para revisar.
          </span>
        </div>
      )}

      <InfoPanel variant="info" dismissible dismissKey="correspondents-info">{CORRESPONDENTS_HELP.pageInfoPanel}</InfoPanel>

      {/* Table */}
      <CorrespondentsTable
        data={correspondents}
        loading={loading}
        role={role}
        onApprove={handleApprove}
        approvingId={approvingId}
      />

      {/* Create Form */}
      <CorrespondentForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
        loading={submitting}
      />
    </div>
  )
}
