import {
  Search,
  Sparkles,
  UserCheck,
  Check,
  BookOpen,
  X,
  Loader2,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/utils/cn'
import type { SemesterOption } from '@/features/department/student_management'
import { AutoDistributeModal } from './AutoDistributeModal'
import { useCommentingAssignment } from '../hooks/useCommentingAssignment'
import type { LecturerCategory, LecturerSort } from '../types/commenting.types'

interface CommentingAssignmentWorkspaceViewProps {
  semesterId: string
  semesterName?: string
  academicYear?: string
  academicYears?: string[]
  termsOfYear?: SemesterOption[]
  selectedYear?: string
  selectedSemesterId?: string
  onYearChange?: (year: string) => void
  onSemesterChange?: (semesterId: string) => void
  semestersLoading?: boolean
}

export function CommentingAssignmentWorkspaceView({
  semesterId,
  academicYears,
  termsOfYear,
  selectedYear,
  selectedSemesterId,
  onYearChange,
  onSemesterChange,
  semestersLoading = false,
}: CommentingAssignmentWorkspaceViewProps) {
  const {
    filters,
    setFilters,
    selectedIds,
    selectedLecturerId,
    setSelectedLecturerId,
    selectedLecturer,
    hasSelectedConflict,
    conflictingStudents,
    lecturers,
    allLecturers,
    students,
    stats,
    isLoading,
    isAssigningManual,
    isPreviewLoading,
    isConfirmingAutoDistribute,
    isPreviewOpen,
    setIsPreviewOpen,
    previewData,
    handleToggleSelect,
    handleSelectAllVisible,
    handleClearSelection,
    handleAssignCurrentSelection,
    handlePreviewAutoDistribute,
    handleConfirmAutoDistribute,
  } = useCommentingAssignment({ semesterId })

  const isAllVisibleSelected =
    students.length > 0 && students.every((s) => selectedIds.includes(s.id))
  const isSomeVisibleSelected =
    students.some((s) => selectedIds.includes(s.id)) && !isAllVisibleSelected

  // Đổi thứ tự sắp xếp theo số lượng SV đang nhận
  const toggleLecturerSort = () => {
    setFilters((prev) => {
      let nextSort: LecturerSort = 'asc'
      if (prev.lecturerSort === 'asc') nextSort = 'desc'
      else if (prev.lecturerSort === 'desc') nextSort = 'default'
      else nextSort = 'asc'
      return { ...prev, lecturerSort: nextSort }
    })
  }

  const setCategory = (cat: LecturerCategory) => {
    setFilters((prev) => ({ ...prev, lecturerCategory: cat }))
  }

  const currentCategory = filters.lecturerCategory || 'internal'

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* --------------------------------------------------------------------- */}
      {/* 1. TOP ACTIONS & FILTERS BAR: NĂM HỌC, HỌC KỲ (TRÁI) & PHÂN CÔNG NHANH (PHẢI) */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Đầu dòng bên trái: Năm học, Học kỳ */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bộ chọn Năm học */}
          {academicYears && academicYears.length > 0 && onYearChange && (
            <select
              aria-label="Chọn năm học"
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              disabled={semestersLoading}
              className="h-9 px-3.5 pr-8 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition appearance-none cursor-pointer shadow-xs"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M6 9l6 6 6-6'/%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
              }}
            >
              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {year === 'all' ? 'Tất cả năm học' : year}
                </option>
              ))}
            </select>
          )}

          {/* Bộ chọn Học kỳ */}
          {termsOfYear && termsOfYear.length > 0 && onSemesterChange && (
            <select
              aria-label="Chọn học kỳ"
              value={selectedSemesterId}
              onChange={(e) => onSemesterChange(e.target.value)}
              disabled={semestersLoading}
              className="h-9 px-3.5 pr-8 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition appearance-none cursor-pointer shadow-xs"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M6 9l6 6 6-6'/%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
              }}
            >
              {termsOfYear.map((term) => {
                const termId = term.publicId || String((term as any).id)
                return (
                  <option key={termId} value={termId}>
                    {term.term || term.name}
                  </option>
                )
              })}
            </select>
          )}
        </div>

        {/* Cuối dòng bên phải: Nút Phân công nhanh (Chia đều) */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => handlePreviewAutoDistribute()}
            disabled={stats.unassigned === 0 || isPreviewLoading || isLoading}
            className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs font-medium cursor-pointer h-9 text-xs"
          >
            {isPreviewLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang tính toán chia đều...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1.5" />
                Phân công nhanh (Chia đều)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. MAIN 2-COLUMN SPLIT WORKSPACE                                      */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
        {/* =================================================================== */}
        {/* CỘT TRÁI (7/12): DANH SÁCH SINH VIÊN / ĐỀ TÀI                       */}
        {/* =================================================================== */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-xl flex flex-col shadow-2xs overflow-hidden">
          {/* Header & Tabs */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Tabs chuyển trạng thái */}
              <div className="inline-flex p-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-600">
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, status: 'ALL' }))}
                  className={cn(
                    'px-3 py-1.5 rounded-md transition-all cursor-pointer',
                    filters.status === 'ALL'
                      ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                      : 'hover:text-gray-900',
                  )}
                >
                  Tất cả ({stats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, status: 'UNASSIGNED' }))}
                  className={cn(
                    'px-3 py-1.5 rounded-md transition-all cursor-pointer',
                    filters.status === 'UNASSIGNED'
                      ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                      : 'hover:text-amber-700',
                  )}
                >
                  Chưa phân công ({stats.unassigned})
                </button>
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, status: 'ASSIGNED' }))}
                  className={cn(
                    'px-3 py-1.5 rounded-md transition-all cursor-pointer',
                    filters.status === 'ASSIGNED'
                      ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                      : 'hover:text-emerald-700',
                  )}
                >
                  Đã phân công ({stats.assigned})
                </button>
              </div>

              {/* Ô tìm kiếm sinh viên */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  placeholder="Tìm theo MSSV, tên SV, đề tài..."
                  className="pl-9 text-xs h-9"
                />
                {filters.search && (
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Thanh thông báo khi có sinh viên được tích chọn */}
            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between p-2.5 px-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Đã tích chọn <strong>{selectedIds.length}</strong> sinh viên. Chọn một Giảng viên ở cột bên phải rồi bấm <strong>Gán ({selectedIds.length} SV)</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-blue-700 hover:text-blue-900 font-semibold underline text-xs cursor-pointer"
                >
                  Bỏ chọn tất cả
                </button>
              </div>
            )}
          </div>

          {/* Bảng sinh viên */}
          <div className="overflow-x-auto min-h-[440px] max-h-[640px] overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                <p className="text-sm">Đang tải danh sách sinh viên...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-2">
                <BookOpen className="w-10 h-10 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">Không tìm thấy sinh viên nào phù hợp</p>
                <p className="text-xs text-gray-400">Thử thay đổi từ khóa tìm kiếm hoặc tab trạng thái</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200 sticky top-0 z-10 backdrop-blur-xs">
                  <tr>
                    <th className="w-10 py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isAllVisibleSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isSomeVisibleSelected
                        }}
                        onChange={(e) => handleSelectAllVisible(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title="Chọn tất cả sinh viên đang hiển thị"
                      />
                    </th>
                    <th className="py-3 px-3">Sinh viên</th>
                    <th className="py-3 px-3">Đề tài tốt nghiệp</th>
                    <th className="py-3 px-3">GV Hướng dẫn</th>
                    <th className="py-3 px-3">GV Nhận xét (GVNX)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => {
                    const isSelected = selectedIds.includes(student.id)
                    return (
                      <tr
                        key={student.id}
                        onClick={() => handleToggleSelect(student.id)}
                        className={cn(
                          'cursor-pointer transition-colors',
                          isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50/80',
                        )}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3 px-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(student.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* Sinh viên: Chỉ hiện Tên sinh viên (Mã sinh viên) */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900 text-[13.5px]">
                              {student.studentName}
                            </span>
                            <span className="text-slate-500 font-mono text-xs">
                              ({student.studentCode})
                            </span>
                          </div>
                        </td>

                        {/* Tên đề tài */}
                        <td className="py-3 px-3 max-w-[220px]">
                          <div
                            className="text-xs text-gray-700 line-clamp-2"
                            title={student.topicTitle}
                          >
                            {student.topicTitle}
                          </div>
                        </td>

                        {/* GV Hướng dẫn */}
                        <td className="py-3 px-3">
                          <div className="text-xs font-medium text-gray-800">
                            {student.supervisorName}
                          </div>
                          {student.coSupervisorName && (
                            <div className="text-[11px] text-gray-500">
                              Đồng HD: {student.coSupervisorName}
                            </div>
                          )}
                        </td>

                        {/* GV Nhận xét */}
                        <td className="py-3 px-3">
                          {student.commentingLecturerName ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-medium"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              {student.commentingLecturerName}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-medium"
                            >
                              Chưa phân công
                            </Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* CỘT PHẢI (5/12): DANH SÁCH GIẢNG VIÊN - GIAO DIỆN CHUẨN ẢNH MẪU     */}
        {/* =================================================================== */}
        <div className="lg:col-span-5 flex flex-col space-y-2">
          {/* HÀNG 1: Ô tìm kiếm giảng viên & Nút Gán (X SV) */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm theo tên giảng viên, học hàm, bộ môn..."
                value={filters.lecturerSearch || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, lecturerSearch: e.target.value }))
                }
                className="w-full h-9 pl-9 pr-8 bg-white border border-slate-300 rounded-lg text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {filters.lecturerSearch && (
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, lecturerSearch: '' }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Nút Gán (X SV) */}
            <button
              type="button"
              onClick={handleAssignCurrentSelection}
              disabled={
                selectedIds.length === 0 ||
                !selectedLecturer ||
                hasSelectedConflict ||
                isAssigningManual
              }
              title={
                selectedIds.length === 0
                  ? 'Tích chọn sinh viên ở bảng bên trái trước khi gán'
                  : !selectedLecturer
                    ? 'Chọn một giảng viên ở danh sách bên dưới'
                    : hasSelectedConflict
                      ? 'Không thể gán: Trùng với GVHD của sinh viên đang chọn'
                      : `Gán cho ${selectedIds.length} sinh viên đã chọn`
              }
              className={cn(
                'h-9 px-4 rounded-lg text-white text-[13px] font-semibold transition shadow-xs flex items-center justify-center shrink-0',
                selectedIds.length > 0 && selectedLecturer && !hasSelectedConflict && !isAssigningManual
                  ? 'bg-[#5B89EA] hover:bg-[#4A77D4] cursor-pointer active:scale-98'
                  : 'bg-[#5B89EA] opacity-80 cursor-not-allowed',
              )}
            >
              {isAssigningManual ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Đang gán...
                </>
              ) : (
                <span>Gán ({selectedIds.length} SV)</span>
              )}
            </button>
          </div>

          {/* HÀNG 2: 4 Tabs danh mục đơn vị */}
          <div className="h-9 bg-slate-100 p-0.5 rounded-lg flex items-center gap-1 text-[12px] font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={cn(
                'flex-1 h-8 px-2 rounded-md flex items-center justify-center transition text-center cursor-pointer whitespace-nowrap',
                currentCategory === 'all'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setCategory('internal')}
              className={cn(
                'flex-1 h-8 px-2 rounded-md flex items-center justify-center transition text-center cursor-pointer whitespace-nowrap',
                currentCategory === 'internal'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              Trong bộ môn
            </button>
            <button
              type="button"
              onClick={() => setCategory('dept_ext')}
              className={cn(
                'flex-1 h-8 px-2 rounded-md flex items-center justify-center transition text-center cursor-pointer whitespace-nowrap',
                currentCategory === 'dept_ext'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              Ngoài bộ môn
            </button>
            <button
              type="button"
              onClick={() => setCategory('univ_ext')}
              className={cn(
                'flex-1 h-8 px-2 rounded-md flex items-center justify-center transition text-center cursor-pointer whitespace-nowrap',
                currentCategory === 'univ_ext'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              Ngoài trường
            </button>
          </div>

          {/* HÀNG 3: Bảng danh sách Giảng viên (Khung viền + Header cố định + Body cuộn) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
            {/* Tiêu đề bảng Giảng viên: CHỌN | TÊN GIẢNG VIÊN | ⇅ ĐANG NHẬN */}
            <div className="grid grid-cols-12 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider h-10 px-3 border-b border-slate-200 items-center">
              <div className="col-span-2 text-center">CHỌN</div>
              <div className="col-span-7">TÊN GIẢNG VIÊN</div>
              <div className="col-span-3 flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={toggleLecturerSort}
                  className="flex items-center gap-1 hover:text-blue-600 transition cursor-pointer select-none"
                  title="Nhấn để đổi thứ tự sắp xếp theo số lượng SV"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>ĐANG NHẬN</span>
                </button>
              </div>
            </div>

            {/* Thân danh sách Giảng viên cuộn độc lập */}
            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[560px] min-h-[380px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                  <p className="text-xs">Đang tải danh sách giảng viên...</p>
                </div>
              ) : lecturers.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  Không tìm thấy giảng viên nào trong mục này
                </div>
              ) : (
                lecturers.map((l) => {
                  const isSelected = selectedLecturerId === l.id

                  return (
                    <label
                      key={l.id}
                      onClick={() => setSelectedLecturerId(l.id)}
                      className={cn(
                        'grid grid-cols-12 items-center py-3 px-3 transition-colors cursor-pointer select-none',
                        isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/80',
                      )}
                    >
                      {/* Cột Radio Chọn */}
                      <div className="col-span-2 flex items-center justify-center">
                        <input
                          type="radio"
                          name="commentingLecturerSelect"
                          value={l.id}
                          checked={isSelected}
                          onChange={() => setSelectedLecturerId(l.id)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>

                      {/* Cột Tên giảng viên · Bộ môn / Đơn vị công tác */}
                      <div className="col-span-7 flex items-center gap-1 text-[13px] min-w-0 pr-2">
                        <span className="font-bold text-slate-900 shrink-0">
                          {l.displayName}
                        </span>
                        <span className="text-slate-400 font-normal shrink-0">·</span>
                        <span
                          className="text-slate-500 font-normal truncate"
                          title={l.subLabel}
                        >
                          {l.subLabel}
                        </span>
                      </div>

                      {/* Cột Đang nhận (Pill badge chuẩn ảnh mẫu) */}
                      <div className="col-span-3 flex items-center justify-center">
                        <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-semibold border border-blue-300 text-blue-600 bg-blue-50/60 min-w-[50px]">
                          {l.commentingStudentCount} SV
                        </span>
                      </div>
                    </label>
                  )
                })
              )}
            </div>
          </div>

          {/* Cảnh báo xung đột BR-05 nếu giảng viên đang chọn là GVHD của bất kỳ SV nào được tích chọn */}
          {hasSelectedConflict && selectedIds.length > 0 && selectedLecturer && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 shadow-2xs animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Trùng GVHD (Quy tắc BR-05):</strong> Giảng viên{' '}
                <strong>{selectedLecturer.displayName}</strong> đang là GVHD của sinh viên:{' '}
                <span className="font-semibold underline">
                  {conflictingStudents.map((s) => `${s.studentName} (${s.studentCode})`).join(', ')}
                </span>
                . Hệ thống không cho phép gán để tránh xung đột lợi ích. Vui lòng chọn giảng viên nhận xét khác.
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400 italic px-1">
            * Giảng viên nhận xét không áp dụng hạn mức (unlimited quota). Cột "ĐANG NHẬN" thể hiện khối lượng công việc hiện tại.
          </p>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. MODAL PREVIEW PHÂN CÔNG CHIA ĐỀU                                    */}
      {/* --------------------------------------------------------------------- */}
      <AutoDistributeModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onConfirm={handleConfirmAutoDistribute}
        isLoading={isConfirmingAutoDistribute}
        lecturers={allLecturers}
        previewAssignments={previewData}
      />
    </div>
  )
}
