import { useState, Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { ErrorBoundary } from '@/components/error-boundary'
import { SuspenseLoader } from '@/components/suspense-loader'
import { CommandPalette } from '@/components/ui/command-palette'

interface AppLayoutProps {
  title?: string
}

export function AppLayout({ title = 'Dashboard' }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Skip to content - WCAG AA */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        style={{
          backgroundColor: 'var(--g-brand-3308)',
          color: 'var(--g-text-inverse)',
          borderRadius: 'var(--g-radius-sm)',
        }}
      >
        Ir al contenido principal
      </a>

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-6"
          style={{ backgroundColor: 'var(--g-surface-page)' }}
          role="main"
          aria-label="Contenido principal"
        >
          <ErrorBoundary>
            <Suspense fallback={<SuspenseLoader />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette />
    </div>
  )
}
