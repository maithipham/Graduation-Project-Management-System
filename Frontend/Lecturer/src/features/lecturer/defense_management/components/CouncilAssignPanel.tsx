import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeftRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  Filter,
  Loader2,
  RotateCcw,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/components/feedback/toast.store'
import { isApiError } from '@/shared/types'
import { ResizableSplit } from '@/shared/components/ui'
import { examinerReviewService } from '../services/examinerReview.service'
import { examinerReviewKeys } from '../hooks/useExaminerReview'
import type { CouncilExaminerBoard, CouncilMember, CouncilStudentExaminer } from '../types'

interface CouncilAssignPanelProps {
  board: CouncilExaminerBoard
}

interface StudentAssignmentPair {
  gvpb1Id: string
  gvpb2Id: string
}

type AssignmentMap = Record<string, StudentAssignmentPair>

// Tải phản biện của 1 giảng viên: số SV làm GVPB 1 / GVPB 2
interface MemberLoad {
  gvpb1: number
  gvpb2: number
}

const EMPTY_PAIR: StudentAssignmentPair = { gvpb1Id: '', gvpb2Id: '' }

// Phân công đang lưu ở server của 1 sinh viên
function serverPair(s: CouncilStudentExaminer): StudentAssignmentPair {
  return {
    gvpb1Id: s.examiners.find((e) => e.examinerOrder === 1)?.councilMemberPublicId ?? '',
    gvpb2Id: s.examiners.find((e) => e.examinerOrder === 2)?.councilMemberPublicId ?? '',
  }
}

// Giảng viên không được phản biện sinh viên (là GVHD / đồng GVHD)
function isIneligible(sv: CouncilStudentExaminer, m: CouncilMember): boolean {
  return (
    (sv.ineligibleMemberPublicIds ?? []).includes(m.memberPublicId) ||
    m.fullName === sv.supervisorName ||
    m.fullName === sv.coSupervisorName
  )
}

function computeLoads(members: CouncilMember[], assignments: AssignmentMap): Record<string, MemberLoad> {
  const loads: Record<string, MemberLoad> = {}
  members.forEach((m) => {
    loads[m.memberPublicId] = { gvpb1: 0, gvpb2: 0 }
  })
  Object.values(assignments).forEach((pair) => {
    if (pair.gvpb1Id && loads[pair.gvpb1Id]) loads[pair.gvpb1Id].gvpb1++
    if (pair.gvpb2Id && loads[pair.gvpb2Id]) loads[pair.gvpb2Id].gvpb2++
  })
  return loads
}

const totalLoad = (l: MemberLoad | undefined) => (l ? l.gvpb1 + l.gvpb2 : 0)

/**
 * Chọn 2 GVPB cân tải cho 1 sinh viên: ưu tiên người đang phản biện ít SV nhất;
 * trong 2 người được chọn, ai đang làm GVPB 1 ít hơn thì làm GVPB 1 (cân cả vai trò chính).
 * Trả null khi không đủ 2 giảng viên hợp lệ.
 */
function pickPair(
  sv: CouncilStudentExaminer,
  members: CouncilMember[],
  loads: Record<string, MemberLoad>,
): StudentAssignmentPair | null {
  const valid = members
    .filter((m) => !isIneligible(sv, m))
    .sort((a, b) => {
      const diff = totalLoad(loads[a.memberPublicId]) - totalLoad(loads[b.memberPublicId])
      if (diff !== 0) return diff
      return (loads[a.memberPublicId]?.gvpb1 ?? 0) - (loads[b.memberPublicId]?.gvpb1 ?? 0)
    })
  if (valid.length < 2) return null
  let [first, second] = valid
  if ((loads[second.memberPublicId]?.gvpb1 ?? 0) < (loads[first.memberPublicId]?.gvpb1 ?? 0)) {
    ;[first, second] = [second, first]
  }
  return { gvpb1Id: first.memberPublicId, gvpb2Id: second.memberPublicId }
}

const memberLabel = (m: CouncilMember) => `${m.academicTitle ? `${m.academicTitle} ` : ''}${m.fullName}`

export const CouncilAssignPanel: React.FC<CouncilAssignPanelProps> = ({ board }) => {
  const queryClient = useQueryClient()

  // Phân công đang chỉnh trên bảng: defenseAssignmentPublicId -> { gvpb1Id, gvpb2Id }
  const [assignments, setAssignments] = useState<AssignmentMap>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Bộ lọc
  const [statusFilter, setStatusFilter] = useState<'all' | 'unassigned' | 'completed'>('all')
  const [teacherFilterId, setTeacherFilterId] = useState<string>('all')

  // Chọn nhiều dòng để gán nhanh
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkGvpb1, setBulkGvpb1] = useState('')
  const [bulkGvpb2, setBulkGvpb2] = useState('')

  const serverMap = useMemo(() => {
    const map: AssignmentMap = {}
    board.students.forEach((s) => {
      map[s.defenseAssignmentPublicId] = serverPair(s)
    })
    return map
  }, [board.students])

  // Dữ liệu server đổi (tải lại / sau khi lưu) -> đồng bộ lại bảng, bỏ chọn
  useEffect(() => {
    setAssignments(serverMap)
    setSelectedIds(new Set())
  }, [serverMap])

  const canAssign = board.canAssignExaminers
  const editableStudents = useMemo(
    () => board.students.filter((s) => canAssign && s.canAssignExaminers),
    [board.students, canAssign],
  )

  const memberLoads = useMemo(() => computeLoads(board.members, assignments), [board.members, assignments])

  const isComplete = (id: string) => {
    const p = assignments[id]
    return Boolean(p?.gvpb1Id && p?.gvpb2Id)
  }
  const fullyAssignedCount = board.students.filter((s) => isComplete(s.defenseAssignmentPublicId)).length

  // Sinh viên có thay đổi so với server (chỉ SV còn được phân công và đã đủ 2 GVPB mới lưu được)
  const changedStudents = useMemo(
    () =>
      editableStudents.filter((s) => {
        const cur = assignments[s.defenseAssignmentPublicId]
        const orig = serverMap[s.defenseAssignmentPublicId]
        if (!cur || !cur.gvpb1Id || !cur.gvpb2Id) return false
        return cur.gvpb1Id !== orig?.gvpb1Id || cur.gvpb2Id !== orig?.gvpb2Id
      }),
    [editableStudents, assignments, serverMap],
  )
  const changedIds = useMemo(
    () => new Set(changedStudents.map((s) => s.defenseAssignmentPublicId)),
    [changedStudents],
  )
  const hasLocalEdits = board.students.some((s) => {
    const cur = assignments[s.defenseAssignmentPublicId]
    const orig = serverMap[s.defenseAssignmentPublicId]
    return cur && orig && (cur.gvpb1Id !== orig.gvpb1Id || cur.gvpb2Id !== orig.gvpb2Id)
  })

  // Lọc danh sách theo trạng thái và giảng viên đang chọn ở cột phải
  const filteredStudents = useMemo(() => {
    const complete = (id: string) => Boolean(assignments[id]?.gvpb1Id && assignments[id]?.gvpb2Id)
    let result = board.students
    if (teacherFilterId !== 'all') {
      result = result.filter((s) => {
        const p = assignments[s.defenseAssignmentPublicId]
        return p && (p.gvpb1Id === teacherFilterId || p.gvpb2Id === teacherFilterId)
      })
    }
    if (statusFilter === 'unassigned') {
      result = result.filter((s) => !complete(s.defenseAssignmentPublicId))
    } else if (statusFilter === 'completed') {
      result = result.filter((s) => complete(s.defenseAssignmentPublicId))
    }
    return result
  }, [board.students, assignments, teacherFilterId, statusFilter])

  const activeTeacher = teacherFilterId !== 'all'
    ? board.members.find((m) => m.memberPublicId === teacherFilterId)
    : null

  // ----- Chỉnh 1 dòng -----
  const updatePair = (id: string, patch: Partial<StudentAssignmentPair>) => {
    setAssignments((prev) => {
      const cur = prev[id] ?? EMPTY_PAIR
      const next = { ...cur, ...patch }
      // Chọn trùng người ở ô còn lại thì xóa ô kia
      if (patch.gvpb1Id !== undefined && next.gvpb2Id === patch.gvpb1Id) next.gvpb2Id = ''
      if (patch.gvpb2Id !== undefined && next.gvpb1Id === patch.gvpb2Id) next.gvpb1Id = ''
      return { ...prev, [id]: next }
    })
  }

  const handleSwap = (id: string) => {
    setAssignments((prev) => {
      const cur = prev[id] ?? EMPTY_PAIR
      return { ...prev, [id]: { gvpb1Id: cur.gvpb2Id, gvpb2Id: cur.gvpb1Id } }
    })
  }

  // ----- Chọn nhiều dòng -----
  const selectableFiltered = filteredStudents.filter((s) => canAssign && s.canAssignExaminers)
  const allFilteredSelected =
    selectableFiltered.length > 0 && selectableFiltered.every((s) => selectedIds.has(s.defenseAssignmentPublicId))

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      selectableFiltered.forEach((s) =>
        allFilteredSelected ? next.delete(s.defenseAssignmentPublicId) : next.add(s.defenseAssignmentPublicId),
      )
      return next
    })
  }

  // Gán cùng 1 cặp GVPB cho các SV đã chọn (bỏ qua SV mà GV được chọn là GVHD)
  const handleBulkApply = () => {
    if (!bulkGvpb1 && !bulkGvpb2) {
      toast.error('Chọn ít nhất GVPB 1 hoặc GVPB 2 để gán cho các sinh viên đã chọn.')
      return
    }
    if (bulkGvpb1 && bulkGvpb1 === bulkGvpb2) {
      toast.error('GVPB 1 và GVPB 2 không được trùng nhau.')
      return
    }
    const m1 = board.members.find((m) => m.memberPublicId === bulkGvpb1)
    const m2 = board.members.find((m) => m.memberPublicId === bulkGvpb2)
    const skipped: string[] = []
    let applied = 0
    const next = { ...assignments }
    editableStudents.forEach((sv) => {
      if (!selectedIds.has(sv.defenseAssignmentPublicId)) return
      if ((m1 && isIneligible(sv, m1)) || (m2 && isIneligible(sv, m2))) {
        skipped.push(sv.studentName)
        return
      }
      const cur = next[sv.defenseAssignmentPublicId] ?? EMPTY_PAIR
      const pair = { gvpb1Id: bulkGvpb1 || cur.gvpb1Id, gvpb2Id: bulkGvpb2 || cur.gvpb2Id }
      // Chỉ đổi 1 ô mà trùng người ở ô còn lại thì xóa ô còn lại
      if (!bulkGvpb2 && pair.gvpb2Id === pair.gvpb1Id) pair.gvpb2Id = ''
      if (!bulkGvpb1 && pair.gvpb1Id === pair.gvpb2Id) pair.gvpb1Id = ''
      next[sv.defenseAssignmentPublicId] = pair
      applied++
    })
    setAssignments(next)
    if (skipped.length > 0) {
      toast.info(`Bỏ qua ${skipped.length} SV vì giảng viên được chọn là GVHD: ${skipped.join(', ')}`)
    }
    if (applied > 0) {
      toast.info(`Đã gán cho ${applied} sinh viên. Bấm "Lưu phân công" để lưu.`)
    }
    setSelectedIds(new Set())
    setBulkGvpb1('')
    setBulkGvpb2('')
  }

  // ----- Tự động phân bổ -----
  // Có chọn dòng: phân lại các SV đã chọn. Không chọn: chỉ điền SV còn thiếu GVPB, giữ nguyên phân công đã có.
  const handleAutoAssign = () => {
    if (board.members.length < 2) {
      toast.error('Hội đồng phải có ít nhất 2 thành viên để phân công phản biện.')
      return
    }
    const useSelection = selectedIds.size > 0
    const targets = editableStudents.filter((s) =>
      useSelection ? selectedIds.has(s.defenseAssignmentPublicId) : !isComplete(s.defenseAssignmentPublicId),
    )
    if (targets.length === 0) {
      toast.info('Mọi sinh viên đã đủ 2 GVPB. Tích chọn sinh viên nếu muốn phân bổ lại.')
      return
    }

    const next: AssignmentMap = { ...assignments }
    // Tải hiện có tính cả phân công đã giữ lại (bỏ phần sắp phân lại)
    targets.forEach((s) => {
      next[s.defenseAssignmentPublicId] = EMPTY_PAIR
    })
    const loads = computeLoads(board.members, next)

    // SV có ít GV hợp lệ xếp trước để không bị thiếu người
    const ordered = [...targets].sort(
      (a, b) =>
        board.members.filter((m) => !isIneligible(a, m)).length -
        board.members.filter((m) => !isIneligible(b, m)).length,
    )
    const failed: string[] = []
    ordered.forEach((sv) => {
      const pair = pickPair(sv, board.members, loads)
      if (!pair) {
        failed.push(sv.studentName)
        next[sv.defenseAssignmentPublicId] = assignments[sv.defenseAssignmentPublicId] ?? EMPTY_PAIR
        return
      }
      next[sv.defenseAssignmentPublicId] = pair
      loads[pair.gvpb1Id].gvpb1++
      loads[pair.gvpb2Id].gvpb2++
    })

    setAssignments(next)
    setSelectedIds(new Set())
    toast.info(
      `Đã gợi ý GVPB cân tải cho ${targets.length - failed.length} sinh viên. Kiểm tra rồi bấm "Lưu phân công".`,
    )
    if (failed.length > 0) {
      toast.error(`Không đủ 2 giảng viên hợp lệ cho: ${failed.join(', ')}`)
    }
  }

  const handleResetLocal = () => {
    setAssignments(serverMap)
    setSelectedIds(new Set())
  }

  // ----- Lưu 1 lần cho cả bảng -----
  const handleConfirmAndSave = async () => {
    if (changedStudents.length === 0) {
      toast.info('Không có thay đổi phân công nào cần lưu.')
      return
    }
    setIsSubmitting(true)
    try {
      const message = await examinerReviewService.batchAssignExaminers(
        board.councilPublicId,
        changedStudents.map((s) => ({
          defenseAssignmentPublicId: s.defenseAssignmentPublicId,
          councilMemberPublicId1: assignments[s.defenseAssignmentPublicId].gvpb1Id,
          councilMemberPublicId2: assignments[s.defenseAssignmentPublicId].gvpb2Id,
        })),
      )
      toast.success(message || `Đã lưu phân công phản biện cho ${changedStudents.length} sinh viên`)
      await queryClient.invalidateQueries({ queryKey: examinerReviewKeys.board(board.councilPublicId) })
      await queryClient.invalidateQueries({ queryKey: examinerReviewKeys.allAssignments() })
    } catch (err: unknown) {
      toast.error(
        isApiError(err) || err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu phân công',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const incompleteEditable = editableStudents.filter((s) => !isComplete(s.defenseAssignmentPublicId)).length

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-175px)] min-h-[580px]">
      <ResizableSplit
        className="flex-1 overflow-hidden"
        sizedPane="end"
        defaultSize={300}
        minSize={240}
        maxSize={640}
        minOtherSize={520}
        storageKey="lecturer.council-assign"
        startClassName="flex"
        endClassName="flex"
        start={
        /* ===================== CỘT TRÁI: BẢNG PHÂN CÔNG ===================== */
        <div className="flex-1 min-w-0 flex flex-col gap-2.5 overflow-hidden">
          {/* Toolbar: lọc + hành động */}
          <div className="bg-white border border-slate-200/90 rounded-xl px-3 py-2 shadow-2xs flex items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-[11.5px] font-semibold text-slate-500 hidden sm:inline">Lọc:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'unassigned' | 'completed')}
                className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:border-[#1565C0] cursor-pointer"
              >
                <option value="all">Tất cả ({board.students.length})</option>
                <option value="unassigned">Chưa đủ 2 GVPB ({board.students.length - fullyAssignedCount})</option>
                <option value="completed">Đã đủ 2 GVPB ({fullyAssignedCount})</option>
              </select>

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
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {hasLocalEdits && (
                <button
                  type="button"
                  onClick={handleResetLocal}
                  disabled={isSubmitting}
                  className="h-8 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                  title="Bỏ mọi thay đổi chưa lưu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Hoàn tác</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleAutoAssign}
                disabled={!canAssign || isSubmitting}
                className="h-8 px-2.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-[#1565C0] text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                title={
                  selectedIds.size > 0
                    ? 'Phân bổ lại GVPB cân tải cho các sinh viên đã chọn'
                    : 'Điền GVPB cân tải cho các sinh viên còn thiếu, giữ nguyên phân công đã có'
                }
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {selectedIds.size > 0
                    ? `Tự động cho ${selectedIds.size} SV đã chọn`
                    : `Tự động điền${incompleteEditable > 0 ? ` (${incompleteEditable} SV thiếu)` : ''}`}
                </span>
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSave}
                disabled={!canAssign || isSubmitting || changedStudents.length === 0}
                className="h-8 px-3 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] disabled:opacity-50 text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>
                  {isSubmitting
                    ? 'Đang lưu...'
                    : `Lưu phân công${changedStudents.length > 0 ? ` (${changedStudents.length})` : ''}`}
                </span>
              </button>
            </div>
          </div>

          {/* Thanh gán nhanh khi đã chọn dòng */}
          {canAssign && selectedIds.size > 0 && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl px-3 py-2 flex flex-wrap items-center gap-2 shrink-0 text-xs">
              <span className="font-bold text-[#1565C0]">Đã chọn {selectedIds.size} SV — gán nhanh:</span>
              <select
                value={bulkGvpb1}
                onChange={(e) => setBulkGvpb1(e.target.value)}
                className="h-8 px-2 rounded-lg border border-blue-300 bg-white text-[11.5px] font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="">GVPB 1: giữ nguyên</option>
                {board.members.map((m) => (
                  <option key={m.memberPublicId} value={m.memberPublicId}>
                    {memberLabel(m)} ({totalLoad(memberLoads[m.memberPublicId])} SV)
                  </option>
                ))}
              </select>
              <select
                value={bulkGvpb2}
                onChange={(e) => setBulkGvpb2(e.target.value)}
                className="h-8 px-2 rounded-lg border border-purple-300 bg-white text-[11.5px] font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="">GVPB 2: giữ nguyên</option>
                {board.members.map((m) => (
                  <option key={m.memberPublicId} value={m.memberPublicId} disabled={m.memberPublicId === bulkGvpb1}>
                    {memberLabel(m)} ({totalLoad(memberLoads[m.memberPublicId])} SV)
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleBulkApply}
                className="h-8 px-3 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold cursor-pointer"
              >
                Áp dụng
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="h-8 px-2 text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          )}

          {/* Bảng sinh viên */}
          <div className="flex-1 min-h-0 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-2 w-9 text-center">
                      {canAssign && (
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          disabled={selectableFiltered.length === 0}
                          onChange={toggleAllFiltered}
                          title="Chọn tất cả sinh viên đang hiển thị"
                          className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                        />
                      )}
                    </th>
                    <th className="py-3 px-2 w-10 text-center">STT</th>
                    <th className="py-3 px-3.5 min-w-[155px]">Sinh viên</th>
                    <th className="py-3 px-3.5 min-w-[200px]">Đề tài đồ án & GVHD</th>
                    <th className="py-3 px-3.5 min-w-[180px]">GVPB 1 (Chính)</th>
                    <th className="py-3 px-3.5 min-w-[180px]">GVPB 2 (Đồng phản biện)</th>
                    <th className="py-3 px-3 w-32 text-center">Trạng thái</th>
                    <th className="py-3 px-2 w-14 text-center">Đổi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400 italic">
                        Không có sinh viên nào khớp bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((sv, idx) => {
                      const id = sv.defenseAssignmentPublicId
                      const pair = assignments[id] ?? EMPTY_PAIR
                      const rowEditable = canAssign && sv.canAssignExaminers
                      const isFullyAssigned = Boolean(pair.gvpb1Id && pair.gvpb2Id)
                      const isChanged = changedIds.has(id)
                      const hasReviewSchedule = sv.examiners.some((e) => e.reviewDate && e.reviewStartTime)

                      const renderSelect = (slot: 1 | 2) => {
                        const value = slot === 1 ? pair.gvpb1Id : pair.gvpb2Id
                        const otherId = slot === 1 ? pair.gvpb2Id : pair.gvpb1Id
                        const filledClass =
                          slot === 1
                            ? 'border-blue-300 bg-blue-50/50 text-[#1565C0] focus:border-[#1565C0]'
                            : 'border-purple-300 bg-purple-50/50 text-purple-800 focus:border-purple-600'
                        return (
                          <select
                            value={value}
                            disabled={!rowEditable || isSubmitting}
                            onChange={(e) =>
                              updatePair(id, slot === 1 ? { gvpb1Id: e.target.value } : { gvpb2Id: e.target.value })
                            }
                            className={`w-full h-8 px-2 rounded-xl border text-[11.5px] font-bold outline-none cursor-pointer transition disabled:cursor-not-allowed ${
                              value ? filledClass : 'border-amber-300 bg-amber-50/50 text-amber-800 focus:border-amber-500'
                            }`}
                          >
                            <option value="">-- Chọn GVPB {slot} --</option>
                            {board.members.map((m) => {
                              const sup = isIneligible(sv, m)
                              return (
                                <option key={m.memberPublicId} value={m.memberPublicId} disabled={sup}>
                                  {memberLabel(m)}{' '}
                                  {sup
                                    ? '(GVHD)'
                                    : m.memberPublicId === otherId
                                      ? `(đang là GVPB ${slot === 1 ? 2 : 1})`
                                      : `(${totalLoad(memberLoads[m.memberPublicId])} SV)`}
                                </option>
                              )
                            })}
                          </select>
                        )
                      }

                      return (
                        <tr
                          key={id}
                          className={`transition ${
                            selectedIds.has(id)
                              ? 'bg-blue-50/60'
                              : isChanged
                                ? 'bg-amber-50/40'
                                : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="py-3 px-2 text-center">
                            {rowEditable && (
                              <input
                                type="checkbox"
                                checked={selectedIds.has(id)}
                                onChange={() => toggleRow(id)}
                                className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                              />
                            )}
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3.5">
                            <div className="font-extrabold text-slate-900">{sv.studentName}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {sv.studentCode}
                              {sv.className ? ` · ${sv.className}` : ''}
                            </div>
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="font-semibold text-slate-800 line-clamp-2 leading-snug" title={sv.topicName || ''}>
                              {sv.topicName || 'Chưa cập nhật đề tài'}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1">
                              GVHD: <b className="text-slate-700">{sv.supervisorName || '—'}</b>
                            </div>
                          </td>
                          <td className="py-3 px-3.5">{renderSelect(1)}</td>
                          <td className="py-3 px-3.5">{renderSelect(2)}</td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {isChanged ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-800">
                                Chưa lưu
                              </span>
                            ) : isFullyAssigned ? (
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
                              onClick={() => handleSwap(id)}
                              disabled={!rowEditable || isSubmitting || (!pair.gvpb1Id && !pair.gvpb2Id)}
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

            <div className="px-4 py-2 border-t border-slate-200 bg-slate-50/70 text-[11.5px] text-slate-500 flex items-center justify-between shrink-0">
              <span>
                Hiển thị <b>{filteredStudents.length}</b> / {board.students.length} sinh viên
              </span>
              <span>Tích chọn nhiều sinh viên để gán nhanh cùng 1 cặp GVPB</span>
            </div>
          </div>
        </div>
        }
        end={
        /* ===================== CỘT PHẢI: TẢI PHẢN BIỆN CỦA GIẢNG VIÊN ===================== */
        <div className="flex-1 min-w-0 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1565C0] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-[13px] text-slate-900">Tải phản biện</h4>
                <p className="text-[10.5px] text-slate-500">{board.members.length} giảng viên · bấm để lọc</p>
              </div>
            </div>
            {teacherFilterId !== 'all' && (
              <button
                type="button"
                onClick={() => setTeacherFilterId('all')}
                className="text-[11px] font-bold text-[#1565C0] hover:underline cursor-pointer"
              >
                Bỏ lọc
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {(() => {
              const maxLoad = Math.max(1, ...board.members.map((m) => totalLoad(memberLoads[m.memberPublicId])))
              return board.members.map((m) => {
                const isSelected = teacherFilterId === m.memberPublicId
                const load = memberLoads[m.memberPublicId] ?? { gvpb1: 0, gvpb2: 0 }
                const total = load.gvpb1 + load.gvpb2
                return (
                  <div
                    key={m.memberPublicId}
                    onClick={() => setTeacherFilterId(isSelected ? 'all' : m.memberPublicId)}
                    className={`p-3 rounded-xl border transition cursor-pointer select-none ${
                      isSelected
                        ? 'border-[#1565C0] bg-blue-50/70 ring-2 ring-blue-200 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                    title={`Bấm để lọc sinh viên của ${m.fullName}`}
                  >
                    <div className="font-bold text-[13px] text-slate-900 flex items-center justify-between gap-1">
                      <span className="truncate">{memberLabel(m)}</span>
                      <span className="text-[12px] font-extrabold text-[#1565C0] shrink-0">{total} SV</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                      <div className="h-full bg-[#1565C0]" style={{ width: `${(load.gvpb1 / maxLoad) * 100}%` }} />
                      <div className="h-full bg-purple-500" style={{ width: `${(load.gvpb2 / maxLoad) * 100}%` }} />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex gap-3">
                      <span>
                        GVPB 1: <b className="text-[#1565C0]">{load.gvpb1}</b>
                      </span>
                      <span>
                        GVPB 2: <b className="text-purple-700">{load.gvpb2}</b>
                      </span>
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
        }
      />
    </div>
  )
}
