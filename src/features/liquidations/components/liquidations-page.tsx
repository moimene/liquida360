import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLiquidations } from '../hooks/use-liquidations'
import { useLiquidationsRealtime } from '../hooks/use-liquidations-realtime'
import { useCorrespondents } from '@/features/correspondents'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { LiquidationsTable } from './liquidations-table'
import { LiquidationWizard } from './liquidation-wizard'
import type { LiquidationFormData } from '../schemas/liquidation-schema'

export function LiquidationsPage() {
  const { liquidations, loading, fetchLiquidations, createLiquidation } = useLiquidations()
  const { correspondents, fetchCorrespondents } = useCorrespondents()
  const user = useAuth((s) => s.user)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Realtime subscription for live updates
  useLiquidationsRealtime()

  useEffect(() => {
    fetchLiquidations()
    fetchCorrespondents()
  }, [fetchLiquidations, fetchCorrespondents])

  async function handleCreate(data: LiquidationFormData, certificateId?: string) {
    if (!user) return
    setSubmitting(true)
    const { error } = await createLiquidation(data, user.id, certificateId)
    setSubmitting(false)

    if (error) {
      toast.error('Error al crear liquidación', { description: error })
    } else {
      toast.success('Liquidación creada correctamente')
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
            Liquidaciones
          </h2>
          <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
            Gestiona las liquidaciones de pago a corresponsales
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva liquidación
        </Button>
      </div>

      {/* Table */}
      <LiquidationsTable data={liquidations} loading={loading} />

      {/* Wizard */}
      <LiquidationWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSubmit={handleCreate}
        correspondents={correspondents}
        loading={submitting}
      />
    </div>
  )
}
