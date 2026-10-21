import { Pencil, Plus, SearchX, UserPlus } from 'lucide-react'
import type { SpringPage } from '@/shared/types'
import {
  Badge,
  Button,
  Skeleton,
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TablePagination,
  TableRow,
} from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import type { TeacherListItem, TeacherSort, TeacherSortField } from '../types'
import { formatAmount, teacherAmountInputId } from '../utils/teacherDisplay'
import { TeacherAmountInput } from './TeacherAmountInput'

const COLUMN_COUNT = 6

const SORTABLE_COLUMNS: { field: TeacherSortField; label: string; className?: string }[] = [
  { field: 'name', label: 'Họ và tên' },
  { field: 'organization', label: 'Đơn vị công tác', className: 'w-44' },
  { field: 'majorName', label: 'Ngành' },
  { field: 'amount', label: 'Hạn mức', className: 'w-32' },
]

interface TeacherTableProps {
  data: SpringPage<TeacherListItem> | undefined
  isPending: boolean
  isError: boolean
  /** Đang hiện dữ liệu trang cũ trong lúc chờ trang mới */
  isPlaceholderData: boolean
  pageSize: number
  sort: TeacherSort | undefined
  onSortChange: (sort: TeacherSort | undefined) => void
  onPageChange: (page: number) => void
  onRowClick: (teacher: TeacherListItem) => void
  /** Đang có bộ lọc → bảng rỗng nghĩa là "không tìm thấy", không phải "chưa có" */
  hasFilters: boolean
  onCreate: () => void
}

export function TeacherTable({
  data,
  isPending,
  isError,
  isPlaceholderData,
  pageSize,
  sort,
  onSortChange,
  onPageChange,
  onRowClick,
  hasFilters,
  onCreate,
}: TeacherTableProps) {
  const renderBody = () => {
    if (isPending) {
      return Array.from({ length: pageSize }, (_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          {Array.from({ length: COLUMN_COUNT }, (_, j) => (
            <TableCell key={j} className="py-3.5">
              <Skeleton className="h-5 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))
    }

    // Toast lỗi đã do interceptor hiện, ở đây chỉ báo trạng thái trong bảng
    if (isError || !data) {
      return (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={COLUMN_COUNT} className="py-12 text-center text-slate-500">
            Không tải được danh sách giáo viên.
          </TableCell>
        </TableRow>
      )
    }

    if (data.empty) {
      return (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={COLUMN_COUNT} className="py-14">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                {hasFilters ? (
                  <SearchX className="h-6 w-6 text-slate-400" />
                ) : (
                  <UserPlus className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <p className="text-sm font-medium text-slate-600">
                {hasFilters ? 'Không tìm thấy giáo viên phù hợp' : 'Chưa có giáo viên nào'}
              </p>
              {!hasFilters && (
                <Button size="sm" onClick={onCreate}>
                  <Plus /> Thêm thủ công
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
      )
    }

    return data.content.map((teacher, index) => (
      <TableRow
        key={teacher.publicId}
        tabIndex={0}
        onClick={() => onRowClick(teacher)}
        onKeyDown={(e) => {
          // Chỉ xử lý Enter trên chính dòng; Enter trên nút trong dòng để nút tự xử lý
          if (e.key === 'Enter' && e.target === e.currentTarget) onRowClick(teacher)
        }}
        aria-label={`Xem chi tiết giáo viên ${teacher.name}`}
        className="cursor-pointer hover:bg-slate-50 focus-visible:bg-blue-50/60 focus-visible:outline-none"
      >
        <TableCell className="py-3 text-slate-500">{data.number * data.size + index + 1}</TableCell>
        <TableCell className="py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-900">{teacher.name}</span>
            {!teacher.status && (
              <Badge variant="secondary" className="text-slate-600">
                Đã tắt
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="py-3">{teacher.organization}</TableCell>
        <TableCell className="py-3">{teacher.majorName ?? '—'}</TableCell>
        <TableCell className="py-2 tabular-nums">
          {/* BE không cho đổi hạn mức của giáo viên đã tắt (3012 – TEACHER_INACTIVE) → chỉ hiện số */}
          {teacher.status ? (
            // key theo hạn mức: danh sách tải lại với số mới → ô nhập lấy lại giá trị từ server
            <TeacherAmountInput key={`${teacher.publicId}:${teacher.amount}`} teacher={teacher} />
          ) : (
            formatAmount(teacher.amount)
          )}
        </TableCell>
        <TableCell className="py-3 text-right">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            // Nút chỉ có icon → aria-label để trình đọc màn hình (và test) vẫn biết tên nút
            aria-label="Thiết lập hạn mức"
            disabled={!teacher.status}
            title={teacher.status ? 'Thiết lập hạn mức' : 'Giáo viên đã tắt, không thể thiết lập hạn mức'}
            onClick={(e) => {
              // Không để click lan lên dòng → không mở popup chi tiết
              e.stopPropagation()
              // Đưa con trỏ vào ô hạn mức của dòng này để sửa
              const input = document.getElementById(teacherAmountInputId(teacher.publicId))
              if (input instanceof HTMLInputElement) {
                input.focus()
                input.select()
              }
            }}
          >
            <Pencil />
          </Button>
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">STT</TableHead>
              {SORTABLE_COLUMNS.map((column) => (
                <SortableTableHead
                  key={column.field}
                  label={column.label}
                  field={column.field}
                  sort={sort}
                  onSortChange={onSortChange}
                  className={column.className}
                />
              ))}
              <TableHead className="w-52 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderBody()}</TableBody>
        </Table>
      </div>

      {data && !data.empty && (
        <TablePagination
          data={data}
          disabled={isPlaceholderData}
          onPageChange={onPageChange}
          itemLabel="giáo viên"
        />
      )}
    </div>
  )
}
