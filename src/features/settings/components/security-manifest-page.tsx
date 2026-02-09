import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { SecurityManifestTab } from './security-manifest-tab'

export function SecurityManifestPage() {
  const user = useAuth((s) => s.user)

  // When accessed without authentication (public route), show standalone layout
  if (!user) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: 'var(--g-surface-page)' }}
      >
        {/* Public header */}
        <header
          className="sticky top-0 z-10"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            borderBottom: '1px solid var(--g-border-default)',
          }}
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center font-bold text-sm"
                style={{
                  backgroundColor: 'var(--g-brand-3308)',
                  color: 'white',
                  borderRadius: 'var(--g-radius-sm)',
                }}
              >
                L3
              </div>
              <div>
                <span
                  className="font-bold text-sm"
                  style={{ color: 'var(--g-text-primary)' }}
                >
                  LIQUIDA360
                </span>
                <span
                  className="ml-2 text-xs"
                  style={{ color: 'var(--g-text-secondary)' }}
                >
                  Manifiesto de Seguridad
                </span>
              </div>
            </div>
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
              style={{
                color: 'var(--g-brand-3308)',
                borderRadius: 'var(--g-radius-md)',
                border: '1px solid var(--g-border-default)',
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al login
            </Link>
          </div>
        </header>

        {/* Manifest content */}
        <main className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col gap-6 animate-fade-in">
            <SecurityManifestTab />
          </div>
        </main>
      </div>
    )
  }

  // When accessed inside the app (authenticated), render normally
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <SecurityManifestTab />
    </div>
  )
}
