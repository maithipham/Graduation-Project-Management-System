import { useState, useMemo } from 'react'
import { Check, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { toast } from '@/shared/components/feedback/toast.store'
import type { DefenseCouncil } from '../types'
import {
  useEligibleStudents,
  useAssignStudentsToCouncil,
  useRemoveStudentAssignment,
} from '../hooks/useDefenseCouncils'

interface AssignStudentsWorkspaceProps {
  semesterId: number | string
  majorId: number | string
  councils: DefenseCouncil[]
  selectedCouncilId: string
  onSelectCouncil: (councilId: string) => void
}

const PAGE_SIZE = 20

export function AssignStudentsWorkspace({
  semesterId,
  majorId,
  councils,
  selectedCouncilId,
  onSelectCouncil,
}: AssignStudentsWorkspaceProps) {
  const [subTab, setSubTab] = useState<'unassigned' | 'assigned'>('unassigned')
  const [page, setPage] = useState<number>(0)
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set())

  const assignStudentsMutation = useAssignStudentsToCouncil()
  const removeAssignmentMutation = useRemoveStudentAssignment()

  const activeCouncil = useMemo(
    () => councils.find((c) => c.publicId === selectedCouncilId) || councils[0],
    [councils, selectedCouncilId],
  )

  const isCouncilAcceptingStudents =
    activeCouncil?.status === 'DRAFT' || activeCouncil?.status === 'PUBLISHED'

  const isAssignedMode = subTab === 'assigned'

  // Query students
  const { data: pageData, isPending: studentsLoading } = useEligibleStudents(
    {
      semesterId,
      majorId,
      assigned: isAssignedMode,
      page,
      size: PAGE_SIZE,
    },
    Boolean(semesterId && majorId),
  )

  const students = pageData?.content || []
  const totalElements = pageData?.totalElements || 0
  const totalPages = pageData?.totalPages || 1

  const handleSubTabChange = (mode: 'unassigned' | 'assigned') => {
    setSubTab(mode)
    setPage(0)
    setSelectedTopicIds(new Set())
  }

  // Check all students on this page
  const isAllPageChecked =
    students.length > 0 && students.every((s) => selectedTopicIds.has(s.thesisTopicPublicId))

  const handleToggleCheckAll = (checked: boolean) => {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev)
      students.forEach((s) => {
        if (checked) {
          next.add(s.thesisTopicPublicId)
        } else {
          next.delete(s.thesisTopicPublicId)
        }
      })
      return next
    })
  }

  const handleToggleStudent = (topicId: string, checked: boolean) => {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(topicId)
      } else {
        next.delete(topicId)
      }
      return next
    })
  }

  const handleAssign = () => {
    if (!activeCouncil || selectedTopicIds.size === 0) return

    if (!isCouncilAcceptingStudents) {
      toast.warning(
        'Chỉ được gán sinh viên vào Hội đồng ở trạng thái Bản nháp (DRAFT) hoặc Đã công bố (PUBLISHED).',
      )
      return
    }

    assignStudentsMutation.mutate(
      {
        councilPublicId: activeCouncil.publicId,
        data: { thesisTopicPublicIds: Array.from(selectedTopicIds) },
      },
      {
        onSuccess: () => {
          setSelectedTopicIds(new Set())
        },
      },
    )
  }

  const handleRemove = (assignmentPublicId?: string, studentName?: string) => {
    if (!activeCouncil || !assignmentPublicId) return
    if (!confirm(`Bạn có chắc muốn gỡ sinh viên "${studentName || 'này'}" khỏi hội đồng?`)) return

    removeAssignmentMutation.mutate({
      councilPublicId: activeCouncil.publicId,
      assignmentPublicId,
    })
  }

  const startIndex = page * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalElements)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* CỘT TRÁI: DANH SÁCH SINH VIÊN (8 CỘT) */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[560px]">
        {/* Sub-tabs + Check all */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 flex-wrap">
          <div className="grid grid-cols-2 bg-slate-200/70 p-1 rounded-xl gap-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSubTabChange('unassigned')}
              className={`h-8 px-4 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${subTab === 'unassigned'
                  ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
            >
              <span>Chưa gán HĐ</span>
            </button>
            <button
              type="button"
              onClick={() => handleSubTabChange('assigned')}
              className={`h-8 px-4 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${subTab === 'assigned'
                  ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
            >
              <span>Đã gán HĐ</span>
            </button>
          </div>

          {!isAssignedMode && (
            <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 hover:text-[#1565C0]">
              <span>Tích tất cả trang này ({students.length} SV)</span>
              <input
                type="checkbox"
                checked={isAllPageChecked}
                onChange={(e) => handleToggleCheckAll(e.target.checked)}
                className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1565C0]"
              />
            </label>
          )}
        </div>

        {/* Student Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[520px]">
          {studentsLoading ? (
            <div className="py-16 text-center text-xs text-slate-400 font-semibold">
              <div className="w-5 h-5 border-2 border-[#1565C0] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Đang tải danh sách sinh viên...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Không có sinh viên nào trong danh sách này.
            </div>
          ) : (
            students.map((s) => {
              const isChecked = selectedTopicIds.has(s.thesisTopicPublicId)

              return (
                <div
                  key={s.thesisTopicPublicId}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${isChecked
                      ? 'border-[#1565C0]/60 bg-blue-50/40 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                >
                  <label
                    htmlFor={`sv-chk-${s.thesisTopicPublicId}`}
                    className="min-w-0 flex-1 select-none cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[13px] text-slate-800">{s.studentName}</span>
                      <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {s.studentCode}
                      </span>
                    </div>
                    <div
                      className="text-xs text-slate-600 mt-1 line-clamp-1"
                      title={s.topicTitle || 'Chưa cập nhật đề tài'}
                    >
                      {s.topicTitle || <span className="italic text-slate-400">Chưa cập nhật đề tài</span>}
                    </div>
                  </label>

                  <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                    {isAssignedMode ? (
                      <div className="flex items-center gap-2">
                        {s.councilName && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-[#1565C0] border border-blue-200">
                            {s.councilName}
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemove(s.assignmentPublicId, s.studentName)}
                          className="h-7 px-2 text-[11.5px] font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 rounded-lg inline-flex items-center gap-1"
                          title="Gỡ khỏi hội đồng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Gỡ HĐ</span>
                        </Button>
                      </div>
                    ) : (
                      <input
                        id={`sv-chk-${s.thesisTopicPublicId}`}
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          handleToggleStudent(s.thesisTopicPublicId, e.target.checked)
                        }
                        className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1565C0]"
                      />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 shrink-0 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-600">
          <div className="font-medium">
            Hiển thị{' '}
            <span className="font-bold text-slate-800">
              {totalElements > 0 ? startIndex + 1 : 0}–{endIndex}
            </span>{' '}
            trong <span className="font-bold text-slate-800">{totalElements}</span> SV
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="h-8 px-2.5 rounded-lg border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
              Trước
            </Button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition cursor-pointer ${i === page
                    ? 'bg-[#1565C0] text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
              >
                {i + 1}
              </button>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="h-8 px-2.5 rounded-lg border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40"
            >
              Sau
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: DANH SÁCH HỘI ĐỒNG (4 CỘT) */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[560px]">
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2 shrink-0">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Danh sách hội đồng
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleAssign}
            disabled={
              !activeCouncil ||
              !isCouncilAcceptingStudents ||
              selectedTopicIds.size === 0 ||
              assignStudentsMutation.isPending
            }
            title={
              !isCouncilAcceptingStudents
                ? `Hội đồng ở trạng thái ${activeCouncil?.status || ''} không được gán sinh viên (chỉ DRAFT hoặc PUBLISHED)`
                : undefined
            }
            className="h-8 px-3 rounded-lg bg-[#1565C0] text-white text-xs font-semibold hover:bg-[#0D47A1] inline-flex items-center gap-1.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Gán ({selectedTopicIds.size} SV)</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[580px]">
          {councils.map((c) => {
            const isSel = c.publicId === activeCouncil?.publicId
            return (
              <div
                key={c.publicId}
                onClick={() => onSelectCouncil(c.publicId)}
                className={`p-3.5 rounded-xl border-2 transition cursor-pointer select-none ${isSel
                    ? 'border-[#1565C0] bg-blue-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-[#1565C0]/60 hover:bg-slate-50/60'
                  }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`font-bold text-sm truncate ${isSel ? 'text-[#0D47A1]' : 'text-slate-800'
                      }`}
                  >
                    {c.code} — {c.name || c.code}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {c.status === 'COMPLETED' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ĐÃ XONG
                      </span>
                    )}
                    {c.status === 'CANCELLED' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        ĐÃ HỦY
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-[#1565C0] border border-sky-200">
                      {c.studentCount} SV
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{c.location || 'Chưa xếp phòng'}</span>
                  <span>•</span>
                  <span>{(c.members || []).length}/5 TV</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
