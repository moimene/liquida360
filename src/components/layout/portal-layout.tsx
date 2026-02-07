import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { PortalHeader } from './portal-header'
import { ErrorBoundary } from '@/components/error-boundary'
import { SuspenseLoader } from '@/components/suspense-loader'

export function PortalLayout() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--g-surface-page)' }}>
      {/* Skip to content - WCAG AA */}
      <a
        href="#portal-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        style={{
          backgroundColor: 'var(--g-brand-3308)',
          color: 'var(--g-text-inverse)',
          borderRadius: 'var(--g-radius-sm)',
        }}
      >
        Ir al contenido principal
      </a>

      <PortalHeader />

      <main
        id="portal-content"
        className="mx-auto max-w-7xl px-4 sm:px-6 py-6"
        role="main"
        aria-label="Contenido del portal"
      >
        <ErrorBoundary>
          <Suspense fallback={<SuspenseLoader />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  )
}
