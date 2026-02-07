import { type SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full px-3 text-sm appearance-none',
          'bg-[var(--g-surface-card)] text-[var(--g-text-primary)]',
          'border border-[var(--g-border-subtle)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors',
          error && 'border-[var(--status-error)]',
          className,
        )}
        style={{ borderRadius: 'var(--g-radius-md)' }}
        aria-invalid={error || undefined}
        {...props}
      >
        {children}
      </select>
    )
  },
)

Select.displayName = 'Select'
export { Select, type SelectProps }
