import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--g-brand-3308)] text-[var(--g-text-inverse)]',
  secondary: 'bg-[var(--g-sec-100)] text-[var(--g-text-primary)]',
  destructive: 'bg-[var(--status-error)] text-[var(--g-text-inverse)]',
  outline: 'bg-transparent text-[var(--g-text-primary)] border border-[var(--g-border-default)]',
  success: 'bg-[var(--status-success)] text-[var(--g-text-inverse)]',
  warning: 'bg-[var(--status-warning)] text-[var(--g-text-inverse)]',
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        variantStyles[variant],
        className,
      )}
      style={{ borderRadius: 'var(--g-radius-full)' }}
      {...props}
    />
  )
}

export { Badge, type BadgeProps, type BadgeVariant }
