export interface CsvColumn<T> {
  header: string
  accessor: keyof T | ((row: T) => string | number | null | undefined)
}

/**
 * Generate a CSV string from data and column definitions.
 * Includes BOM for Excel compatibility with accented characters.
 */
export function generateCsv<T>(data: T[], columns: CsvColumn<T>[]): string {
  const BOM = '\uFEFF'
  const headers = columns.map((col) => escapeCell(col.header)).join(',')

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value =
          typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]
        return escapeCell(value != null ? String(value) : '')
      })
      .join(','),
  )

  return BOM + [headers, ...rows].join('\n')
}

/**
 * Download a CSV string as a file.
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate and download a CSV file in one step.
 */
export function exportTableToCsv<T>(
  data: T[],
  columns: CsvColumn<T>[],
  filename: string,
): void {
  const csv = generateCsv(data, columns)
  downloadCsv(csv, filename)
}

/**
 * Escape a CSV cell: wrap in double quotes if it contains comma, newline, or double quote.
 * Double quotes within the value are doubled.
 */
function escapeCell(value: string): string {
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Generate a filename with today's date.
 * Example: liquidaciones_2026-02-07.csv
 */
export function csvFilename(prefix: string): string {
  const today = new Date().toISOString().slice(0, 10)
  return `${prefix}_${today}.csv`
}
