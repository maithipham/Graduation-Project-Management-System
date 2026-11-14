import { Lock, Pencil, Trash2 } from 'lucide-react'
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

// Bảng tự co giãn độ rộng cột theo nội dung (không `table-fixed`), giống mockup quanlysinhvien.html.
// Kiểu chữ tiêu đề cột theo mockup: chữ nhỏ, in hoa, giãn chữ, không xuống dòng.
// Cột sắp xếp được: chữ nằm trong <button> nên phải in hoa cả button;
// icon mũi tên chỉ hiện khi đang sắp xếp theo cột đó hoặc rê chuột vào
const HEAD_CLASS =
  'h-9.5 bg-slate-100 px-4 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap text-slate-700 [&_button]:uppercase [&_button]:tracking-wider [&_svg.text-slate-400]:opacity-0 [&:hover_svg]:opacity-100'

// Mỗi dòng cao cố định 60px; khung bảng cao đúng tiêu đề (38px + 1px viền) + 7 dòng = 459px
// → hiện tối đa 7 dòng, dòng thứ 8 trở đi phải cuộn mới thấy. Đổi ROW_HEIGHT_CLASS thì tính lại số này
const ROW_HEIGHT_CLASS = 'h-15'
const VISIBLE_ROWS_HEIGHT_CLASS = 'h-[459px]'

// Nút thao tác từng dòng theo đặc tả: 28px, bo 8px, icon 14px
const ROW_ACTION_CLASS = 'h-7 w-7 rounded-lg text-slate-500 [&_svg]:size-3.5'

const SORTABLE_COLUMNS: { field: StudentSortField; label: string; className?: string }[] = [
  { field: 'name', label: 'Họ và tên', className: 'min-w-[190px]' },
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
  /** Bấm nút bút chì → mở popup sửa. Không truyền → ẩn nút */
  onEdit?: (student: StudentListItem) => void
  /** Câu hiện khi không có dòng nào (trang tự chọn theo bộ lọc / học kì) */
  emptyMessage: string
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
  onEdit,
  emptyMessage,
  onDelete,
}: StudentTableProps) {
  const renderBody = () => {
    if (isPending) {
      return Array.from({ length: pageSize }, (_, i) => (
        <TableRow key={i} className={cn(ROW_HEIGHT_CLASS, 'hover:bg-transparent')}>
          {Array.from({ length: COLUMN_COUNT }, (_, j) => (
            <TableCell key={j}>
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
          <TableCell colSpan={COLUMN_COUNT} className="py-14 text-center text-sm font-medium text-slate-600">
            {emptyMessage}
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
        // py-2 (thay py-2.5 mặc định) để nội dung 2 dòng (tên + MSSV, đề tài) vừa trong chiều cao dòng cố định
        className={cn(
          ROW_HEIGHT_CLASS,
          'cursor-pointer hover:bg-blue-50/40 focus-visible:bg-blue-50/60 focus-visible:outline-none [&>td]:py-2',
        )}
      >
        <TableCell className="text-[12.5px] font-semibold text-slate-500 tabular-nums">
          {data.number * data.size + index + 1}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-[10.5px] font-bold text-white',
                getAvatarColor(student.studentCode),
              )}
              aria-hidden
            >
              {getInitials(student.name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[13px] leading-5 font-semibold text-slate-800">
                <span className="truncate">{student.name}</span>
                {!student.accountStatus && (
                  <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-label="Tài khoản bị khóa đăng nhập" />
                )}
              </div>
              <div className="mt-0.5 font-mono text-[12px] leading-4 font-medium text-slate-500">{student.studentCode}</div>
            </div>
          </div>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          <span className="text-[13px] font-medium text-slate-700">{student.className}</span>
          {student.batch && (
            <span className="ml-1.5 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10.5px] font-bold text-blue-700">
              {student.batch}
            </span>
          )}
        </TableCell>
        <TableCell className="text-[12.5px] font-medium whitespace-nowrap text-slate-700">
          {student.majorName ?? '—'}
        </TableCell>
        <TableCell>
          {student.topicName ? (
            // max-w đặt trên span: trình duyệt bỏ qua max-width của ô <td> khi bảng tự co giãn
            <span className="line-clamp-2 max-w-[260px] text-[12.5px] text-slate-700" title={student.topicName}>
              {student.topicName}
            </span>
          ) : (
            <span className="text-[12.5px] text-slate-400 italic">(chưa đăng ký)</span>
          )}
        </TableCell>
        <TableCell>
          {student.lecturerName ? (
            <div className="space-y-0.5 text-[12.5px] leading-snug font-medium whitespace-nowrap text-slate-800">
              <div>{student.lecturerName}</div>
              {student.coLecturerName && <div>{student.coLecturerName}</div>}
            </div>
          ) : (
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
              Chưa gán
            </span>
          )}
        </TableCell>
        <TableCell className="whitespace-nowrap">
          <StudentStatusBadge status={student.status} label={student.statusLabel} />
        </TableCell>
        <TableCell className="text-right whitespace-nowrap">
          <div className="inline-flex items-center justify-end gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(ROW_ACTION_CLASS, 'hover:bg-slate-100 hover:text-[#1565C0]')}
                onClick={(e) => {
                  // Không để click lan lên dòng (tránh mở thêm popup chi tiết)
                  e.stopPropagation()
                  onEdit(student)
                }}
                aria-label={`Sửa ${student.name}`}
                title="Sửa thông tin"
              >
                <Pencil />
              </Button>
            )}
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
                // Giữ chỗ để nút Sửa ở các dòng thẳng hàng nhau
                <span className="h-7 w-7" aria-hidden />
              ))}
          </div>
        </TableCell>
      </TableRow>
    ))
  }

  return (
    // Card cao vừa đủ tiêu đề + 7 dòng + chân phân trang (ít dòng thì để trống phía dưới, bảng không nhảy),
    // bảng cuộn bên trong. Màn hình thấp quá thì co lại (shrink), nhưng không thấp hơn min-h-80
    <div className="flex min-h-80 shrink flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className={cn('flex min-h-0 flex-1 flex-col transition-opacity', isPlaceholderData && 'opacity-60')}>
        {/* Tiêu đề cột dính trên cùng khi cuộn */}
        <Table
          containerClassName={cn(VISIBLE_ROWS_HEIGHT_CLASS, 'min-h-0 shrink')}
          // Màn hình hẹp hơn min-w thì cuộn ngang trong khung
          className="min-w-[1180px] text-[13px]"
        >
          <TableHeader className="sticky top-0 z-10 bg-slate-100">
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
              <TableHead className={cn(HEAD_CLASS, 'max-w-[260px]')}>Đề tài</TableHead>
              <TableHead className={HEAD_CLASS}>GVHD</TableHead>
              <TableHead className={HEAD_CLASS}>Trạng thái</TableHead>
              <TableHead className={cn(HEAD_CLASS, 'w-24 text-right')}>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderBody()}</TableBody>
        </Table>
      </div>

      {/* Luôn hiện chân bảng (kể cả khi rỗng) để bảng không bị hụt chiều cao */}
      {data && (
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
