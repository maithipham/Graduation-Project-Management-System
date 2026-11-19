import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeftRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  Filter,
  Loader2,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { examinerReviewService } from '../services/examinerReview.service'
import { examinerReviewKeys } from '../hooks/useExaminerReview'
import type { CouncilExaminerBoard } from '../types'

interface CouncilAssignPanelProps {
  board: CouncilExaminerBoard
}

interface StudentAssignmentPair {
  gvpb1Id: string
  gvpb2Id: string
}

export const CouncilAssignPanel: React.FC<CouncilAssignPanelProps> = ({
  board,
}) => {
  const queryClient = useQueryClient()

  // Local state for assignments: map from defenseAssignmentPublicId -> { gvpb1Id, gvpb2Id }
  const [assignments, setAssignments] = useState<
    Record<string, StudentAssignmentPair>
  >({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filters state
  const [statusFilter, setStatusFilter] = useState<'all' | 'unassigned' | 'completed'>('all')
  const [teacherFilterId, setTeacherFilterId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Sync initial assignments from board.students
  useEffect(() => {
    const map: Record<string, StudentAssignmentPair> = {}
    board.students.forEach((s) => {
      const slot1 = s.examiners.find((e) => e.examinerOrder === 1)
      const slot2 = s.examiners.find((e) => e.examinerOrder === 2)
      map[s.defenseAssignmentPublicId] = {
        gvpb1Id: slot1?.councilMemberPublicId || '',
        gvpb2Id: slot2?.councilMemberPublicId || '',
      }
    })
    setAssignments(map)
  }, [board.students])

  // Compute loads per member based on current local assignments
  const memberLoads = useMemo(() => {
    const loads: Record<string, number> = {}
    board.members.forEach((m) => {
      loads[m.memberPublicId] = 0
    })

    Object.values(assignments).forEach((pair) => {
      if (pair.gvpb1Id && loads[pair.gvpb1Id] !== undefined) {
        loads[pair.gvpb1Id]++
      }
      if (pair.gvpb2Id && loads[pair.gvpb2Id] !== undefined) {
        loads[pair.gvpb2Id]++
      }
    })

    return loads
  }, [board.members, assignments])

  // Count fully assigned students
  const fullyAssignedCount = useMemo(() => {
    return board.students.filter((s) => {
      const pair = assignments[s.defenseAssignmentPublicId]
      return pair && Boolean(pair.gvpb1Id) && Boolean(pair.gvpb2Id)
    }).length
  }, [board.students, assignments])

  // Filter students
  const filteredStudents = useMemo(() => {
    let result = board.students

    // Teacher card filter
    if (teacherFilterId !== 'all') {
      result = result.filter((s) => {
        const pair = assignments[s.defenseAssignmentPublicId]
        return (
          pair &&
          (pair.gvpb1Id === teacherFilterId || pair.gvpb2Id === teacherFilterId)
        )
      })
    }

    // Status filter
    if (statusFilter === 'unassigned') {
      result = result.filter((s) => {
        const pair = assignments[s.defenseAssignmentPublicId]
        return !pair || !pair.gvpb1Id || !pair.gvpb2Id
      })
    } else if (statusFilter === 'completed') {
      result = result.filter((s) => {
        const pair = assignments[s.defenseAssignmentPublicId]
        return pair && Boolean(pair.gvpb1Id) && Boolean(pair.gvpb2Id)
      })
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (s) =>
          s.studentName.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q) ||
          (s.topicName && s.topicName.toLowerCase().includes(q)) ||
          (s.supervisorName && s.supervisorName.toLowerCase().includes(q)),
      )
    }

    return result
  }, [board.students, assignments, teacherFilterId, statusFilter, searchQuery])

  const activeTeacher = useMemo(() => {
    return teacherFilterId !== 'all'
      ? board.members.find((m) => m.memberPublicId === teacherFilterId)
      : null
  }, [board.members, teacherFilterId])

  // Handler: Change GVPB 1
  const handleAssignGvpb1 = (defenseAssignmentPublicId: string, memberId: string) => {
    setAssignments((prev) => {
      const current = prev[defenseAssignmentPublicId] || { gvpb1Id: '', gvpb2Id: '' }
      return {
        ...prev,
        [defenseAssignmentPublicId]: {
          ...current,
          gvpb1Id: memberId,
          // If GVPB 2 had the same member, reset GVPB 2
          gvpb2Id: current.gvpb2Id === memberId ? '' : current.gvpb2Id,
        },
      }
    })
  }

  // Handler: Change GVPB 2
  const handleAssignGvpb2 = (defenseAssignmentPublicId: string, memberId: string) => {
    setAssignments((prev) => {
      const current = prev[defenseAssignmentPublicId] || { gvpb1Id: '', gvpb2Id: '' }
      return {
        ...prev,
        [defenseAssignmentPublicId]: {
          ...current,
          gvpb2Id: memberId,
          // If GVPB 1 had the same member, reset GVPB 1
          gvpb1Id: current.gvpb1Id === memberId ? '' : current.gvpb1Id,
        },
      }
    })
  }

  // Handler: Swap GVPB 1 and GVPB 2
  const handleSwap = (defenseAssignmentPublicId: string) => {
    setAssignments((prev) => {
      const current = prev[defenseAssignmentPublicId] || { gvpb1Id: '', gvpb2Id: '' }
      return {
        ...prev,
        [defenseAssignmentPublicId]: {
          gvpb1Id: current.gvpb2Id,
          gvpb2Id: current.gvpb1Id,
        },
      }
    })
    toast.info('Đã hoán đổi GVPB 1 ↔ GVPB 2')
  }

  // Handler: Auto-assign 2 reviewers evenly
  const handleAutoAssign = () => {
    if (!board.members || board.members.length < 2) {
      toast.error('Hội đồng phải có ít nhất 2 thành viên để phân công phản biện.')
      return
    }

    const newMap: Record<string, StudentAssignmentPair> = { ...assignments }
    const localLoads: Record<string, number> = {}
    board.members.forEach((m) => {
      localLoads[m.memberPublicId] = 0
    })

    board.students.forEach((sv) => {
      // Find members who are not supervisors/co-supervisors
      const ineligible = sv.ineligibleMemberPublicIds || []
      const valid = board.members.filter(
        (m) =>
          !ineligible.includes(m.memberPublicId) &&
          m.fullName !== sv.supervisorName &&
          m.fullName !== sv.coSupervisorName,
      )

      // Sort by load ascending
      valid.sort((a, b) => (localLoads[a.memberPublicId] || 0) - (localLoads[b.memberPublicId] || 0))

      if (valid.length >= 2) {
        newMap[sv.defenseAssignmentPublicId] = {
          gvpb1Id: valid[0].memberPublicId,
          gvpb2Id: valid[1].memberPublicId,
        }
        localLoads[valid[0].memberPublicId] = (localLoads[valid[0].memberPublicId] || 0) + 1
        localLoads[valid[1].memberPublicId] = (localLoads[valid[1].memberPublicId] || 0) + 1
      } else if (valid.length === 1) {
        const remaining = board.members.find((m) => m.memberPublicId !== valid[0].memberPublicId)
        newMap[sv.defenseAssignmentPublicId] = {
          gvpb1Id: valid[0].memberPublicId,
          gvpb2Id: remaining ? remaining.memberPublicId : '',
        }
        localLoads[valid[0].memberPublicId] = (localLoads[valid[0].memberPublicId] || 0) + 1
        if (remaining) {
          localLoads[remaining.memberPublicId] = (localLoads[remaining.memberPublicId] || 0) + 1
        }
      }
    })

    setAssignments(newMap)
    toast.success('Đã tự động phân bổ cân bằng 2 GVPB cho tất cả sinh viên!')
  }

  // Check if anything changed compared to server
  const changedStudents = useMemo(() => {
    return board.students.filter((s) => {
      const current = assignments[s.defenseAssignmentPublicId]
      if (!current || !current.gvpb1Id || !current.gvpb2Id) return false
      const origSlot1 = s.examiners.find((e) => e.examinerOrder === 1)
      const origSlot2 = s.examiners.find((e) => e.examinerOrder === 2)
      return (
        origSlot1?.councilMemberPublicId !== current.gvpb1Id ||
        origSlot2?.councilMemberPublicId !== current.gvpb2Id
      )
    })
  }, [board.students, assignments])

  // Handler: Confirm & Save to backend API
  const handleConfirmAndSave = async () => {
    if (changedStudents.length === 0) {
      toast.info('Không có thay đổi phân công nào mới cần lưu.')
      return
    }

    setIsSubmitting(true)
    try {
      // Save sequentially to avoid race condition or concurrent conflict
      for (const student of changedStudents) {
        const pair = assignments[student.defenseAssignmentPublicId]
        if (pair && pair.gvpb1Id && pair.gvpb2Id) {
          await examinerReviewService.assignExaminers(
            student.defenseAssignmentPublicId,
            {
              councilMemberPublicId1: pair.gvpb1Id,
              councilMemberPublicId2: pair.gvpb2Id,
            },
          )
        }
      }

      toast.success(
        `Đã xác nhận phân công & gửi thông báo cho các GVPB trong ${board.code}!`,
      )
      await queryClient.invalidateQueries({
        queryKey: examinerReviewKeys.board(board.councilPublicId),
      })
      await queryClient.invalidateQueries({
        queryKey: examinerReviewKeys.allAssignments(),
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu phân công'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canAssign = board.canAssignExaminers

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-175px)] min-h-[580px]">
      {/* Main Layout: CỘT BẢNG SINH VIÊN (BÊN TRÁI) + TAB GIÁO VIÊN (BÊN PHẢI) */}
      <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
        {/* ========================================================= */}
        {/* CỘT BÊN TRÁI: BẢNG PHÂN CÔNG SINH VIÊN                    */}
        {/* ========================================================= */}
        <div className="flex-1 min-w-0 flex flex-col gap-2.5 overflow-hidden">
          {/* Filters Toolbar (Gọn gàng 1 dòng: Filter + Search + Action Buttons) */}
          <div className="bg-white border border-slate-200/90 rounded-xl px-3 py-2 shadow-2xs flex items-center justify-between gap-2.5 shrink-0">
            {/* Left: Trạng thái + Lọc GV + Tìm kiếm */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[11.5px] font-semibold text-slate-500 hidden sm:inline">
                  Lọc:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as 'all' | 'unassigned' | 'completed',
                    )
                  }
                  className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:border-[#1565C0] cursor-pointer"
                >
                  <option value="all">Tất cả ({board.students.length})</option>
                  <option value="unassigned">
                    Chưa đủ 2 GVPB ({board.students.length - fullyAssignedCount})
                  </option>
                  <option value="completed">
                    Đã đủ 2 GVPB ({fullyAssignedCount})
                  </option>
                </select>
              </div>

              {activeTeacher && (
                <div
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-[#1565C0] border border-blue-200 text-[11px] font-bold shrink-0 truncate max-w-[200px]"
                  title={`Đang lọc sinh viên của: ${activeTeacher.fullName}`}
                >
                  <Filter className="w-3 h-3 shrink-0" />
                  <span className="truncate">{activeTeacher.fullName}</span>
                  <button
                    type="button"
                    onClick={() => setTeacherFilterId('all')}
                    className="hover:bg-blue-200 rounded p-0.5 text-blue-700 cursor-pointer ml-0.5"
                    title="Xóa lọc"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="relative flex-1 min-w-[110px] max-w-[210px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm SV, đề tài..."
                  className="w-full h-8 pl-7.5 pr-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1565C0] text-xs outline-none transition"
                />
              </div>
            </div>

            {/* Right: Action Buttons (Tự động phân bổ & Xác nhận) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleAutoAssign}
                disabled={!canAssign || isSubmitting}
                className="h-8 px-2.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-[#1565C0] text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Tự động phân bổ</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmAndSave}
                disabled={!canAssign || isSubmitting || changedStudents.length === 0}
                className="h-8 px-3 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] disabled:opacity-50 text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{isSubmitting ? 'Đang lưu...' : 'Xác nhận & Gửi'}</span>
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="flex-1 min-h-0 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-3.5 min-w-[155px]">Sinh viên</th>
                    <th className="py-3 px-3.5 min-w-[200px]">Đề tài đồ án & GVHD</th>
                    <th className="py-3 px-3.5 min-w-[180px]">GVPB 1 (Chính)</th>
                    <th className="py-3 px-3.5 min-w-[180px]">
                      GVPB 2 (Đồng phản biện)
                    </th>
                    <th className="py-3 px-3 w-32 text-center">Trạng thái</th>
                    <th className="py-3 px-2 w-14 text-center">Đổi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-10 text-center text-slate-400 italic"
                      >
                        Không có sinh viên nào khớp bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((sv, idx) => {
                      const pair = assignments[sv.defenseAssignmentPublicId] || {
                        gvpb1Id: '',
                        gvpb2Id: '',
                      }
                      const isFullyAssigned = Boolean(pair.gvpb1Id && pair.gvpb2Id)
                      const ineligible = sv.ineligibleMemberPublicIds || []
                      const hasReviewSchedule = sv.examiners.some(
                        (e) => e.reviewDate && e.reviewStartTime,
                      )

                      return (
                        <tr
                          key={sv.defenseAssignmentPublicId}
                          className="hover:bg-slate-50/70 transition"
                        >
                          <td className="py-3 px-3 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="font-extrabold text-slate-900">
                              {sv.studentName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {sv.studentCode}
                              {sv.className ? ` · ${sv.className}` : ''}
                            </div>
                          </td>
                          <td className="py-3 px-3.5">
                            <div
                              className="font-semibold text-slate-800 line-clamp-2 leading-snug"
                              title={sv.topicName || ''}
                            >
                              {sv.topicName || 'Chưa cập nhật đề tài'}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1">
                              GVHD:{' '}
                              <b className="text-slate-700">
                                {sv.supervisorName || '—'}
                              </b>
                            </div>
                          </td>
                          <td className="py-3 px-3.5">
                            <select
                              value={pair.gvpb1Id}
                              disabled={!canAssign || isSubmitting}
                              onChange={(e) =>
                                handleAssignGvpb1(
                                  sv.defenseAssignmentPublicId,
                                  e.target.value,
                                )
                              }
                              className={`w-full h-8 px-2 rounded-xl border text-[11.5px] font-bold outline-none cursor-pointer transition ${
                                pair.gvpb1Id
                                  ? 'border-blue-300 bg-blue-50/50 text-[#1565C0] focus:border-[#1565C0]'
                                  : 'border-amber-300 bg-amber-50/50 text-amber-800 focus:border-amber-500'
                              }`}
                            >
                              <option value="">-- Chọn GVPB 1 --</option>
                              {board.members.map((m) => {
                                const isSup =
                                  ineligible.includes(m.memberPublicId) ||
                                  m.fullName === sv.supervisorName ||
                                  m.fullName === sv.coSupervisorName
                                const load = memberLoads[m.memberPublicId] || 0
                                return (
                                  <option
                                    key={m.memberPublicId}
                                    value={m.memberPublicId}
                                    disabled={isSup}
                                  >
                                    {m.academicTitle ? `${m.academicTitle} ` : ''}
                                    {m.fullName}{' '}
                                    {isSup ? '(GVHD)' : `(${load} SV)`}
                                  </option>
                                )
                              })}
                            </select>
                          </td>
                          <td className="py-3 px-3.5">
                            <select
                              value={pair.gvpb2Id}
                              disabled={!canAssign || isSubmitting}
                              onChange={(e) =>
                                handleAssignGvpb2(
                                  sv.defenseAssignmentPublicId,
                                  e.target.value,
                                )
                              }
                              className={`w-full h-8 px-2 rounded-xl border text-[11.5px] font-bold outline-none cursor-pointer transition ${
                                pair.gvpb2Id
                                  ? 'border-purple-300 bg-purple-50/50 text-purple-800 focus:border-purple-600'
                                  : 'border-amber-300 bg-amber-50/50 text-amber-800 focus:border-amber-500'
                              }`}
                            >
                              <option value="">-- Chọn GVPB 2 --</option>
                              {board.members.map((m) => {
                                const isSup =
                                  ineligible.includes(m.memberPublicId) ||
                                  m.fullName === sv.supervisorName ||
                                  m.fullName === sv.coSupervisorName
                                const isG1 = pair.gvpb1Id === m.memberPublicId
                                const load = memberLoads[m.memberPublicId] || 0
                                return (
                                  <option
                                    key={m.memberPublicId}
                                    value={m.memberPublicId}
                                    disabled={isSup || isG1}
                                  >
                                    {m.academicTitle ? `${m.academicTitle} ` : ''}
                                    {m.fullName}{' '}
                                    {isSup
                                      ? '(GVHD)'
                                      : isG1
                                        ? '(Đã chọn GVPB1)'
                                        : `(${load} SV)`}
                                  </option>
                                )
                              })}
                            </select>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {isFullyAssigned ? (
                              hasReviewSchedule ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                                  <CalendarCheck className="w-3 h-3" /> Có lịch
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-100 text-[#1565C0]">
                                  <Check className="w-3 h-3" /> Đủ 2 GVPB
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-800">
                                <AlertCircle className="w-3 h-3" /> Chưa đủ
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                handleSwap(sv.defenseAssignmentPublicId)
                              }
                              disabled={
                                !canAssign ||
                                isSubmitting ||
                                (!pair.gvpb1Id && !pair.gvpb2Id)
                              }
                              title="Hoán đổi GVPB 1 ↔ GVPB 2"
                              className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 text-slate-600 inline-flex items-center justify-center transition cursor-pointer"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-4 py-2 border-t border-slate-200 bg-slate-50/70 text-[11.5px] text-slate-500 flex items-center justify-between shrink-0">
              <span>
                Hiển thị <b>{filteredStudents.length}</b> /{' '}
                {board.students.length} sinh viên
              </span>
              <span>
                Bấm vào thẻ Giáo viên ở tab bên cạnh để lọc nhanh danh sách sinh
                viên
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CỘT BÊN PHẢI: TAB GIÁO VIÊN CỐ ĐỊNH Ở BÊN CẠNH             */}
        {/* ========================================================= */}
        <div className="w-[300px] shrink-0 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col overflow-hidden">
          {/* Header Tab Giáo viên */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1565C0] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-[13px] text-slate-900">
                  Tab Giáo viên
                </h4>
                <p className="text-[10.5px] text-slate-500">
                  {board.members.length} giảng viên
                </p>
              </div>
            </div>
            {teacherFilterId !== 'all' ? (
              <button
                type="button"
                onClick={() => setTeacherFilterId('all')}
                className="text-[11px] font-bold text-[#1565C0] hover:underline cursor-pointer"
              >
                Bỏ lọc
              </button>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                Cố định
              </span>
            )}
          </div>

          {/* Danh sách Giáo viên */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {board.members.map((m) => {
              const isSelected = teacherFilterId === m.memberPublicId

              return (
                <div
                  key={m.memberPublicId}
                  onClick={() =>
                    setTeacherFilterId(
                      isSelected ? 'all' : m.memberPublicId,
                    )
                  }
                  className={`p-3 rounded-xl border transition cursor-pointer select-none ${
                    isSelected
                      ? 'border-[#1565C0] bg-blue-50/70 ring-2 ring-blue-200 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                  title={`Bấm để lọc sinh viên của Thầy/Cô ${m.fullName}`}
                >
                  <div className="font-bold text-[13px] text-slate-900 flex items-center justify-between gap-1">
                    <span className="truncate">
                      {m.academicTitle ? `${m.academicTitle} ` : ''}
                      {m.fullName}
                    </span>
                    {isSelected && (
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-extrabold bg-[#1565C0] text-white shrink-0">
                        Đang lọc
                      </span>
                    )}
                  </div>
                  <div className="text-[11.5px] text-slate-600 font-medium truncate mt-1">
                    <span className="text-slate-400 font-normal">Ngành:</span>{' '}
                    {m.departmentName || board.majorName || 'Hệ thống thông tin'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                    <span className="text-slate-400 font-sans font-normal">
                      Email:
                    </span>{' '}
                    {m.teacherCode
                      ? `${m.teacherCode.toLowerCase()}@tlu.edu.vn`
                      : 'gv@tlu.edu.vn'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
