import { Button } from './button'
import { X } from 'lucide-react'

export interface DateRange {
  from: string | null
  to: string | null
}

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

export function DateRangeFilter({ value, onChange, className = '' }: DateRangeFilterProps) {
  const hasValue = value.from || value.to
  const isInvalid = value.from && value.to && value.to < value.from

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5">
        <label
          htmlFor="date-from"
          className="text-xs font-medium shrink-0"
          style={{ color: 'var(--g-text-secondary)' }}
        >
          Desde
        </label>
        <input
          id="date-from"
          type="date"
          value={value.from ?? ''}
          onChange={(e) => onChange({ ...value, from: e.target.value || null })}
          className="h-9 px-2 text-sm"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            border: `1px solid ${isInvalid ? 'var(--status-error)' : 'var(--g-border-default)'}`,
            borderRadius: 'var(--g-radius-sm)',
            color: 'var(--g-text-primary)',
          }}
          aria-label="Fecha desde"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <label
          htmlFor="date-to"
          className="text-xs font-medium shrink-0"
          style={{ color: 'var(--g-text-secondary)' }}
        >
          Hasta
        </label>
        <input
          id="date-to"
          type="date"
          value={value.to ?? ''}
          min={value.from ?? undefined}
          onChange={(e) => onChange({ ...value, to: e.target.value || null })}
          className="h-9 px-2 text-sm"
          style={{
            backgroundColor: 'var(--g-surface-card)',
            border: `1px solid ${isInvalid ? 'var(--status-error)' : 'var(--g-border-default)'}`,
            borderRadius: 'var(--g-radius-sm)',
            color: 'var(--g-text-primary)',
          }}
          aria-label="Fecha hasta"
        />
      </div>
      {hasValue && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange({ from: null, to: null })}
          aria-label="Limpiar rango de fechas"
          className="h-9 w-9 shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}

/** Filter an array by date range on a specific field */
export function filterByDateRange<T>(
  data: T[],
  dateRange: DateRange,
  accessor: (item: T) => string | null | undefined,
): T[] {
  if (!dateRange.from && !dateRange.to) return data
  return data.filter((item) => {
    const dateStr = accessor(item)
    if (!dateStr) return false
    const date = dateStr.slice(0, 10) // 'YYYY-MM-DD'
    if (dateRange.from && date < dateRange.from) return false
    if (dateRange.to && date > dateRange.to) return false
    return true
  })
}
