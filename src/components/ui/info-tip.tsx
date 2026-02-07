import { useState, useEffect, useRef, useId } from 'react'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InfoTipProps {
  /** The help text to display */
  content: string
  /** Icon to use. Defaults to HelpCircle */
  icon?: React.ElementType
  /** Position of the tooltip relative to icon */
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** Additional className for the wrapper */
  className?: string
}

export function InfoTip({
  content,
  icon: Icon = HelpCircle,
  side = 'top',
  className = '',
}: InfoTipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const tooltipId = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const positionStyles: Record<string, React.CSSProperties> = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 'var(--g-space-2)' },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 'var(--g-space-2)' },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 'var(--g-space-2)' },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 'var(--g-space-2)' },
  }

  return (
    <div ref={wrapperRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        aria-describedby={isOpen ? tooltipId : undefined}
        className="inline-flex items-center justify-center rounded-full transition-colors"
        style={{
          color: 'var(--status-info)',
          minWidth: '24px',
          minHeight: '24px',
        }}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Ayuda</span>
      </button>

      {isOpen && (
        <div
          id={tooltipId}
          role="tooltip"
          className="animate-tooltip-enter pointer-events-none absolute z-50"
          style={{
            ...positionStyles[side],
            backgroundColor: 'var(--g-surface-card)',
            border: '1px solid var(--g-border-subtle)',
            borderRadius: 'var(--g-radius-md)',
            boxShadow: 'var(--g-shadow-dropdown)',
            color: 'var(--g-text-secondary)',
            fontSize: 'var(--g-text-small)',
            lineHeight: '1.5',
            padding: 'var(--g-space-3)',
            maxWidth: '280px',
            minWidth: '180px',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}
