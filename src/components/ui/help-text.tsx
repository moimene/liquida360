import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HelpTextProps {
  /** The help text content */
  children: React.ReactNode
  /** Show an info icon before the text */
  icon?: boolean
  /** HTML id for aria-describedby linking */
  id?: string
  /** Additional className */
  className?: string
}

export function HelpText({ children, icon = false, id, className = '' }: HelpTextProps) {
  return (
    <p
      id={id}
      className={cn('flex items-start gap-1', className)}
      style={{
        color: 'var(--g-text-secondary)',
        fontSize: 'var(--g-text-small)',
        marginTop: 'var(--g-space-1)',
        lineHeight: '1.5',
      }}
    >
      {icon && (
        <Info
          className="mt-0.5 h-3 w-3 shrink-0"
          style={{ color: 'var(--status-info)' }}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </p>
  )
}
