import { Pencil, Trash2 } from 'lucide-react'
import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui'
import type { SpringPage } from '@/shared/types'
import { cn } from '@/shared/utils/cn'
import { StudentAccountStatusBadge } from './StudentAccountStatusBadge'
import type { StudentAccountItem } from '../types/account.types'

const HEAD_CLASS = 'font-bold text-slate-600 text-xs uppercase'
const COLUMN_COUNT = 6

interface StudentAccountTableProps {
  data: SpringPage<StudentAccountItem> | undefined
  isPending: boolean
  isError: boolean
  /** Đang hiện dữ liệu trang cũ trong lúc chờ trang mới */
  isPlaceholderData: boolean
  onRowClick: (student: StudentAccountItem) => void
  onEdit: (student: StudentAccountItem) => void
  onDelete: (student: StudentAccountItem) => void
}

/** Bảng tài khoản sinh viên (dữ liệu từ GET /student/account) */
export function StudentAccountTable({
  data,
  isPending,
  isError,
  isPlaceholderData,
  onRowClick,
  onEdit,
  onDelete,
}: StudentAccountTableProps) {
  const renderBody = () => {
    if (isPending) {
      return Array.from({ length: 5 }, (_, i) => (
        <TableRow key={i}>
          <TableCell colSpan={COLUMN_COUNT}>
            <Skeleton className="h-8 w-full" />
          </TableCell>
        </TableRow>
      ))
    }

    if (isError || !data) {
      return (
        <TableRow>
          <TableCell colSpan={COLUMN_COUNT} className="h-32 text-center text-slate-400 text-sm">
            Không tải được danh sách tài khoản sinh viên.
          </TableCell>
        </TableRow>
      )
    }

    if (data.empty) {
      return (
        <TableRow>
          <TableCell colSpan={COLUMN_COUNT} className="h-32 text-center text-slate-400 text-sm">
            Không tìm thấy tài khoản phù hợp với điều kiện tìm kiếm.
          </TableCell>
        </TableRow>
      )
    }

    return data.content.map((student, idx) => (
      <TableRow
        key={student.publicId}
        onClick={() => onRowClick(student)}
        aria-label={`Xem chi tiết sinh viên ${student.name}`}
        className="cursor-pointer hover:bg-slate-50/80 transition-colors"
      >
        {/* STT liên tục qua các trang */}
        <TableCell className="text-center font-medium text-slate-500 text-xs">
          {data.number * data.size + idx + 1}
        </TableCell>

        <TableCell>
          <div className="font-semibold text-slate-900 text-sm">{student.name}</div>
          <div className="text-xs text-slate-500">{student.email}</div>
        </TableCell>

        <TableCell className="text-slate-600 text-sm">{student.majorName ?? '—'}</TableCell>

        <TableCell className="text-slate-600 text-sm">
          {student.className} / {student.batch}
        </TableCell>

        <TableCell>
          <StudentAccountStatusBadge active={student.accountStatus} />
        </TableCell>

        <TableCell className="text-center">
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              aria-label="Sửa sinh viên"
              title="Sửa sinh viên"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(student)
              }}
              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Xóa sinh viên"
              title="Xóa sinh viên"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(student)
              }}
              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <Table className={cn(isPlaceholderData && 'opacity-60 transition-opacity')}>
      <TableHeader>
        <TableRow className="bg-slate-50/80">
          <TableHead className={cn('w-14 text-center', HEAD_CLASS)}>STT</TableHead>
          <TableHead className={HEAD_CLASS}>Họ và tên</TableHead>
          <TableHead className={HEAD_CLASS}>Bộ môn</TableHead>
          <TableHead className={HEAD_CLASS}>Lớp / Khóa</TableHead>
          <TableHead className={HEAD_CLASS}>Trạng thái</TableHead>
          <TableHead className={cn('w-24 text-center whitespace-nowrap', HEAD_CLASS)}>
            Thao tác
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>{renderBody()}</TableBody>
    </Table>
  )
}
