import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          className="flex flex-col items-center justify-center gap-4 min-h-[50vh] p-8 text-center"
          role="alert"
        >
          <div
            className="flex h-16 w-16 items-center justify-center"
            style={{
              backgroundColor: 'var(--status-error-bg)',
              borderRadius: 'var(--g-radius-full)',
            }}
          >
            <AlertTriangle className="h-8 w-8" style={{ color: 'var(--status-error)' }} />
          </div>
          <div>
            <h2
              className="font-bold mb-2"
              style={{ fontSize: 'var(--g-text-h3)', color: 'var(--g-text-primary)' }}
            >
              Ha ocurrido un error
            </h2>
            <p
              className="max-w-md mb-1"
              style={{ color: 'var(--g-text-secondary)', fontSize: 'var(--g-text-body)' }}
            >
              Algo no ha ido bien. Intenta recargar la página.
            </p>
            {this.state.error && (
              <p
                className="text-xs font-mono max-w-md"
                style={{ color: 'var(--g-text-secondary)', opacity: 0.6 }}
              >
                {this.state.error.message}
              </p>
            )}
          </div>
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Recargar página
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
