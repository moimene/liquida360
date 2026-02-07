import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full px-3 text-sm',
        'bg-[var(--g-surface-card)] text-[var(--g-text-primary)]',
        'border border-[var(--g-border-subtle)]',
        'placeholder:text-[var(--g-text-secondary)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors',
        error && 'border-[var(--status-error)]',
        className,
      )}
      style={{ borderRadius: 'var(--g-radius-md)' }}
      aria-invalid={error || undefined}
      {...props}
    />
  )
})

Input.displayName = 'Input'
export { Input, type InputProps }
