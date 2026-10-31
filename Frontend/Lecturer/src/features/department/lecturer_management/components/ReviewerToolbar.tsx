import { Download, Plus, Search, Upload } from 'lucide-react'
import { Button } from '@/shared/components/ui'
import { toast } from '@/shared/components/feedback'
import type { MajorOption, SemesterOption } from '@/features/department/student_management'
import type { ReviewerFilters } from '../types'
import { SemesterScopeFilter } from './SemesterScopeFilter'

interface ReviewerToolbarProps {
  filters: ReviewerFilters
  onChange: (filters: Partial<ReviewerFilters>) => void
  totalTopics: number
  reviewedTopics: number
  majors?: MajorOption[]
  batches?: string[]
  classes?: string[]
  selectedYear: string
  selectedSemesterId: string
  academicYears: string[]
  termsOfYear: SemesterOption[]
  isLoadingSemesters?: boolean
  onYearChange: (year: string) => void
  onSemesterChange: (semesterId: string) => void
}

export function ReviewerToolbar({
  filters,
  onChange,
  totalTopics,
  reviewedTopics,
  majors,
  batches,
  classes,
  selectedYear,
  selectedSemesterId,
  academicYears,
  termsOfYear,
  isLoadingSemesters,
  onYearChange,
  onSemesterChange,
}: ReviewerToolbarProps) {
  const pct = totalTopics > 0 ? Math.round((reviewedTopics / totalTopics) * 100) : 0
  const remaining = Math.max(0, totalTopics - reviewedTopics)

  const handleDownloadTemplate = () => {
    toast.info('Tính năng tải file mẫu phân công nhận xét đang chờ Backend cung cấp API.')
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      toast.info('Tính năng import phân công nhận xét đang chờ Backend cung cấp API.')
      e.target.value = ''
    }
  }

  const handleManualAdd = () => {
    toast.info('Vui lòng chọn người nhận xét trực tiếp tại cột "Người nhận xét" của từng sinh viên.')
  }

  return (
    <div className="space-y-4">
      {/* 1. Thanh phía trên: Bộ lọc Năm học & Học kỳ (trái), Nút thao tác (phải) - Không có tiêu đề h1 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SemesterScopeFilter
          selectedYear={selectedYear}
          selectedSemesterId={selectedSemesterId}
          academicYears={academicYears}
          termsOfYear={termsOfYear}
          isLoading={isLoadingSemesters}
          onYearChange={onYearChange}
          onSemesterChange={onSemesterChange}
        />

        <div className="flex items-center gap-2 flex-wrap ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadTemplate}
            className="h-9 px-3.5 text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500 mr-1.5" />
            Tải file mẫu
          </Button>

          <label className="h-9 px-3.5 rounded-lg bg-sky-100 border border-sky-200 text-sky-800 text-xs font-semibold hover:bg-sky-200 transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs">
            <Upload className="w-4 h-4 text-sky-700" />
            <span>Import File</span>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} className="hidden" />
          </label>

          <Button
            type="button"
            onClick={handleManualAdd}
            className="h-9 px-4 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Thêm thủ công
          </Button>
        </div>
      </div>

      {/* 2. Thanh thống kê ngắn gọn */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
        <div>
          Đã phân công <strong className="text-slate-800">{reviewedTopics}/{totalTopics}</strong> đề tài (
          <span className="font-semibold text-sky-600">{pct}%</span>) · Còn{' '}
          <span className="font-semibold text-amber-600">{remaining} đề tài cần gán người nhận xét</span>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-wrap gap-2.5 items-center justify-between">
        <div className="flex items-center gap-2 h-8.5 flex-1 min-w-[240px] px-3 bg-white border border-slate-300 rounded-lg focus-within:border-[#1565C0] focus-within:ring-2 focus-within:ring-blue-100 transition shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Tìm MSSV, tên SV, đề tài..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="flex-1 bg-transparent outline-none text-xs text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filters.department}
            onChange={(e) => onChange({ department: e.target.value })}
            aria-label="Lọc theo bộ môn"
            className="h-8.5 px-3 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-medium outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition text-slate-800 shadow-2xs cursor-pointer"
          >
            <option value="all">Tất cả bộ môn</option>
            {majors && majors.length > 0
              ? majors.map((m) => (
                  <option key={m.publicId} value={m.name}>
                    {m.name}
                  </option>
                ))
              : (
                <>
                  <option value="Kỹ thuật phần mềm">Kỹ thuật phần mềm</option>
                  <option value="Hệ thống thông tin">Hệ thống thông tin</option>
                  <option value="Khoa học máy tính">Khoa học máy tính</option>
                  <option value="Mạng & An toàn thông tin">Mạng & An toàn thông tin</option>
                </>
              )}
          </select>

          <select
            value={filters.batch}
            onChange={(e) => onChange({ batch: e.target.value })}
            aria-label="Lọc theo khóa"
            className="h-8.5 px-3 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-medium outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition text-slate-800 shadow-2xs cursor-pointer"
          >
            <option value="all">Tất cả khóa</option>
            {batches?.map((b) => (
              <option key={b} value={b}>
                Khóa {b}
              </option>
            ))}
          </select>

          <select
            value={filters.className}
            onChange={(e) => onChange({ className: e.target.value })}
            aria-label="Lọc theo lớp"
            className="h-8.5 px-3 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-medium outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition text-slate-800 shadow-2xs cursor-pointer"
          >
            <option value="all">Tất cả lớp</option>
            {classes?.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => onChange({ status: e.target.value as 'all' | 'assigned' | 'unassigned' })}
            aria-label="Lọc theo trạng thái"
            className="h-8.5 px-3 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-medium outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition text-slate-800 shadow-2xs cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="assigned">Đã phân công</option>
            <option value="unassigned">Chưa phân công</option>
          </select>
        </div>
      </div>
    </div>
  )
}

