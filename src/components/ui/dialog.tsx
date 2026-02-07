import { type ReactNode, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title: string
  description?: string
}

export function Dialog({ open, onClose, children, title, description }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    function handleCancel(e: Event) {
      e.preventDefault()
      onClose()
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'fixed inset-0 z-50 m-auto p-0',
        'w-full max-w-lg',
        'backdrop:bg-black/50',
        'animate-scale-in',
      )}
      style={{
        backgroundColor: 'var(--g-surface-card)',
        borderRadius: 'var(--g-radius-lg)',
        border: '1px solid var(--g-border-default)',
        boxShadow: 'var(--g-shadow-modal)',
      }}
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-description' : undefined}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--g-border-default)' }}
      >
        <div>
          <h2
            id="dialog-title"
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h4)', color: 'var(--g-text-primary)' }}
          >
            {title}
          </h2>
          {description && (
            <p
              id="dialog-description"
              className="mt-1"
              style={{ fontSize: 'var(--g-text-small)', color: 'var(--g-text-secondary)' }}
            >
              {description}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-6 py-4">{children}</div>
    </dialog>
  )
}

interface DialogFooterProps {
  children: ReactNode
  className?: string
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div
      className={cn('flex items-center justify-end gap-3 px-6 py-4', className)}
      style={{ borderTop: '1px solid var(--g-border-default)' }}
    >
      {children}
    </div>
  )
}
