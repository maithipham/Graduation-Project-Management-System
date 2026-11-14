import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { SortValue } from '@/shared/types'
import { cn } from '@/shared/utils/cn'
import { getNextSort } from '@/shared/utils/sort'
import { TableHead } from './table'

// Chỉ suy ra F từ `field`; suy từ union template literal của `sort` thì TS chọn sai một nhánh
interface SortableTableHeadProps<F extends string> {
  label: string
  field: F
  sort: NoInfer<SortValue<F>> | undefined
  onSortChange: (sort: NoInfer<SortValue<F>> | undefined) => void
  className?: string
}

/** Tiêu đề cột bấm được để sắp xếp: tăng dần → giảm dần → bỏ sắp xếp */
export function SortableTableHead<F extends string>({
  label,
  field,
  sort,
  onSortChange,
  className,
}: SortableTableHeadProps<F>) {
  const direction =
    sort === `${field},asc` ? 'asc' : sort === `${field},desc` ? 'desc' : undefined
  const Icon = direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ArrowUpDown

  return (
    <TableHead
      className={className}
      aria-sort={
        direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'
      }
    >
      <button
        type="button"
        onClick={() => onSortChange(getNextSort(sort, field))}
        className={cn(
          '-ml-2 inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-slate-100',
          direction && 'text-blue-700',
        )}
      >
        {label}
        <Icon className={cn('h-3.5 w-3.5', direction ? 'text-blue-600' : 'text-slate-400')} />
      </button>
    </TableHead>
  )
}
