import { ArrowUpDown } from 'lucide-react'

interface SortButtonProps {
  column: {
    toggleSorting: (desc?: boolean) => void
    getIsSorted: () => false | 'asc' | 'desc'
  }
  children: React.ReactNode
}

export function SortButton({ column, children }: SortButtonProps) {
  return (
    <button
      className="flex items-center gap-1 font-medium"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      type="button"
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  )
}
