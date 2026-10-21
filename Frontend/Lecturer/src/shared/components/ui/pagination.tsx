import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { SpringPage } from '@/shared/types'
import { getPageItems } from '@/shared/utils/pagination'
import { Button } from './button'

interface TablePaginationProps {
  data: SpringPage<unknown>
  /** Đang chờ trang mới → khóa nút để không bấm dồn */
  disabled: boolean
  onPageChange: (page: number) => void
  /** Đơn vị đếm ở dòng "Hiển thị 1–10 / 25 ...", ví dụ "sinh viên", "giáo viên" */
  itemLabel: string
}

/** Thanh phân trang dưới bảng cho `SpringPage` (trang 0-based, hiển thị cho người dùng thì +1) */
export function TablePagination({ data, disabled, onPageChange, itemLabel }: TablePaginationProps) {
  const from = data.number * data.size + 1
  const to = data.number * data.size + data.numberOfElements

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Hiển thị <span className="font-medium text-slate-900">{from}–{to}</span> /{' '}
        <span className="font-medium text-slate-900">{data.totalElements}</span> {itemLabel}
      </span>

      {data.totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Phân trang">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={data.first || disabled}
            onClick={() => onPageChange(data.number - 1)}
            aria-label="Trang trước"
          >
            <ChevronLeft />
          </Button>
          {getPageItems(data.number, data.totalPages).map((item, index) =>
            item === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-1.5 text-slate-400">
                …
              </span>
            ) : (
              <Button
                key={item}
                variant={item === data.number ? 'default' : 'ghost'}
                size="sm"
                className="h-8 min-w-8 px-2"
                disabled={disabled}
                onClick={() => onPageChange(item)}
                aria-current={item === data.number ? 'page' : undefined}
              >
                {item + 1}
              </Button>
            ),
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={data.last || disabled}
            onClick={() => onPageChange(data.number + 1)}
            aria-label="Trang sau"
          >
            <ChevronRight />
          </Button>
        </nav>
      )}
    </div>
  )
}
