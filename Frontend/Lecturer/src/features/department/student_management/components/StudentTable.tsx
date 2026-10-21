import { Plus, Users } from 'lucide-react'
import type { SpringPage } from '@/shared/types'
import {
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
import type { StudentListItem, StudentSort, StudentSortField } from '../types'
import { StudentStatusBadge } from './StudentStatusBadge'

const COLUMN_COUNT = 6

const SORTABLE_COLUMNS: { field: StudentSortField; label: string; className?: string }[] = [
  { field: 'studentCode', label: 'Mã SV', className: 'w-36' },
  { field: 'name', label: 'Họ và tên' },
  { field: 'majorName', label: 'Ngành' },
  { field: 'className', label: 'Lớp', className: 'w-32' },
]

interface StudentTableProps {
  data: SpringPage<StudentListItem> | undefined
  isPending: boolean
  isError: boolean
  /** Đang hiện dữ liệu trang cũ trong lúc chờ trang mới */
  isPlaceholderData: boolean
  pageSize: number
  sort: StudentSort | undefined
  onSortChange: (sort: StudentSort | undefined) => void
  onPageChange: (page: number) => void
  onRowClick: (student: StudentListItem) => void
  hasFilters: boolean
  onCreate: () => void
}

export function StudentTable({
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
}: StudentTableProps) {
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
            Không tải được danh sách sinh viên.
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
                <Users className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                {hasFilters ? 'Không tìm thấy sinh viên phù hợp' : 'Chưa có sinh viên nào'}
              </p>
              <Button size="sm" onClick={onCreate}>
                <Plus /> Thêm sinh viên
              </Button>
            </div>
          </TableCell>
        </TableRow>
      )
    }

    return data.content.map((student, index) => (
      <TableRow
        key={student.publicId}
        tabIndex={0}
        onClick={() => onRowClick(student)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onRowClick(student)
        }}
        aria-label={`Xem chi tiết sinh viên ${student.name}`}
        className="cursor-pointer hover:bg-slate-50 focus-visible:bg-blue-50/60 focus-visible:outline-none"
      >
        <TableCell className="py-3 text-slate-500">{data.number * data.size + index + 1}</TableCell>
        <TableCell className="py-3 font-medium tabular-nums">{student.studentCode}</TableCell>
        <TableCell className="py-3 font-medium text-slate-900">{student.name}</TableCell>
        <TableCell className="py-3">{student.majorName ?? '—'}</TableCell>
        <TableCell className="py-3">{student.className}</TableCell>
        <TableCell className="py-3">
          <StudentStatusBadge active={student.status} />
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
              <TableHead className="w-44">Trạng thái</TableHead>
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
          itemLabel="sinh viên"
        />
      )}
    </div>
  )
}
