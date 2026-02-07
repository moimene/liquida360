import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1.5" style={{ fontSize: 'var(--g-text-small)' }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight
                  className="h-3 w-3 shrink-0"
                  style={{ color: 'var(--g-text-secondary)' }}
                  aria-hidden
                />
              )}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className="font-medium truncate max-w-[200px]"
                  style={{
                    color: isLast ? 'var(--g-text-primary)' : 'var(--g-text-secondary)',
                  }}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="transition-colors hover:underline"
                  style={{ color: 'var(--g-brand-3308)' }}
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
