import { Button } from './button'
import { Input } from './input'
import { Select } from './select'
import { DateRangeFilter, type DateRange } from './date-range-filter'
import { Search, Download } from 'lucide-react'

interface StatusOption {
  value: string
  label: string
}

interface TableToolbarProps {
  /** Search */
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string

  /** Status filter (optional) */
  statusOptions?: StatusOption[]
  statusValue?: string
  onStatusChange?: (value: string) => void

  /** Date range (optional) */
  dateRange?: DateRange
  onDateRangeChange?: (range: DateRange) => void

  /** Export */
  onExport?: () => void
  exportLabel?: string

  /** Record count */
  totalRecords: number
  recordLabel?: string

  className?: string
}

export function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  statusOptions,
  statusValue,
  onStatusChange,
  dateRange,
  onDateRangeChange,
  onExport,
  exportLabel = 'Exportar CSV',
  totalRecords,
  recordLabel = 'registros',
  className = '',
}: TableToolbarProps) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: 'var(--g-text-secondary)' }}
          />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
            aria-label={searchPlaceholder}
          />
        </div>

        {/* Status filter */}
        {statusOptions && onStatusChange && (
          <Select
            value={statusValue ?? 'all'}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-48"
            aria-label="Filtrar por estado"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        )}

        {/* Date range filter */}
        {dateRange && onDateRangeChange && (
          <DateRangeFilter value={dateRange} onChange={onDateRangeChange} />
        )}

        {/* Export button */}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport} className="shrink-0">
            <Download className="h-4 w-4 mr-1.5" />
            {exportLabel}
          </Button>
        )}
      </div>

      {/* Record count */}
      <div className="flex items-center">
        <span className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
          {totalRecords} {recordLabel}
        </span>
      </div>
    </div>
  )
}
