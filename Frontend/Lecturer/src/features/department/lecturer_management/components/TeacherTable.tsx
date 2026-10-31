import { SearchX, UserPlus } from 'lucide-react'
import type { SpringPage } from '@/shared/types'
import {
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import type { TeacherListItem } from '../types'
import {
  getAvatarColor,
  getAvatarInitials,
  getTeacherPlainName,
  getTeacherId,
} from '../utils/teacherDisplay'

interface TeacherTableProps {
  data: SpringPage<TeacherListItem> | undefined
  isPending: boolean
  isError: boolean
  isPlaceholderData: boolean
  pageSize: number
  selectedIds: Set<number>
  onToggleSelect: (id: number) => void
  onSelectAll: (selected: boolean) => void
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onRowClick: (teacher: TeacherListItem) => void
  hasFilters: boolean
  onCreate: () => void
}

const PAGE_SIZE_OPTIONS = [15, 25, 50]

export function TeacherTable({
  data,
  isPending,
  isError,
  isPlaceholderData,
  pageSize,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  hasFilters,
  onCreate,
}: TeacherTableProps) {
  const content = data?.content ?? []
  const pageNumber = data?.page?.number ?? (data as unknown as { number?: number })?.number ?? 0
  const totalElements = data?.page?.totalElements ?? (data as unknown as { totalElements?: number })?.totalElements ?? 0
  const totalPages = data?.page?.totalPages ?? (data as unknown as { totalPages?: number })?.totalPages ?? 0

  const allSelected =
    content.length > 0 &&
    content.every((t) => {
      const id = typeof getTeacherId(t) === 'number' ? (getTeacherId(t) as number) : t.id
      return id ? selectedIds.has(id) : false
    })

  const someSelected =
    content.some((t) => {
      const id = typeof getTeacherId(t) === 'number' ? (getTeacherId(t) as number) : t.id
      return id ? selectedIds.has(id) : false
    }) && !allSelected

  const renderBody = () => {
    if (isPending) {
      return Array.from({ length: pageSize }, (_, i) => (
        <TableRow key={i}>
          <TableCell className="w-10 text-center">
            <Skeleton className="h-4 w-4 mx-auto rounded" />
          </TableCell>
          <TableCell className="w-12 text-center">
            <Skeleton className="h-4 w-6 mx-auto rounded" />
          </TableCell>
          <TableCell className="w-20 text-center">
            <Skeleton className="h-4 w-12 mx-auto rounded" />
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-5 w-24 ml-auto rounded-full" />
          </TableCell>
        </TableRow>
      ))
    }

    if (isError) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="py-12 text-center">
            <p className="font-semibold text-rose-600">
              Không thể tải danh sách giáo viên. Vui lòng thử lại sau.
            </p>
          </TableCell>
        </TableRow>
      )
    }

    if (content.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="py-14 text-center">
            <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
              {hasFilters ? (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <SearchX className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Không tìm thấy giáo viên nào
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Thử đổi từ khóa hoặc bộ lọc đơn vị / ngành
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#1565C0]">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Chưa có giáo viên nào trong học kỳ này
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bấm "+ Thêm giảng viên" hoặc "Import File" để thêm mới
                    </p>
                  </div>
                  <Button type="button" onClick={onCreate} className="mt-1">
                    Thêm giảng viên
                  </Button>
                </>
              )}
            </div>
          </TableCell>
        </TableRow>
      )
    }

    return content.map((teacher, index) => {
      const rawId = getTeacherId(teacher)
      const numId = typeof rawId === 'number' ? rawId : teacher.id ?? index + 1
      const isSelected = selectedIds.has(numId)
      const avatarColor = getAvatarColor(teacher.email || teacher.name)

      return (
        <TableRow
          key={teacher.publicId || numId}
          onClick={() => onRowClick(teacher)}
          className={cn(
            'group cursor-pointer transition-colors hover:bg-blue-50/40',
            isSelected && 'bg-blue-50/60',
          )}
        >
          {/* Checkbox */}
          <TableCell
            className="w-10 text-center"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(numId)}
              aria-label={`Chọn giảng viên ${teacher.name}`}
              className="h-4 w-4 rounded border-slate-300 text-[#1565C0] focus:ring-[#1565C0] cursor-pointer"
            />
          </TableCell>

          {/* STT */}
          <TableCell className="w-12 text-center text-xs font-semibold text-slate-500">
            {pageNumber * pageSize + index + 1}
          </TableCell>

          {/* Học hàm / Học vị (đặt trước tên, không cần tên cột) */}
          <TableCell className="w-20 text-center">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold text-slate-700 bg-slate-100/90 border border-slate-200/80">
              {teacher.academicTitle || '—'}
            </span>
          </TableCell>

          {/* Họ và tên kèm Avatar + Email */}
          <TableCell>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs',
                  avatarColor,
                )}
              >
                {getAvatarInitials(teacher)}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-sm group-hover:text-[#1565C0] transition-colors">
                  {getTeacherPlainName(teacher)}
                </div>
                <div className="text-xs text-slate-400 font-normal truncate">
                  {teacher.email}
                </div>
              </div>
            </div>
          </TableCell>

          {/* Đơn vị / Bộ môn */}
          <TableCell>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-800">
                {teacher.majorName || teacher.organization || '—'}
              </div>
              <div>
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium',
                    teacher.isInternal
                      ? 'text-sky-600 bg-sky-50'
                      : 'text-amber-700 bg-amber-50',
                  )}
                >
                  {teacher.isInternal ? 'Trong trường' : 'Ngoài trường'}
                </span>
              </div>
            </div>
          </TableCell>

          {/* Vai trò GVHD */}
          <TableCell className="text-right">
            <span
              className={cn(
                'inline-flex items-center text-xs font-medium',
                teacher.isAssigned
                  ? 'text-emerald-600 font-semibold'
                  : 'text-slate-400',
              )}
            >
              {teacher.assignmentStatus ||
                (teacher.isAssigned ? 'Đã phân công' : 'Chưa phân công')}
            </span>
          </TableCell>
        </TableRow>
      )
    })
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  aria-label="Chọn tất cả giảng viên trên trang"
                  className="h-4 w-4 rounded border-slate-300 text-[#1565C0] focus:ring-[#1565C0] cursor-pointer"
                />
              </TableHead>
              <TableHead className="w-12 text-center text-xs font-bold uppercase tracking-wider text-slate-600">
                STT
              </TableHead>
              <TableHead
                className="w-20 text-center text-xs font-bold uppercase tracking-wider text-slate-600"
                aria-label="Học hàm / Học vị"
                title="Học hàm / Học vị"
              />
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Họ và tên
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Đơn vị / Bộ môn
              </TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-600">
                Vai trò GVHD
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className={cn(
              'divide-y divide-slate-100',
              isPlaceholderData && 'opacity-60 transition-opacity',
            )}
          >
            {renderBody()}
          </TableBody>
        </Table>
      </div>

      {/* Footer Phân trang chuẩn */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-1 text-xs text-slate-600">
        <div>
          Hiển thị{' '}
          <strong className="text-slate-800">
            {totalElements > 0 ? pageNumber * pageSize + 1 : 0}–
            {Math.min((pageNumber + 1) * pageSize, totalElements)}
          </strong>{' '}
          trên <strong className="text-slate-800">{totalElements}</strong> giảng viên
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {onPageSizeChange && (
            <div className="flex items-center gap-1.5">
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                aria-label="Số dòng trên mỗi trang"
                className="h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-[#1565C0] focus:ring-1 focus:ring-blue-100 cursor-pointer shadow-2xs"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}/trang
                  </option>
                ))}
              </select>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pageNumber === 0}
                onClick={() => onPageChange(pageNumber - 1)}
                className="h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
              >
                Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i)
                .filter(
                  (p) =>
                    p === 0 ||
                    p === totalPages - 1 ||
                    Math.abs(p - pageNumber) <= 1,
                )
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1]
                  const showEllipsis = prev !== undefined && p - prev > 1
                  return (
                    <span key={p} className="flex items-center">
                      {showEllipsis && (
                        <span className="px-1 text-slate-400">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => onPageChange(p)}
                        className={cn(
                          'h-8 w-8 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer',
                          p === pageNumber
                            ? 'bg-[#1565C0] text-white shadow-xs'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                        )}
                      >
                        {p + 1}
                      </button>
                    </span>
                  )
                })}

              <button
                type="button"
                disabled={pageNumber >= totalPages - 1}
                onClick={() => onPageChange(pageNumber + 1)}
                className="h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
