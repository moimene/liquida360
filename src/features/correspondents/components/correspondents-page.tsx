import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InfoPanel } from '@/components/ui/info-panel'
import { CORRESPONDENTS_HELP } from '../constants/help-texts'
import { useCorrespondents } from '../hooks/use-correspondents'
import { CorrespondentsTable } from './correspondents-table'
import { CorrespondentForm } from './correspondent-form'
import type { CorrespondentFormData } from '../schemas/correspondent-schema'

export function CorrespondentsPage() {
  const { correspondents, loading, fetchCorrespondents, createCorrespondent } = useCorrespondents()
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

      <InfoPanel variant="info" dismissible dismissKey="correspondents-info">{CORRESPONDENTS_HELP.pageInfoPanel}</InfoPanel>

      {/* Table */}
      <CorrespondentsTable data={correspondents} loading={loading} />

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
