import { useState } from 'react'
import { Info, Lightbulb, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InfoPanelProps {
  /** The informational content */
  children: React.ReactNode
  /** Panel variant */
  variant?: 'info' | 'tip' | 'warning'
  /** Icon to display. Defaults based on variant */
  icon?: React.ElementType
  /** Whether the panel can be dismissed */
  dismissible?: boolean
  /** Unique key for localStorage persistence of dismissal */
  dismissKey?: string
  /** Additional className */
  className?: string
}

const DISMISS_PREFIX = 'liquida360:dismiss:'

const variantConfig = {
  info: {
    icon: Info,
    backgroundColor: 'var(--g-surface-subtle)',
    borderColor: 'var(--status-info)',
    iconColor: 'var(--status-info)',
  },
  tip: {
    icon: Lightbulb,
    backgroundColor: 'var(--g-sec-100)',
    borderColor: 'var(--g-brand-3308)',
    iconColor: 'var(--g-brand-3308)',
  },
  warning: {
    icon: AlertTriangle,
    backgroundColor: 'var(--status-error-bg)',
    borderColor: 'var(--status-error)',
    iconColor: 'var(--status-error)',
  },
}

export function InfoPanel({
  children,
  variant = 'info',
  icon,
  dismissible = false,
  dismissKey,
  className = '',
}: InfoPanelProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (!dismissKey || typeof window === 'undefined') return false
    return localStorage.getItem(`${DISMISS_PREFIX}${dismissKey}`) === 'true'
  })

  if (dismissed) return null

  const config = variantConfig[variant]
  const IconComponent = icon ?? config.icon

  function handleDismiss() {
    setDismissed(true)
    if (dismissKey) {
      localStorage.setItem(`${DISMISS_PREFIX}${dismissKey}`, 'true')
    }
  }

  return (
    <div
      role="note"
      className={cn('flex gap-3', className)}
      style={{
        backgroundColor: config.backgroundColor,
        borderLeft: `4px solid ${config.borderColor}`,
        borderRadius: 'var(--g-radius-md)',
        padding: 'var(--g-space-4)',
      }}
    >
      <IconComponent
        className="mt-0.5 h-5 w-5 shrink-0"
        style={{ color: config.iconColor }}
        aria-hidden="true"
      />
      <div
        className="flex-1"
        style={{
          color: 'var(--g-text-secondary)',
          fontSize: 'var(--g-text-body)',
          lineHeight: '1.5',
        }}
      >
        {children}
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-full transition-colors"
          style={{ color: 'var(--g-text-secondary)', padding: 'var(--g-space-1)' }}
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
