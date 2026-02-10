import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGInvVendors } from '../hooks/use-ginv-vendors'
import { VendorForm } from './vendor-form-ginv'
import { COMPLIANCE_STATUS_CONFIG } from '../constants/ginvoice-utils'
import type { VendorFormData } from '../schemas/vendor-schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function VendorsPage() {
  const navigate = useNavigate()
  const { vendors, loading, fetchVendors, createVendor } = useGInvVendors()
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const filtered = useMemo(() => {
    if (!search) return vendors
    const q = search.toLowerCase()
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.tax_id.toLowerCase().includes(q) ||
        v.country.toLowerCase().includes(q),
    )
  }, [vendors, search])

  async function handleCreate(data: VendorFormData) {
    setSubmitting(true)
    const { error } = await createVendor(data)
    setSubmitting(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Proveedor creado correctamente')
    setFormOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
          >
            Proveedores
          </h1>
          <p style={{ color: 'var(--g-text-secondary)' }}>
            Catálogo de proveedores y estado de compliance
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--g-text-tertiary)' }} />
        <Input
          placeholder="Buscar por nombre, NIF o país..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div
        style={{
          backgroundColor: 'var(--g-surface-card)',
          borderRadius: 'var(--g-radius-lg)',
          border: '1px solid var(--g-border-default)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--g-brand-3308)' }} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--g-border-default)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Nombre</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>NIF/CIF</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>País</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--g-text-secondary)' }}>Compliance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8" style={{ color: 'var(--g-text-tertiary)' }}>
                    {search ? 'Sin resultados' : 'No hay proveedores registrados'}
                  </td>
                </tr>
              ) : (
                filtered.map((vendor) => {
                  const compliance = COMPLIANCE_STATUS_CONFIG[vendor.compliance_status] ?? COMPLIANCE_STATUS_CONFIG.non_compliant
                  return (
                    <tr
                      key={vendor.id}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: '1px solid var(--g-border-default)' }}
                      onClick={() => navigate(`/g-invoice/vendors/${vendor.id}`)}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--g-surface-hover)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--g-text-primary)' }}>
                        {vendor.name}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--g-text-secondary)' }}>
                        {vendor.tax_id}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--g-text-secondary)' }}>
                        {vendor.country}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex px-2 py-0.5 text-xs font-medium"
                          style={{
                            color: compliance.color,
                            backgroundColor: compliance.bg,
                            borderRadius: 'var(--g-radius-full)',
                          }}
                        >
                          {compliance.label}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      <VendorForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
        submitting={submitting}
      />
    </div>
  )
}
