export interface XlsxColumn<T> {
  header: string
  accessor: keyof T | ((row: T) => string | number | boolean | null | undefined)
}

/**
 * Generate and download an XLSX file.
 * Uses dynamic import to avoid loading the library until needed.
 */
export async function exportTableToXlsx<T>(
  data: T[],
  columns: XlsxColumn<T>[],
  filename: string,
  sheetName: string = 'Datos',
): Promise<void> {
  const XLSX = await import('xlsx')

  const rows = data.map((row) => {
    const output: Record<string, string | number | boolean> = {}
    columns.forEach((column) => {
      const value =
        typeof column.accessor === 'function'
          ? column.accessor(row)
          : (row[column.accessor] as string | number | boolean | null | undefined)
      output[column.header] = value ?? ''
    })
    return output
  })

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: columns.map((column) => column.header),
  })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, filename)
}

export function xlsxFilename(prefix: string): string {
  const today = new Date().toISOString().slice(0, 10)
  return `${prefix}_${today}.xlsx`
}

