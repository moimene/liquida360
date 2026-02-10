import { useAuth } from '@/features/auth'

export function GInvoiceDashboardPage() {
  const { ginvRole } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="font-bold"
          style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
        >
          G-Invoice Dashboard
        </h1>
        <p style={{ color: 'var(--g-text-secondary)' }}>
          Facturación digital — Vista general
        </p>
      </div>

      <div
        className="p-6"
        style={{
          backgroundColor: 'var(--g-surface-card)',
          borderRadius: 'var(--g-radius-lg)',
          border: '1px solid var(--g-border-default)',
        }}
      >
        <p style={{ color: 'var(--g-text-secondary)' }}>
          Rol actual: <strong style={{ color: 'var(--g-text-primary)' }}>{ginvRole ?? 'Sin rol'}</strong>
        </p>
        <p className="mt-2" style={{ color: 'var(--g-text-tertiary)' }}>
          Los módulos de ingesta, contabilización, facturación y entregas se implementarán en sprints posteriores.
        </p>
      </div>
    </div>
  )
}
