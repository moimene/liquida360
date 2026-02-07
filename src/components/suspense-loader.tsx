import { Loader2 } from 'lucide-react'

export function SuspenseLoader() {
  return (
    <div
      className="flex items-center justify-center min-h-[40vh]"
      role="status"
      aria-label="Cargando"
    >
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--g-brand-3308)' }} />
    </div>
  )
}
