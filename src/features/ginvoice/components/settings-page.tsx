export function GInvoiceSettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1
          className="font-bold"
          style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
        >
          Configuración G-Invoice
        </h1>
        <p style={{ color: 'var(--g-text-secondary)' }}>
          Ajustes del dominio (feature flag, catálogos, SLAs). Próxima iteración.
        </p>
      </div>

      <div
        className="p-6 space-y-3"
        style={{
          backgroundColor: 'var(--g-surface-card)',
          borderRadius: 'var(--g-radius-lg)',
          border: '1px solid var(--g-border-default)',
        }}
      >
        <p style={{ color: 'var(--g-text-primary)', fontWeight: 600 }}>Estado del feature flag</p>
        <p style={{ color: 'var(--g-text-secondary)' }}>
          Se controla con la variable <code>VITE_GINVOICE_ENABLED</code> y el campo
          <code> app_metadata.ginv_enabled </code> del usuario. Si alguno está activo,
          el dominio se muestra.
        </p>
      </div>
    </div>
  )
}
