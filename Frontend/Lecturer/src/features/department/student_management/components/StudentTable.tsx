import { Eye, Lock, Plus, Trash2, Users } from 'lucide-react'
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
import { canDeleteStudent } from '../utils/studentTable'
import { StudentStatusBadge } from './StudentStatusBadge'

const COLUMN_COUNT = 8

// Kiểu chữ tiêu đề cột theo mockup: chữ nhỏ, in hoa, giãn chữ, không xuống dòng.
// Cột sắp xếp được: chữ nằm trong <button> nên phải in hoa cả button;
// icon mũi tên chỉ hiện khi đang sắp xếp theo cột đó hoặc rê chuột vào
const HEAD_CLASS =
  'h-12 px-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap text-slate-700 [&_button]:uppercase [&_button]:tracking-wider [&_svg.text-slate-400]:opacity-0 [&:hover_svg]:opacity-100'

// Nút thao tác từng dòng theo đặc tả: 28px, bo 8px, icon 14px
const ROW_ACTION_CLASS = 'h-7 w-7 rounded-lg text-slate-500 [&_svg]:size-3.5'

const SORTABLE_COLUMNS: { field: StudentSortField; label: string; className?: string }[] = [
  { field: 'name', label: 'Họ và tên', className: 'min-w-56' },
  { field: 'className', label: 'Lớp / Khóa' },
  { field: 'majorName', label: 'Bộ môn' },
]

// Màu avatar chữ cái đầu, chọn theo MSSV để mỗi sinh viên luôn cùng một màu
const AVATAR_COLORS = [
  'from-cyan-500 to-sky-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
]

/** "Phạm Thanh Thảo" → "PT" (chữ đầu của họ + chữ đầu của tên) */
function getInitials(name: string) {
  const words = name.trim().split(/\s+/)
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

function getAvatarColor(studentCode: string) {
  const sum = [...studentCode].reduce((total, char) => total + char.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

interface StudentTableProps {
  data: SpringPage<StudentListItem> | undefined
  isPending: boolean
  isError: boolean
  /** Đang hiện dữ liệu trang cũ trong lúc chờ trang mới */
  isPlaceholderData: boolean
  pageSize: number
  pageSizeOptions: readonly number[]
  sort: StudentSort | undefined
  onSortChange: (sort: StudentSort | undefined) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRowClick: (student: StudentListItem) => void
  /** Câu hiện khi không có dòng nào (trang tự chọn theo bộ lọc / học kì) */
  emptyMessage: string
  /** Không truyền → ẩn nút "Thêm sinh viên" ở trạng thái rỗng (ví dụ học kì đã kết thúc) */
  onCreate?: () => void
  /** Không truyền → ẩn nút Xóa ở mọi dòng (ví dụ học kì đã kết thúc) */
  onDelete?: (student: StudentListItem) => void
}

export function StudentTable({
  data,
  isPending,
  isError,
  isPlaceholderData,
  pageSize,
  pageSizeOptions,
  sort,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  emptyMessage,
  onCreate,
  onDelete,
}: StudentTableProps) {
  const renderBody = () => {
    if (isPending) {
      return Array.from({ length: pageSize }, (_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          {Array.from({ length: COLUMN_COUNT }, (_, j) => (
            <TableCell key={j} className="px-4 py-3.5">
              <Skeleton className="h-5 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))
    }

    // Toast lỗi đã do interceptor hiện, ở đây chỉ báo trạng thái trong bảng
    if (isError) {
      return (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={COLUMN_COUNT} className="py-12 text-center text-slate-500">
            Không tải được danh sách sinh viên.
          </TableCell>
        </TableRow>
      )
    }

    // Không có data mà không lỗi = query chưa chạy (chưa có học kì) → coi như rỗng
    if (!data || data.empty) {
      return (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={COLUMN_COUNT} className="py-14">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Users className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">{emptyMessage}</p>
              {onCreate && (
                <Button size="sm" onClick={onCreate}>
                  <Plus /> Thêm sinh viên
                </Button>
              )}
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
        className="cursor-pointer hover:bg-blue-50/40 focus-visible:bg-blue-50/60 focus-visible:outline-none"
      >
        <TableCell className="px-4 py-4 text-slate-600 tabular-nums">
          {data.number * data.size + index + 1}
        </TableCell>
        <TableCell className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-xs font-bold text-white',
                getAvatarColor(student.studentCode),
              )}
              aria-hidden
            >
              {getInitials(student.name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                {student.name}
                {!student.accountStatus && (
                  <Lock className="h-3.5 w-3.5 text-slate-400" aria-label="Tài khoản bị khóa đăng nhập" />
                )}
              </div>
              <div className="font-mono text-xs text-slate-500">{student.studentCode}</div>
            </div>
          </div>
        </TableCell>
        <TableCell className="px-4 py-4">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-slate-800">{student.className}</span>
            {student.batch && (
              <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-xs font-bold text-blue-700">
                {student.batch}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="px-4 py-4 text-slate-800">{student.majorName ?? '—'}</TableCell>
        <TableCell className="max-w-64 px-4 py-4">
          {student.topicName ? (
            <span className="line-clamp-2 text-slate-700" title={student.topicName}>
              {student.topicName}
            </span>
          ) : (
            <span className="text-slate-400 italic">(chưa đăng ký)</span>
          )}
        </TableCell>
        <TableCell className="px-4 py-4">
          {student.lecturerName ? (
            <div className="space-y-0.5 whitespace-nowrap text-slate-800">
              <div>{student.lecturerName}</div>
              {student.coLecturerName && <div>{student.coLecturerName}</div>}
            </div>
          ) : (
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Chưa gán
            </span>
          )}
        </TableCell>
        <TableCell className="px-4 py-4">
          <StudentStatusBadge status={student.status} label={student.statusLabel} />
        </TableCell>
        <TableCell className="px-4 py-4">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(ROW_ACTION_CLASS, 'hover:bg-slate-100 hover:text-[#1565C0]')}
              onClick={(e) => {
                // Không để click lan lên dòng (tránh mở popup 2 lần)
                e.stopPropagation()
                onRowClick(student)
              }}
              aria-label={`Xem ${student.name}`}
              title="Xem chi tiết"
            >
              <Eye />
            </Button>
            {onDelete &&
              (canDeleteStudent(student) ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(ROW_ACTION_CLASS, 'hover:bg-rose-50 hover:text-rose-600')}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(student)
                  }}
                  aria-label={`Xóa ${student.name}`}
                  title="Xóa khỏi học kỳ"
                >
                  <Trash2 />
                </Button>
              ) : (
                // Giữ chỗ để nút Xem ở các dòng thẳng hàng nhau
                <span className="h-7 w-7" aria-hidden />
              ))}
          </div>
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
        {/* Cuộn trong khung, tiêu đề cột dính trên cùng */}
        <Table containerClassName="max-h-[calc(100vh-17rem)] min-h-64">
          <TableHeader className="sticky top-0 z-10 bg-slate-50">
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(HEAD_CLASS, 'w-16')}>STT</TableHead>
              {SORTABLE_COLUMNS.map((column) => (
                <SortableTableHead
                  key={column.field}
                  label={column.label}
                  field={column.field}
                  sort={sort}
                  onSortChange={onSortChange}
                  className={cn(HEAD_CLASS, column.className)}
                />
              ))}
              <TableHead className={HEAD_CLASS}>Đề tài</TableHead>
              <TableHead className={HEAD_CLASS}>GVHD</TableHead>
              <TableHead className={HEAD_CLASS}>Trạng thái</TableHead>
              <TableHead className={cn(HEAD_CLASS, 'text-right')}>Thao tác</TableHead>
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
          pageSizeOptions={pageSizeOptions}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  )
}
