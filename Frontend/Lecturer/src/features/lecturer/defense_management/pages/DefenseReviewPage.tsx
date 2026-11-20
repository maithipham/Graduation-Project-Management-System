import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileEdit,
  FileText,
  Info,
  LayoutGrid,
  List,
  MapPin,
  Search,
  XCircle,
} from 'lucide-react'
import { Skeleton } from '@/shared/components/ui'
import { formatDate } from '@/shared/utils'
import { useLecturerCurrentSemester } from '@/features/lecturer/supervisor_registration'
import { RubricGradingPanel } from '../components/RubricGradingPanel'
import { MeetingLocation } from '../components/MeetingLocation'
import { ScheduleCalendarView } from '../components/ScheduleCalendarView'
import { ScheduleReviewDialog } from '../components/ScheduleReviewDialog'
import { useMyExaminerAssignments } from '../hooks/useExaminerReview'
import type {
  EvaluationSheetStatus,
  ExaminerDecision,
  MyExaminerAssignment,
} from '../types'

function renderDecisionBadge(decision: ExaminerDecision) {
  if (decision === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={12} className="text-emerald-500" />
        Đồng ý
      </span>
    )
  }
  if (decision === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle size={12} className="text-rose-500" />
        Không đồng ý
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
      Chưa quyết định
    </span>
  )
}

function renderSheetStatusBadge(
  status: EvaluationSheetStatus | null,
  score: number | null,
) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
        Chưa chấm
      </span>
    )
  }
  if (status === 'DRAFT') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Bản nháp
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
      Đã nộp ({score !== null ? `${score.toFixed(1)}đ` : '—'})
    </span>
  )
}

export const DefenseReviewPage: React.FC = () => {
  const currentSemesterQuery = useLecturerCurrentSemester()
  const semesterId = currentSemesterQuery.data?.publicId

  const {
    data: assignments,
    isPending,
    isError,
  } = useMyExaminerAssignments(semesterId)

  // Top Tabs: 'grading' (Chấm điểm & Phê duyệt) | 'schedule' (Ca hẹn phản biện)
  const [activeMainTab, setActiveMainTab] = useState<'grading' | 'schedule'>('grading')

  // Grading View Mode: 'split' (Rubric master-detail matching Image 1) | 'table' (Bảng danh sách)
  const [gradingLayoutMode, setGradingLayoutMode] = useState<'split' | 'table'>('split')

  // Left List Filter: 'all' | 'unsubmitted' | 'submitted'
  const [filterStatus, setFilterStatus] = useState<'all' | 'unsubmitted' | 'submitted'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Currently selected assignment for grading in split view
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)

  // Dialog xếp lịch
  const [selectedForSchedule, setSelectedForSchedule] = useState<MyExaminerAssignment | null>(null)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)

  // Statistics
  const totalCount = assignments?.length ?? 0
  const unsubmittedCount = useMemo(() => {
    if (!assignments) return 0
    return assignments.filter((a) => a.sheetStatus !== 'SUBMITTED').length
  }, [assignments])
  const submittedCount = totalCount - unsubmittedCount

  const scheduledCount = useMemo(() => {
    if (!assignments) return 0
    return assignments.filter((a) => a.reviewDate && a.reviewStartTime).length
  }, [assignments])

  // Filtered students
  const filteredAssignments = useMemo(() => {
    if (!assignments) return []
    const q = searchQuery.trim().toLowerCase()

    return assignments.filter((item) => {
      // Lọc trạng thái chấm
      if (filterStatus === 'unsubmitted' && item.sheetStatus === 'SUBMITTED') {
        return false
      }
      if (filterStatus === 'submitted' && item.sheetStatus !== 'SUBMITTED') {
        return false
      }

      // Tìm kiếm từ khóa
      if (!q) return true
      return (
        item.studentName.toLowerCase().includes(q) ||
        item.studentCode.toLowerCase().includes(q) ||
        (item.topicName && item.topicName.toLowerCase().includes(q)) ||
        item.councilCode.toLowerCase().includes(q) ||
        item.councilName.toLowerCase().includes(q)
      )
    })
  }, [assignments, filterStatus, searchQuery])

  // Lấy khung chấm từ phần tử đầu tiên có dữ liệu
  const sampleWithWindow = assignments?.find(
    (a) => a.gradingStartAt && a.gradingCloseAt,
  )
  const gradingWindowText = sampleWithWindow
    ? `Chấm/quyết định từ ${formatDate(sampleWithWindow.gradingStartAt, 'short')} đến trước ${formatDate(sampleWithWindow.gradingCloseAt, 'short')}`
    : 'Theo dõi mốc thời gian phản biện của học kỳ'

  // Auto select first student if none selected or current not in list
  const activeAssignment = useMemo(() => {
    if (!assignments || assignments.length === 0) return null
    if (selectedAssignmentId) {
      const found = assignments.find(
        (a) => a.examinerAssignmentPublicId === selectedAssignmentId,
      )
      if (found) return found
    }
    // Default to first student in filtered or all list
    return filteredAssignments[0] || assignments[0]
  }, [assignments, selectedAssignmentId, filteredAssignments])

  const handleOpenSchedule = (item: MyExaminerAssignment) => {
    setSelectedForSchedule(item)
    setIsScheduleOpen(true)
  }

  return (
    <div className="space-y-4 max-w-[1560px] w-full mx-auto">
      {/* 1. TOP MAIN NAVIGATION TABS matching Image 1 & Image 3 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left 2 Big Tabs */}
        <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-2xl w-fit border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveMainTab('grading')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${activeMainTab === 'grading'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <FileCheck2 className="w-4 h-4 text-blue-600" />
            <span>Chấm điểm & Phê duyệt</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${activeMainTab === 'grading'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-slate-200 text-slate-600'
                }`}
            >
              {unsubmittedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('schedule')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${activeMainTab === 'schedule'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>Ca hẹn phản biện</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${activeMainTab === 'schedule'
                  ? 'bg-blue-50 text-[#1565C0] border border-blue-200'
                  : 'bg-slate-200 text-slate-600'
                }`}
            >
              {scheduledCount}/{totalCount}
            </span>
          </button>
        </div>

        {/* Right Action Button: Link to General Defense Schedule */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="hidden xl:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold shrink-0">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{gradingWindowText}</span>
          </div>

          <Link
            to="/lecturer/defense"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200 bg-white text-[#1565C0] hover:bg-blue-50/60 transition text-xs font-semibold shadow-2xs shrink-0 cursor-pointer"
          >
            <span>Xem Lịch bảo vệ & phản biện tổng hợp</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 2. LOADING STATE */}
      {isPending && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Skeleton className="h-[600px] w-full rounded-2xl" />
          <Skeleton className="h-[600px] w-full md:col-span-2 rounded-2xl" />
        </div>
      )}

      {/* 3. ERROR STATE */}
      {isError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-6 rounded-2xl text-center">
          Không thể tải danh sách phản biện của học kỳ này. Vui lòng kiểm tra lại.
        </div>
      )}

      {/* 4. TAB 1: CHẤM ĐIỂM & PHÊ DUYỆT */}
      {!isPending && !isError && activeMainTab === 'grading' && (
        <div className="space-y-4">
          {/* Sub-toolbar: Switch between Split View and Table View */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 font-medium">
              Hiển thị <strong className="text-slate-800 font-bold">{filteredAssignments.length}</strong> / {totalCount} sinh viên
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setGradingLayoutMode('split')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer select-none ${gradingLayoutMode === 'split'
                    ? 'bg-white text-[#1565C0] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
                title="Giao diện chi tiết chấm Rubric"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Chi tiết Rubric</span>
              </button>

              <button
                type="button"
                onClick={() => setGradingLayoutMode('table')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer select-none ${gradingLayoutMode === 'table'
                    ? 'bg-white text-[#1565C0] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
                title="Bảng danh sách tổng hợp"
              >
                <List className="w-3.5 h-3.5" />
                <span>Bảng danh sách</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: Split View matching Image 1 & 2 */}
          {gradingLayoutMode === 'split' ? (
            <div className="flex flex-col lg:flex-row gap-5 items-start">
              {/* A. LEFT COLUMN: Student List (~360px - 380px) */}
              <div className="w-full lg:w-[360px] xl:w-[390px] shrink-0 bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 flex flex-col space-y-3.5">
                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <button
                    type="button"
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${filterStatus === 'all'
                        ? 'bg-blue-50 text-[#1565C0] border border-blue-200'
                        : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    Tất cả <span className="ml-0.5">{totalCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterStatus('unsubmitted')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${filterStatus === 'unsubmitted'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    Chưa chấm <span className="ml-0.5">{unsubmittedCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterStatus('submitted')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${filterStatus === 'submitted'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    Đã chấm <span className="ml-0.5">{submittedCount}</span>
                  </button>
                </div>

                {/* Quick Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên SV, MSSV, đề tài..."
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] transition"
                  />
                </div>

                {/* Scrollable Student Cards List */}
                <div className="space-y-2.5 overflow-y-auto max-h-[720px] pr-1">
                  {filteredAssignments.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 italic">
                      Không tìm thấy sinh viên nào phù hợp.
                    </div>
                  ) : (
                    filteredAssignments.map((st) => {
                      const isSelected =
                        activeAssignment?.examinerAssignmentPublicId ===
                        st.examinerAssignmentPublicId
                      const isSubmitted = st.sheetStatus === 'SUBMITTED'
                      const isDraft = st.sheetStatus === 'DRAFT'

                      return (
                        <div
                          key={st.examinerAssignmentPublicId}
                          onClick={() =>
                            setSelectedAssignmentId(st.examinerAssignmentPublicId)
                          }
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs relative group select-none ${isSelected
                              ? 'border-[#1565C0] bg-blue-50/25 ring-2 ring-[#1565C0]/20 shadow-xs'
                              : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                            }`}
                        >
                          {/* Name & Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div
                              className={`font-bold text-xs ${isSelected ? 'text-[#1565C0]' : 'text-slate-900'
                                }`}
                            >
                              {st.studentName}
                            </div>

                            {/* Status Badge */}
                            {isSubmitted ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                {st.sheetScore !== null
                                  ? st.sheetScore.toFixed(1)
                                  : 'Đã nộp'}
                              </span>
                            ) : isDraft ? (
                              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                Nháp
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                Chưa chấm
                              </span>
                            )}
                          </div>

                          {/* Code & Council */}
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {st.studentCode} · {st.councilCode}
                          </div>

                          {/* Topic Name */}
                          <div
                            className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-1"
                            title={st.topicName || ''}
                          >
                            {st.topicName || 'Chưa có tên đề tài'}
                          </div>

                          {/* Action button to schedule right from card */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">
                              PB {st.examinerOrder}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenSchedule(st)
                              }}
                              disabled={!st.scheduleOpen || !st.editable}
                              className="text-[#1565C0] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer disabled:text-slate-400 disabled:no-underline"
                            >
                              <Clock className="w-3 h-3" />
                              <span>{st.reviewDate ? 'Đổi lịch của tôi' : 'Xếp lịch của tôi'}</span>
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* B. RIGHT COLUMN: Rubric & Form Panel matching Image 1 & 2 */}
              <div className="flex-1 min-w-0 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
                {activeAssignment ? (
                  <RubricGradingPanel assignment={activeAssignment} />
                ) : (
                  <div className="py-24 text-center text-xs text-slate-400 italic">
                    Vui lòng chọn một sinh viên từ danh sách bên trái để chấm điểm.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VIEW 2: Full Table View with independent schedules */
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                {filteredAssignments.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400 italic">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    Không tìm thấy sinh viên nào phù hợp.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3.5 w-10 text-center">STT</th>
                        <th className="py-3 px-3.5 min-w-[160px]">Sinh viên</th>
                        <th className="py-3 px-3.5 min-w-[200px]">Đề tài</th>
                        <th className="py-3 px-3.5 min-w-[130px]">Hội đồng</th>
                        <th className="py-3 px-3.5 min-w-[170px]">Lịch phản biện của tôi</th>
                        <th className="py-3 px-3.5 min-w-[120px] text-center">Quyết định của tôi</th>
                        <th className="py-3 px-3.5 min-w-[110px] text-center">Phiếu của tôi</th>
                        <th className="py-3 px-3.5 min-w-[180px]">GVPB còn lại</th>
                        <th className="py-3 px-3.5 min-w-[100px] text-center">Kết quả chung</th>
                        <th className="py-3 px-3.5 min-w-[160px] text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAssignments.map((item, idx) => {
                        const hasMySchedule =
                          item.reviewDate &&
                          item.reviewStartTime &&
                          item.reviewEndTime

                        const myScheduleText = hasMySchedule
                          ? `${formatDate(item.reviewDate, 'short')} (${item.reviewStartTime} – ${item.reviewEndTime})`
                          : 'Chưa có lịch'

                        // Co-examiner independent schedule (read-only)
                        const coSchedule = item.coExaminer?.reviewDate && item.coExaminer?.reviewStartTime
                          ? `${formatDate(item.coExaminer.reviewDate, 'short')} (${item.coExaminer.reviewStartTime}${item.coExaminer.reviewEndTime ? `–${item.coExaminer.reviewEndTime}` : ''}) · ${item.coExaminer.reviewLocation || 'Chưa xếp phòng'}`
                          : 'Chưa có lịch'

                        return (
                          <tr
                            key={item.examinerAssignmentPublicId}
                            className="hover:bg-slate-50/70 transition-colors group"
                          >
                            {/* STT */}
                            <td className="py-3 px-3.5 text-center font-medium text-slate-400">
                              {idx + 1}
                            </td>

                            {/* Sinh viên */}
                            <td className="py-3 px-3.5">
                              <div className="font-bold text-slate-900 group-hover:text-[#1565C0] transition-colors">
                                {item.studentName}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                                <span>{item.studentCode}</span>
                                {item.className ? (
                                  <>
                                    <span>·</span>
                                    <span>{item.className}</span>
                                  </>
                                ) : null}
                              </div>
                            </td>

                            {/* Đề tài */}
                            <td className="py-3 px-3.5">
                              <div
                                className="text-slate-800 line-clamp-2 leading-relaxed"
                                title={item.topicName ?? ''}
                              >
                                {item.topicName ?? (
                                  <span className="italic text-slate-400">
                                    Chưa có tên đề tài
                                  </span>
                                )}
                              </div>
                              <div className="mt-1">
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#1565C0] border border-blue-200">
                                  PB {item.examinerOrder}
                                </span>
                              </div>
                            </td>

                            {/* Hội đồng */}
                            <td className="py-3 px-3.5">
                              <div className="font-semibold text-slate-800">
                                {item.councilCode}
                              </div>
                              <div
                                className="text-[11px] text-slate-400 truncate max-w-[140px]"
                                title={item.councilName}
                              >
                                {item.councilName}
                              </div>
                            </td>

                            {/* Lịch phản biện của tôi */}
                            <td className="py-3 px-3.5">
                              {hasMySchedule ? (
                                <div className="space-y-0.5">
                                  <div className="font-medium text-slate-800 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>{myScheduleText}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <MeetingLocation
                                      location={item.reviewLocation}
                                      className="truncate max-w-[150px]"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">
                                  Chưa có lịch
                                </span>
                              )}
                            </td>

                            {/* Quyết định của tôi */}
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              {renderDecisionBadge(item.decision)}
                            </td>

                            {/* Phiếu của tôi */}
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              {renderSheetStatusBadge(
                                item.sheetStatus,
                                item.sheetScore,
                              )}
                            </td>

                            {/* GVPB còn lại (hiển thị CHỈ ĐỌC lịch riêng của họ) */}
                            <td className="py-3 px-3.5">
                              {item.coExaminer ? (
                                <div className="space-y-1">
                                  <div className="font-medium text-slate-800">
                                    {item.coExaminer.academicTitle
                                      ? `${item.coExaminer.academicTitle} `
                                      : ''}
                                    {item.coExaminer.fullName}
                                    <span className="text-slate-400 font-normal text-[11px]">
                                      {' '}(PB {item.coExaminer.examinerOrder})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {renderDecisionBadge(item.coExaminer.decision)}
                                    {item.coExaminer.sheetStatus === 'SUBMITTED' ? (
                                      <span className="text-[10px] font-bold text-emerald-700">
                                        {item.coExaminer.sheetScore !== null
                                          ? `${item.coExaminer.sheetScore.toFixed(1)}đ`
                                          : 'Đã nộp'}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic">
                                        Chưa nộp
                                      </span>
                                    )}
                                  </div>
                                  {/* Lịch riêng của coExaminer (CHỈ ĐỌC) */}
                                  <div
                                    className="text-[10.5px] text-slate-500 flex items-center gap-1 truncate max-w-[170px]"
                                    title={`Lịch riêng của GVPB còn lại: ${coSchedule}`}
                                  >
                                    <Info className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>Lịch: {coSchedule}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">
                                  Chưa phân công
                                </span>
                              )}
                            </td>

                            {/* Kết quả chung */}
                            <td className="py-3 px-3.5 text-center">
                              <div className="font-bold text-slate-900">
                                {item.examinerScore !== null
                                  ? item.examinerScore.toFixed(1)
                                  : '—'}
                              </div>
                              <div className="mt-0.5">
                                {item.examinerPassed === true && (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Đạt PB
                                  </span>
                                )}
                                {item.examinerPassed === false && (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    Không đạt
                                  </span>
                                )}
                                {item.examinerPassed === null && (
                                  <span className="text-[10px] text-slate-400">
                                    Chưa có KQ
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Thao tác */}
                            <td className="py-3 px-3.5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleOpenSchedule(item)}
                                  disabled={!item.scheduleOpen || !item.editable}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                  title={
                                    !item.scheduleOpen
                                      ? 'Ngoài khung thời gian xếp lịch'
                                      : !item.editable
                                        ? 'Đã khóa lịch'
                                        : 'Thiết lập hoặc đổi lịch phản biện của bạn'
                                  }
                                >
                                  Lịch PB
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAssignmentId(item.examinerAssignmentPublicId)
                                    setGradingLayoutMode('split')
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1565C0] text-white hover:bg-[#0D47A1] transition shadow-xs cursor-pointer active:scale-95"
                                >
                                  <FileEdit className="w-3.5 h-3.5" />
                                  <span>Chấm PB</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 2: CA HẸN PHẢN BIỆN (Calendar Timetable matching Image 3) */}
      {!isPending && !isError && activeMainTab === 'schedule' && (
        <ScheduleCalendarView
          assignments={assignments || []}
          onOpenSchedule={handleOpenSchedule}
        />
      )}

      {/* Dialog xếp lịch */}
      {selectedForSchedule && (
        <ScheduleReviewDialog
          open={isScheduleOpen}
          onOpenChange={setIsScheduleOpen}
          assignment={selectedForSchedule}
        />
      )}
    </div>
  )
}

export default DefenseReviewPage
