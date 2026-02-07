import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: LucideIcon
}

export function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-6">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center mb-4"
            style={{
              backgroundColor: 'var(--g-sec-100)',
              borderRadius: 'var(--g-radius-full)',
            }}
          >
            <Icon className="h-6 w-6" style={{ color: 'var(--g-brand-3308)' }} />
          </div>
          <h2
            className="font-bold"
            style={{ fontSize: 'var(--g-text-h3)', color: 'var(--g-text-primary)' }}
          >
            {title}
          </h2>
          <p
            className="mt-2"
            style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-body)' }}
          >
            {description}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
