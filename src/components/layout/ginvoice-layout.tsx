import { useState, Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { GInvoiceSidebar } from './ginvoice-sidebar'
import { GInvoiceHeader } from './ginvoice-header'
import { ErrorBoundary } from '@/components/error-boundary'
import { SuspenseLoader } from '@/components/suspense-loader'
import { CommandPalette } from '@/components/ui/command-palette'

export function GInvoiceLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Skip to content - WCAG AA */}
      <a
        href="#ginvoice-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        style={{
          backgroundColor: 'var(--g-brand-3308)',
          color: 'var(--g-text-inverse)',
          borderRadius: 'var(--g-radius-sm)',
        }}
      >
        Ir al contenido principal
      </a>

      <GInvoiceSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <GInvoiceHeader />
        <main
          id="ginvoice-content"
          className="flex-1 overflow-y-auto p-6"
          style={{ backgroundColor: 'var(--g-surface-page)' }}
          role="main"
          aria-label="Contenido G-Invoice"
        >
          <ErrorBoundary>
            <Suspense fallback={<SuspenseLoader />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      <CommandPalette />
    </div>
  )
}
