import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { CreditCard, FileText, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { isGInvoiceEnabled } from '@/lib/feature-flags'

type Workspace = 'liquida360' | 'ginvoice'

interface WorkspaceOption {
  id: Workspace
  label: string
  description: string
  icon: React.ElementType
  path: string
}

const WORKSPACES: WorkspaceOption[] = [
  {
    id: 'liquida360',
    label: 'Liquida360',
    description: 'Pagos corresponsales',
    icon: CreditCard,
    path: '/',
  },
  {
    id: 'ginvoice',
    label: 'G-Invoice',
    description: 'Facturación digital',
    icon: FileText,
    path: '/g-invoice',
  },
]

function getCurrentWorkspace(pathname: string): Workspace {
  if (pathname.startsWith('/g-invoice')) return 'ginvoice'
  return 'liquida360'
}

export function WorkspaceSwitcher() {
  const { role, ginvRole, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const currentWorkspace = getCurrentWorkspace(location.pathname)

  // Only show switcher if user has access to both workspaces
  const hasLiquida360 = !!role && role !== 'corresponsal'
  const hasGInvoice = !!ginvRole && isGInvoiceEnabled(user)
  const hasMultipleWorkspaces = hasLiquida360 && hasGInvoice

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const current = WORKSPACES.find((w) => w.id === currentWorkspace) ?? WORKSPACES[0]
  const CurrentIcon = current.icon

  // If user only has one workspace, show static label
  if (!hasMultipleWorkspaces) {
    return (
      <div className="flex items-center gap-2">
        <CurrentIcon
          className="h-5 w-5"
          style={{ color: 'var(--g-brand-3308)' }}
        />
        <div>
          <div
            className="text-sm font-semibold"
            style={{ color: 'var(--g-text-primary)' }}
          >
            {current.label}
          </div>
          <div
            className="text-xs"
            style={{ color: 'var(--g-text-secondary)' }}
          >
            {current.description}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 transition-colors"
        style={{
          borderRadius: 'var(--g-radius-md)',
          border: '1px solid var(--g-border-default)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--g-surface-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Cambiar espacio de trabajo"
      >
        <CurrentIcon
          className="h-5 w-5"
          style={{ color: 'var(--g-brand-3308)' }}
        />
        <div className="text-left">
          <div
            className="text-sm font-semibold"
            style={{ color: 'var(--g-text-primary)' }}
          >
            {current.label}
          </div>
          <div
            className="text-xs"
            style={{ color: 'var(--g-text-secondary)' }}
          >
            {current.description}
          </div>
        </div>
        <ChevronDown
          className="h-4 w-4 ml-1 transition-transform"
          style={{
            color: 'var(--g-text-secondary)',
            transform: open ? 'rotate(180deg)' : undefined,
          }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 w-64 py-1 z-50"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            border: '1px solid var(--g-border-default)',
            borderRadius: 'var(--g-radius-md)',
            boxShadow: 'var(--g-shadow-lg)',
          }}
          role="listbox"
          aria-label="Espacios de trabajo disponibles"
        >
          {WORKSPACES.map((workspace) => {
            const Icon = workspace.icon
            const isActive = workspace.id === currentWorkspace
            const hasAccess =
              (workspace.id === 'liquida360' && hasLiquida360) ||
              (workspace.id === 'ginvoice' && hasGInvoice)

            if (!hasAccess) return null

            return (
              <button
                key={workspace.id}
                onClick={() => {
                  navigate(workspace.path)
                  setOpen(false)
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-left transition-colors"
                style={{
                  backgroundColor: isActive ? 'var(--g-sec-50)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--g-surface-hover)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                }}
                role="option"
                aria-selected={isActive}
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  style={{ color: isActive ? 'var(--g-brand-3308)' : 'var(--g-text-secondary)' }}
                />
                <div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: 'var(--g-text-primary)' }}
                  >
                    {workspace.label}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: 'var(--g-text-secondary)' }}
                  >
                    {workspace.description}
                  </div>
                </div>
                {isActive && (
                  <div
                    className="ml-auto h-2 w-2 shrink-0"
                    style={{
                      backgroundColor: 'var(--g-brand-3308)',
                      borderRadius: 'var(--g-radius-full)',
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
