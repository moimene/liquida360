import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, Receipt, FileCheck, CreditCard, X } from 'lucide-react'
import { Badge } from './badge'
import { useLiquidations } from '@/features/liquidations/hooks/use-liquidations'
import { useCertificates } from '@/features/certificates/hooks/use-certificates'
import { useCorrespondents } from '@/features/correspondents/hooks/use-correspondents'
import { usePaymentRequests } from '@/features/payments/hooks/use-payment-requests'
import { buildSearchIndex, searchEntities, type SearchableEntity } from '@/lib/search-index'

const TYPE_CONFIG: Record<
  SearchableEntity['type'],
  { label: string; icon: React.ElementType; badgeVariant: 'default' | 'secondary' | 'outline' }
> = {
  correspondent: { label: 'Corresponsal', icon: Users, badgeVariant: 'secondary' },
  liquidation: { label: 'Liquidación', icon: Receipt, badgeVariant: 'default' },
  certificate: { label: 'Certificado', icon: FileCheck, badgeVariant: 'outline' },
  payment: { label: 'Pago', icon: CreditCard, badgeVariant: 'secondary' },
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { correspondents } = useCorrespondents()
  const { liquidations } = useLiquidations()
  const { certificates } = useCertificates()
  const { requests } = usePaymentRequests()

  const searchIndex = useMemo(
    () =>
      buildSearchIndex(
        correspondents as never[],
        liquidations as never[],
        certificates as never[],
        requests as never[],
      ),
    [correspondents, liquidations, certificates, requests],
  )

  const results = useMemo(() => searchEntities(searchIndex, query), [searchIndex, query])

  // Global keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const activeItem = list.children[activeIndex] as HTMLElement | undefined
    activeItem?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const navigateToResult = useCallback(
    (result: SearchableEntity) => {
      close()
      navigate(result.href)
    },
    [close, navigate],
  )

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      close()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % Math.max(results.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 + results.length) % Math.max(results.length, 1))
    } else if (e.key === 'Enter' && results[activeIndex]) {
      navigateToResult(results[activeIndex])
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Buscar en LIQUIDA360"
    >
      <div
        className="w-full max-w-lg flex flex-col overflow-hidden animate-fade-in"
        style={{
          backgroundColor: 'var(--g-surface-card)',
          borderRadius: 'var(--g-radius-lg)',
          boxShadow: 'var(--g-shadow-modal)',
          border: '1px solid var(--g-border-default)',
          maxHeight: '60vh',
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4"
          style={{ borderBottom: '1px solid var(--g-border-default)' }}
        >
          <Search className="h-5 w-5 shrink-0" style={{ color: 'var(--g-text-secondary)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar corresponsales, liquidaciones, certificados..."
            className="flex-1 h-12 text-sm bg-transparent outline-none"
            style={{ color: 'var(--g-text-primary)' }}
            aria-label="Buscar"
            autoComplete="off"
          />
          <button onClick={close} className="shrink-0 p-1" aria-label="Cerrar">
            <X className="h-4 w-4" style={{ color: 'var(--g-text-secondary)' }} />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto py-2" role="listbox">
          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                No se encontraron resultados para &quot;{query}&quot;
              </p>
            </div>
          )}
          {!query && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                Escribe para buscar en todo el sistema
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: 'var(--g-text-secondary)', opacity: 0.6 }}
              >
                ↑↓ para navegar · Enter para abrir · Esc para cerrar
              </p>
            </div>
          )}
          {results.map((result, index) => {
            const config = TYPE_CONFIG[result.type]
            const Icon = config.icon
            const isActive = index === activeIndex
            return (
              <button
                key={`${result.type}-${result.id}`}
                type="button"
                role="option"
                aria-selected={isActive}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors"
                style={{
                  backgroundColor: isActive ? 'var(--g-surface-muted)' : 'transparent',
                }}
                onClick={() => navigateToResult(result)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <Icon className="h-4 w-4 shrink-0" style={{ color: 'var(--g-text-secondary)' }} />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--g-text-primary)' }}
                  >
                    {result.title}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--g-text-secondary)' }}>
                    {result.subtitle}
                  </p>
                </div>
                <Badge variant={config.badgeVariant} className="shrink-0">
                  {config.label}
                </Badge>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{
            borderTop: '1px solid var(--g-border-default)',
            fontSize: 'var(--g-text-small)',
            color: 'var(--g-text-secondary)',
          }}
        >
          <span>
            <kbd
              className="px-1.5 py-0.5 font-mono text-xs"
              style={{
                backgroundColor: 'var(--g-surface-muted)',
                borderRadius: 'var(--g-radius-sm)',
                border: '1px solid var(--g-border-default)',
              }}
            >
              ⌘K
            </kbd>{' '}
            para abrir
          </span>
          {results.length > 0 && <span>{results.length} resultados</span>}
        </div>
      </div>
    </div>
  )
}
