import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
type ButtonSize = 'sm' | 'default' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  default: 'text-[var(--g-text-inverse)] bg-[var(--g-brand-3308)] hover:bg-[var(--g-sec-700)]',
  secondary:
    'text-[var(--g-text-primary)] bg-[var(--g-sec-100)] hover:bg-[var(--g-surface-subtle)]',
  outline:
    'text-[var(--g-text-primary)] bg-transparent border border-[var(--g-border-subtle)] hover:bg-[var(--g-surface-subtle)]',
  ghost: 'text-[var(--g-text-primary)] bg-transparent hover:bg-[var(--g-surface-subtle)]',
  destructive: 'text-[var(--g-text-inverse)] bg-[var(--status-error)] hover:opacity-90',
  link: 'text-[var(--g-link)] bg-transparent underline-offset-4 hover:underline',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  default: 'h-10 px-4 text-sm',
  lg: 'h-11 px-8 text-sm',
  icon: 'h-10 w-10',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'default', size = 'default', loading, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all',
          'disabled:opacity-50 disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          loading && 'pointer-events-none',
          className,
        )}
        style={{ borderRadius: 'var(--g-radius-md)' }}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize }
