import { type TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex w-full px-3 py-2 text-sm min-h-[80px]',
          'bg-[var(--g-surface-card)] text-[var(--g-text-primary)]',
          'border border-[var(--g-border-subtle)]',
          'placeholder:text-[var(--g-text-secondary)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors resize-y',
          error && 'border-[var(--status-error)]',
          className,
        )}
        style={{ borderRadius: 'var(--g-radius-md)' }}
        aria-invalid={error || undefined}
        {...props}
      />
    )
  },
)

Textarea.displayName = 'Textarea'
export { Textarea, type TextareaProps }
