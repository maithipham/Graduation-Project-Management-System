import { useMemo, useState } from 'react'
import { Award, ArrowLeftRight, Check, ChevronLeft, ChevronRight, Plus, SearchX } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { toast } from '@/shared/components/feedback/toast.store'
import type { DefenseCouncil, EligibleStudent } from '../types'
import {
  useAssignStudentsToCouncil,
  useEligibleStudents,
  useReassignStudents,
} from '../hooks/useDefenseCouncils'

interface AssignStudentsWorkspaceProps {
  semesterId: number | string
  majorId: number | string
  councils: DefenseCouncil[]
  selectedCouncilId: string
  onSelectCouncil: (councilId: string) => void
  onCreateCouncil: () => void
}

const PAGE_SIZE = 20

export function AssignStudentsWorkspace({
  semesterId,
  majorId,
  councils,
  selectedCouncilId,
  onSelectCouncil,
  onCreateCouncil,
}: AssignStudentsWorkspaceProps) {
  const [subTab, setSubTab] = useState<'unassigned' | 'assigned'>('unassigned')
  const [page, setPage] = useState(0)
  // thesisTopicPublicId → sinh viên đã tích (giữ cả object để đổi hội đồng)
  const [selected, setSelected] = useState<Map<string, EligibleStudent>>(new Map())

  const assignMutation = useAssignStudentsToCouncil()
  const reassignMutation = useReassignStudents()

  const activeCouncil = useMemo(
    () => councils.find((c) => c.publicId === selectedCouncilId) || councils[0],
    [councils, selectedCouncilId],
  )

  const isAssignedMode = subTab === 'assigned'
  const enabled = Boolean(semesterId && majorId)

  const { data: pageData, isPending: studentsLoading } = useEligibleStudents(
    { semesterId, majorId, assigned: isAssignedMode, page, size: PAGE_SIZE },
    enabled,
  )
  // Chỉ để lấy số lượng cho tab còn lại
  const { data: otherPage } = useEligibleStudents(
    { semesterId, majorId, assigned: !isAssignedMode, page: 0, size: 1 },
    enabled,
  )

  const students = pageData?.content || []
  const totalElements = pageData?.totalElements || 0
  const totalPages = Math.max(1, pageData?.totalPages || 1)
  const unassignedCount = isAssignedMode ? otherPage?.totalElements ?? 0 : totalElements
  const assignedCount = isAssignedMode ? totalElements : otherPage?.totalElements ?? 0

  const changeSubTab = (mode: 'unassigned' | 'assigned') => {
    setSubTab(mode)
    setPage(0)
    setSelected(new Map())
  }

  const isAllPageChecked =
    students.length > 0 && students.every((s) => selected.has(s.thesisTopicPublicId))

  const toggleAllPage = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Map(prev)
      students.forEach((s) =>
        checked ? next.set(s.thesisTopicPublicId, s) : next.delete(s.thesisTopicPublicId),
      )
      return next
    })
    toast.info(
      checked
        ? `Đã chọn ${students.length} sinh viên ở trang hiện tại.`
        : `Đã bỏ chọn ${students.length} sinh viên ở trang hiện tại.`,
    )
  }

  const toggleStudent = (s: EligibleStudent, checked: boolean) => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (checked) next.set(s.thesisTopicPublicId, s)
      else next.delete(s.thesisTopicPublicId)
      return next
    })
  }

  const findCouncilByName = (name?: string) =>
    name ? councils.find((c) => c.name === name || c.code === name) : undefined

  const handleAssign = () => {
    if (!activeCouncil || selected.size === 0) return
    assignMutation.mutate(
      {
        councilPublicId: activeCouncil.publicId,
        data: { thesisTopicPublicIds: Array.from(selected.keys()) },
      },
      { onSuccess: () => setSelected(new Map()) },
    )
  }

  const handleReassign = () => {
    if (!activeCouncil || selected.size === 0) return
    const items: Array<{
      sourceCouncilPublicId: string
      assignmentPublicId: string
      thesisTopicPublicId: string
    }> = []
    for (const s of selected.values()) {
      const source = findCouncilByName(s.councilName)
      if (source?.publicId === activeCouncil.publicId) continue
      if (!source || !s.assignmentPublicId) {
        toast.warning(`Không xác định được hội đồng hiện tại của sinh viên ${s.studentName}.`)
        return
      }
      items.push({
        sourceCouncilPublicId: source.publicId,
        assignmentPublicId: s.assignmentPublicId,
        thesisTopicPublicId: s.thesisTopicPublicId,
      })
    }
    if (items.length === 0) {
      toast.info(`Các sinh viên đã chọn đã thuộc ${activeCouncil.name || activeCouncil.code}.`)
      return
    }
    reassignMutation.mutate(
      { targetCouncilPublicId: activeCouncil.publicId, items },
      {
        onSuccess: () => {
          toast.success(
            `Đã đổi ${items.length} sinh viên sang hội đồng ${activeCouncil.name || activeCouncil.code} thành công!`,
          )
          setSelected(new Map())
        },
      },
    )
  }

  if (councils.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Award className="w-6 h-6" />
        </div>
        <h3 className="text-[15px] font-bold text-slate-800">Chưa có hội đồng để gán sinh viên</h3>
        <p className="text-[13px] text-slate-500 mt-1 mb-4">
          Hãy tạo ít nhất 1 hội đồng ở tab Danh sách hội đồng trước khi gán sinh viên.
        </p>
        <Button
          type="button"
          onClick={onCreateCouncil}
          className="h-9 px-4 rounded-lg bg-[#1565C0] text-white text-[13px] font-semibold hover:bg-[#0D47A1] inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Tạo hội đồng ngay
        </Button>
      </div>
    )
  }

  const startIndex = page * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalElements)

  const subTabBtn = (value: 'unassigned' | 'assigned', label: string, count: number) => (
    <button
      type="button"
      onClick={() => changeSubTab(value)}
      className={`h-8 px-4 rounded-lg text-[12.5px] inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
        subTab === value
          ? 'bg-white text-[#1565C0] font-bold shadow-xs'
          : 'text-slate-600 hover:text-slate-900 font-medium'
      }`}
    >
      <span>{label}</span>
      <span
        className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
          subTab === value ? 'bg-blue-50 text-[#1565C0]' : 'bg-slate-100 text-slate-600'
        }`}
      >
        {count}
      </span>
    </button>
  )

  const isBusy = assignMutation.isPending || reassignMutation.isPending

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* TRÁI: DANH SÁCH SINH VIÊN */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-190px)] min-h-[520px]">
        <div className="p-3 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="inline-flex bg-slate-200/60 p-1 rounded-xl gap-1">
              {subTabBtn('unassigned', 'Chưa gán HĐ', unassignedCount)}
              {subTabBtn('assigned', 'Đã gán HĐ', assignedCount)}
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer select-none font-semibold text-[12.5px] text-slate-700 hover:text-[#1565C0] shrink-0 mr-[13px]">
              <span>Tích tất cả trang này ({students.length} SV)</span>
              <input
                type="checkbox"
                checked={isAllPageChecked}
                onChange={(e) => toggleAllPage(e.target.checked)}
                className="w-4 h-4 cursor-pointer rounded border-slate-300 accent-[#1565C0]"
              />
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {studentsLoading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
          ) : students.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-500 text-[13px]">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                <SearchX className="w-5 h-5" />
              </div>
              {isAssignedMode
                ? 'Chưa có sinh viên nào được gán vào hội đồng.'
                : 'Không tìm thấy sinh viên phù hợp bộ lọc.'}
            </div>
          ) : (
            students.map((s) => {
              const isChecked = selected.has(s.thesisTopicPublicId)
              const chkId = `sv-chk-${s.thesisTopicPublicId}`
              return (
                <div
                  key={s.thesisTopicPublicId}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                    isChecked
                      ? 'border-[#1565C0]/60 bg-blue-50/40 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <label htmlFor={chkId} className="min-w-0 flex-1 select-none cursor-pointer">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[13px] text-slate-800 truncate">{s.studentName}</span>
                      <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                        {s.studentCode}
                      </span>
                    </div>
                    <div
                      className="text-[12px] text-slate-600 mt-0.5 truncate"
                      title={s.topicTitle || 'Chưa cập nhật đề tài'}
                    >
                      {s.topicTitle || <span className="italic text-slate-400">Chưa cập nhật đề tài</span>}
                    </div>
                  </label>

                  <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                    {isAssignedMode && s.councilName && (
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-[#1565C0] border border-blue-200 shrink-0">
                        HĐ: {s.councilName}
                      </span>
                    )}
                    <input
                      id={chkId}
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => toggleStudent(s, e.target.checked)}
                      title={
                        isAssignedMode
                          ? isChecked
                            ? 'Bỏ chọn'
                            : 'Tích chọn để đổi hội đồng'
                          : isChecked
                            ? 'Bỏ tích khỏi danh sách chọn'
                            : 'Tích để chọn vào hội đồng'
                      }
                      className="w-4 h-4 shrink-0 cursor-pointer accent-[#1565C0]"
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Phân trang */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 shrink-0 flex items-center justify-between flex-wrap gap-2 text-[12px] text-slate-600">
          <div className="font-medium">
            Hiển thị{' '}
            <span className="font-bold text-slate-800">
              {totalElements > 0 ? startIndex + 1 : 0}–{endIndex}
            </span>{' '}
            trong <span className="font-bold text-slate-800">{totalElements}</span> SV
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[12px] font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Trước
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                className={`h-8 min-w-[32px] px-2 rounded-lg text-[12px] font-bold transition cursor-pointer ${
                  i === page
                    ? 'bg-[#1565C0] text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[12px] font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
            >
              Sau <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* PHẢI: DANH SÁCH HỘI ĐỒNG */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-190px)] min-h-[520px]">
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2 shrink-0">
          <div className="text-[13.5px] font-bold text-slate-800 truncate">Danh sách hội đồng</div>
          {isAssignedMode ? (
            <Button
              type="button"
              onClick={handleReassign}
              disabled={selected.size === 0 || isBusy}
              title={
                selected.size > 0
                  ? `Đổi các sinh viên đã chọn sang ${activeCouncil?.name || activeCouncil?.code}`
                  : 'Tích chọn sinh viên ở danh sách bên trái để đổi hội đồng'
              }
              className="h-9 px-4 rounded-lg bg-[#1565C0] text-white text-[12.5px] font-semibold hover:bg-[#0D47A1] shadow-sm inline-flex items-center gap-1.5 shrink-0"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>
                {reassignMutation.isPending
                  ? 'Đang lưu...'
                  : `Đổi HĐ${selected.size > 0 ? ` (${selected.size} SV)` : ''}`}
              </span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleAssign}
              disabled={selected.size === 0 || isBusy}
              className="h-9 px-4 rounded-lg bg-[#1565C0] text-white text-[12.5px] font-semibold hover:bg-[#0D47A1] shadow-sm inline-flex items-center gap-1.5 shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>{assignMutation.isPending ? 'Đang lưu...' : `Gán (${selected.size} SV)`}</span>
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {councils.map((c) => {
            const isSel = c.publicId === activeCouncil?.publicId
            return (
              <button
                key={c.publicId}
                type="button"
                onClick={() => onSelectCouncil(c.publicId)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition cursor-pointer select-none flex items-center justify-between gap-2 ${
                  isSel
                    ? 'border-[#1565C0] bg-blue-50/40 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-[#1565C0]/60 hover:bg-slate-50/60'
                }`}
              >
                <span
                  className={`font-bold text-[13.5px] truncate ${isSel ? 'text-[#0D47A1]' : 'text-slate-800'}`}
                >
                  {c.name || c.code}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
                    c.studentCount > 0
                      ? 'bg-sky-50 text-[#1565C0] border-sky-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {c.studentCount} SV
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
