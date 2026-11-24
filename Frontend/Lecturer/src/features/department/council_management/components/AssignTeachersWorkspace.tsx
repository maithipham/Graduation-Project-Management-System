import { useMemo, useState } from 'react'
import { Check, Plus, Search, SearchX, Users } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ResizableSplit } from '@/shared/components/ui/resizable-split'
import { toast } from '@/shared/components/feedback/toast.store'
import type { CandidateTeacher, DefenseCouncil } from '../types'
import { useCandidateTeachers, useUpdateCouncilMembers } from '../hooks/useDefenseCouncils'
import {
  MEMBER_SLOT_KEYS,
  findSlotOf,
  getMemberCount,
  membersToSlots,
  slotLabel,
  slotsToPayload,
  type MemberSlotKey,
  type MemberSlots,
} from '../utils/councilFormatters'
import {
  TEACHER_SCOPE_OPTIONS,
  matchTeacherScope,
  teacherScopeOrder,
  type TeacherScopeFilter,
} from '../utils/teacherScope'
import { ReplaceMemberDrawer } from './ReplaceMemberDrawer'
import { ReplaceWhenFullDialog } from './ReplaceWhenFullDialog'

interface AssignTeachersWorkspaceProps {
  semesterId: number | string
  majorId: number | string
  councils: DefenseCouncil[]
  selectedCouncilId: string
  onSelectCouncil: (councilId: string) => void
  onCreateCouncil: () => void
}

/** Bản nháp: 5 vị trí + các GV đã tích nhưng chưa chọn vai trò */
interface MemberDraft {
  key: string
  slots: MemberSlots
  pending: number[]
}

type RoleKey = 'chair' | 'secretary' | 'member'

const ROLE_BUTTONS: Array<{ role: RoleKey; label: string; active: string; idle: string; title: string }> = [
  {
    role: 'chair',
    label: 'Chủ tịch',
    active: 'bg-[#1565C0] text-white font-bold shadow-xs',
    idle: 'text-slate-600 hover:text-[#1565C0] hover:bg-white font-medium',
    title: 'Chọn làm Chủ tịch hội đồng',
  },
  {
    role: 'secretary',
    label: 'Thư ký',
    active: 'bg-purple-600 text-white font-bold shadow-xs',
    idle: 'text-slate-600 hover:text-purple-700 hover:bg-white font-medium',
    title: 'Chọn làm Thư ký hội đồng',
  },
  {
    role: 'member',
    label: 'Ủy viên',
    active: 'bg-emerald-600 text-white font-bold shadow-xs',
    idle: 'text-slate-600 hover:text-emerald-700 hover:bg-white font-medium',
    title: 'Chọn làm Ủy viên hội đồng',
  },
]

function councilKey(c?: DefenseCouncil) {
  if (!c) return ''
  const sig = (c.members || [])
    .map((m) => `${m.teacherId}:${m.role}`)
    .sort()
    .join(',')
  return `${c.publicId}|${sig}`
}

function slotToRoleKey(slot: MemberSlotKey | null): RoleKey | null {
  if (!slot) return null
  if (slot === 'chair') return 'chair'
  if (slot === 'secretary') return 'secretary'
  return 'member'
}

function draftCount(d: MemberDraft) {
  return MEMBER_SLOT_KEYS.filter((k) => d.slots[k] !== null).length + d.pending.length
}

export function AssignTeachersWorkspace({
  semesterId,
  majorId,
  councils,
  selectedCouncilId,
  onSelectCouncil,
  onCreateCouncil,
}: AssignTeachersWorkspaceProps) {
  const [subTab, setSubTab] = useState<'unassigned' | 'assigned'>('unassigned')
  const [scope, setScope] = useState<TeacherScopeFilter>('ALL')
  const [search, setSearch] = useState('')
  const [draftState, setDraftState] = useState<MemberDraft | null>(null)
  const [replaceTarget, setReplaceTarget] = useState<MemberSlotKey | null>(null)
  const [incomingTeacher, setIncomingTeacher] = useState<CandidateTeacher | null>(null)

  const updateMembersMutation = useUpdateCouncilMembers()

  const activeCouncil = useMemo(
    () => councils.find((c) => c.publicId === selectedCouncilId) || councils[0],
    [councils, selectedCouncilId],
  )
  const isPublished = activeCouncil?.status === 'PUBLISHED'

  // Bản nháp gắn với hội đồng + thành viên đã lưu; khi đổi hội đồng hoặc lưu xong thì làm mới
  const activeKey = councilKey(activeCouncil)
  const draft: MemberDraft =
    draftState && draftState.key === activeKey
      ? draftState
      : { key: activeKey, slots: membersToSlots(activeCouncil?.members), pending: [] }

  const { data: teachers = [], isPending: teachersLoading } = useCandidateTeachers(
    { semesterId, majorId, scope: 'ALL', assignedOnly: false },
    Boolean(semesterId && majorId),
  )

  // teacherId → tên hội đồng đang tham gia (trong kỳ hiện tại)
  const busyMap = useMemo(() => {
    const map = new Map<number, string>()
    councils.forEach((c) =>
      (c.members || []).forEach((m) => map.set(m.teacherId, c.name || c.code)),
    )
    teachers.forEach((t) => {
      if (t.assignedCouncilName && !map.has(t.teacherId)) map.set(t.teacherId, t.assignedCouncilName)
    })
    return map
  }, [councils, teachers])

  const savedCouncilMemberCount = activeCouncil ? getMemberCount(activeCouncil) : 0
  const savedSlots = membersToSlots(activeCouncil?.members)
  const hasChanges =
    draft.pending.length > 0 || MEMBER_SLOT_KEYS.some((k) => draft.slots[k] !== savedSlots[k])
  const currentDraftCount = draftCount(draft)

  // GV đang thuộc hội đồng KHÁC (không phải hội đồng đang chọn) → hiện nhãn "HĐ: ..."
  // Lịch bảo vệ dùng chung giữa các hội đồng nên không kiểm tra trùng lịch
  const otherCouncilMap = useMemo(() => {
    const map = new Map<number, { publicId: string; name: string }>()
    if (!activeCouncil) return map
    councils.forEach((c) => {
      if (c.publicId === activeCouncil.publicId) return
      ;(c.members || []).forEach((m) => {
        if (!map.has(m.teacherId)) map.set(m.teacherId, { publicId: c.publicId, name: c.name || c.code })
      })
    })
    return map
  }, [councils, activeCouncil])

  // Danh sách GV chưa gán vào hội đồng ĐANG CHỌN (lọc + đếm)
  const q = search.trim().toLowerCase()
  const activeMemberIds = new Set((activeCouncil?.members || []).map((m) => m.teacherId))
  const unassignedTeachers = teachers.filter((t) => !activeMemberIds.has(t.teacherId))
  const searched = unassignedTeachers.filter(
    (t) =>
      !q ||
      t.fullName.toLowerCase().includes(q) ||
      (t.departmentName || '').toLowerCase().includes(q),
  )
  const scopeCounts: Record<TeacherScopeFilter, number> = {
    ALL: searched.length,
    IN_MAJOR: searched.filter((t) => t.scope === 'IN_MAJOR').length,
    OUT_MAJOR: searched.filter((t) => t.scope === 'OUT_MAJOR').length,
    EXTERNAL: searched.filter((t) => t.scope === 'EXTERNAL').length,
  }
  const visibleTeachers = searched
    .filter((t) => matchTeacherScope(t, scope))
    .sort(
      (a, b) =>
        teacherScopeOrder(a) - teacherScopeOrder(b) || a.fullName.localeCompare(b.fullName, 'vi'),
    )
  const assignedTeacherCount = savedCouncilMemberCount

  const top5 = visibleTeachers.slice(0, 5)
  const isInDraft = (id: number) => findSlotOf(draft.slots, id) !== null || draft.pending.includes(id)
  const isTop5Checked = top5.length > 0 && top5.every((t) => isInDraft(t.teacherId))

  const updateDraft = (fn: (d: MemberDraft) => MemberDraft) => setDraftState(fn(draft))

  const saveSlots = (slots: MemberSlots, onDone?: () => void) => {
    if (!activeCouncil) return
    updateMembersMutation.mutate(
      { councilPublicId: activeCouncil.publicId, data: { members: slotsToPayload(slots) } },
      { onSuccess: () => onDone?.() },
    )
  }

  // ---- Tab Chưa gán: tích chọn / chọn vai trò ----
  const handleToggle = (t: CandidateTeacher, checked: boolean) => {
    if (checked) {
      if (isInDraft(t.teacherId)) return
      if (currentDraftCount >= 5 || savedCouncilMemberCount >= 5) {
        if (savedCouncilMemberCount >= 5) setIncomingTeacher(t)
        else toast.warning('Hội đồng đã chọn đủ 5/5 thành viên. Vui lòng bỏ tích bớt trước khi chọn thêm!')
        return
      }
      updateDraft((d) => ({ ...d, pending: [...d.pending, t.teacherId] }))
    } else {
      updateDraft((d) => {
        const slots = { ...d.slots }
        const slot = findSlotOf(slots, t.teacherId)
        if (slot) slots[slot] = null
        return { ...d, slots, pending: d.pending.filter((id) => id !== t.teacherId) }
      })
    }
  }

  const handleSetRole = (t: CandidateTeacher, role: RoleKey) => {
    const id = t.teacherId
    const existingSlot = findSlotOf(draft.slots, id)
    const alreadyChecked = existingSlot !== null || draft.pending.includes(id)

    if (!alreadyChecked && currentDraftCount >= 5) {
      if (savedCouncilMemberCount >= 5) setIncomingTeacher(t)
      else toast.warning('Hội đồng đã chọn đủ 5/5 thành viên. Vui lòng bỏ tích bớt thành viên trước khi chọn thêm!')
      return
    }
    if (slotToRoleKey(existingSlot) === role) return

    const slots = { ...draft.slots }
    let pending = draft.pending.filter((p) => p !== id)

    if (role === 'chair' || role === 'secretary') {
      const target: MemberSlotKey = role === 'chair' ? 'chair' : 'secretary'
      const prev = slots[target]
      if (existingSlot) slots[existingSlot] = null
      // Người đang giữ vai trò này chuyển về trạng thái "đã tích, chưa chọn vai trò"
      if (prev !== null && prev !== id) pending = [...pending, prev]
      slots[target] = id
    } else {
      const emptyMember = (['m1', 'm2', 'm3'] as MemberSlotKey[]).find((k) => slots[k] === null)
      if (!emptyMember) {
        toast.warning(
          'Hội đồng đã chọn đủ tối đa 3/3 Ủy viên! Hãy chọn Chủ tịch/Thư ký còn trống hoặc bỏ tích bớt Ủy viên.',
        )
        return
      }
      if (existingSlot) slots[existingSlot] = null
      slots[emptyMember] = id
    }
    setDraftState({ ...draft, slots, pending })
  }

  const handleToggleTop5 = (checked: boolean) => {
    if (checked) {
      const free = 5 - currentDraftCount
      const toAdd = top5.filter((t) => !isInDraft(t.teacherId)).slice(0, Math.max(0, free))
      if (toAdd.length === 0) {
        toast.warning('Hội đồng đã chọn đủ 5/5 thành viên.')
        return
      }
      updateDraft((d) => ({ ...d, pending: [...d.pending, ...toAdd.map((t) => t.teacherId)] }))
      toast.info(`Đã tích chọn ${toAdd.length} giảng viên đầu danh sách vào hội đồng.`)
    } else {
      const ids = new Set(top5.map((t) => t.teacherId))
      updateDraft((d) => {
        const slots = { ...d.slots }
        MEMBER_SLOT_KEYS.forEach((k) => {
          if (slots[k] !== null && ids.has(slots[k]!) && savedSlots[k] !== slots[k]) slots[k] = null
        })
        return { ...d, slots, pending: d.pending.filter((id) => !ids.has(id)) }
      })
      toast.info('Đã bỏ chọn các giảng viên.')
    }
  }

  const handleConfirmAssign = () => {
    if (!activeCouncil) return
    if (draft.pending.length > 0) {
      toast.warning(
        'Vui lòng chọn vai trò (Chủ tịch / Thư ký / Ủy viên) cho tất cả giảng viên đã tích trước khi gán!',
      )
      return
    }
    const filled = MEMBER_SLOT_KEYS.filter((k) => draft.slots[k] !== null).length
    if (isPublished && filled !== 5) {
      toast.warning(
        'Hội đồng đã công bố chỉ được thay thế thành viên, phải đủ 5 người (1 Chủ tịch, 1 Thư ký, 3 Ủy viên).',
      )
      return
    }
    saveSlots(draft.slots, () => setDraftState(null))
  }

  // ---- Tab Đã gán: đổi vai trò / thay thế ----
  const handleChangeRole = (fromSlot: MemberSlotKey, target: RoleKey) => {
    const slots = { ...savedSlots }
    const id = slots[fromSlot]
    if (id === null || slotToRoleKey(fromSlot) === target) return

    if (target === 'chair' || target === 'secretary') {
      const targetSlot: MemberSlotKey = target
      const prev = slots[targetSlot]
      slots[targetSlot] = id
      slots[fromSlot] = prev
    } else {
      const emptyMember = (['m1', 'm2', 'm3'] as MemberSlotKey[]).find((k) => slots[k] === null)
      if (emptyMember) {
        slots[emptyMember] = id
        slots[fromSlot] = null
      } else {
        const prev = slots.m1
        slots.m1 = id
        slots[fromSlot] = prev
      }
    }
    if (isPublished && MEMBER_SLOT_KEYS.some((k) => slots[k] === null)) {
      toast.warning('Hội đồng đã công bố không được để trống vị trí nào.')
      return
    }
    saveSlots(slots)
  }

  const memberById = new Map((activeCouncil?.members || []).map((m) => [m.teacherId, m]))

  if (councils.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="text-[15px] font-bold text-slate-800">Chưa có hội đồng nào trong kỳ này</h3>
        <p className="text-[13px] text-slate-500 mt-1 mb-4">Vui lòng tạo hội đồng trước khi gán giảng viên.</p>
        <Button
          type="button"
          onClick={onCreateCouncil}
          className="h-9 px-4 rounded-lg bg-[#1565C0] text-white text-[13px] font-semibold hover:bg-[#0D47A1] inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Tạo hội đồng mới
        </Button>
      </div>
    )
  }

  const subTabBtn = (value: 'unassigned' | 'assigned', label: string, count: number) => (
    <button
      type="button"
      onClick={() => setSubTab(value)}
      className={`h-8 rounded-lg text-[12.5px] inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
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

  return (
    <>
    <ResizableSplit
      className="lg:items-start"
      stackBelowLg
      sizedPane="end"
      defaultSize={380}
      minSize={300}
      maxSize={760}
      minOtherSize={520}
      storageKey="department.assign-teachers"
      startClassName="flex"
      endClassName="flex"
      start={
      /* TRÁI: DANH SÁCH GIẢNG VIÊN */
      <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-190px)] min-h-[520px]">
        <div className="p-3 border-b border-slate-200 bg-slate-50/70 shrink-0 space-y-2.5">
          <div className="grid grid-cols-2 bg-slate-200/60 p-1 rounded-xl gap-1">
            {subTabBtn('unassigned', 'Chưa gán HĐ', unassignedTeachers.length)}
            {subTabBtn('assigned', 'Đã gán HĐ', assignedTeacherCount)}
          </div>

          {subTab === 'unassigned' && (
            <div className="flex items-center gap-3 pt-0.5 flex-wrap">
              <div className="inline-flex rounded-lg bg-slate-200/70 p-1 gap-1 text-[12px] font-semibold shrink-0 flex-wrap">
                {TEACHER_SCOPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setScope(opt.value)}
                    className={`h-7 px-2.5 rounded-md inline-flex items-center gap-1.5 transition cursor-pointer ${
                      scope === opt.value
                        ? 'bg-white text-[#1565C0] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[11px] opacity-75">({scopeCounts[opt.value]})</span>
                  </button>
                ))}
              </div>

              <div className="relative flex-1 min-w-[120px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm giảng viên..."
                  aria-label="Tìm giảng viên"
                  className="w-full h-8 pl-8 pr-2.5 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-[#1565C0] bg-white transition"
                />
              </div>

              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none font-semibold text-[12px] text-slate-700 hover:text-[#1565C0] shrink-0 mr-[13px]">
                <span>Tích tất cả</span>
                <input
                  type="checkbox"
                  checked={isTop5Checked}
                  onChange={(e) => handleToggleTop5(e.target.checked)}
                  className="w-4 h-4 cursor-pointer rounded border-slate-300 accent-[#1565C0]"
                />
              </label>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {subTab === 'assigned' ? (
            <div className="p-0.5 space-y-2">
              {MEMBER_SLOT_KEYS.map((slot) => {
                const id = savedSlots[slot]
                const m = id !== null ? memberById.get(id) : undefined
                if (id === null) {
                  return (
                    <div
                      key={slot}
                      className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3"
                    >
                      <span className="text-[12.5px] font-medium text-slate-500">
                        {slotLabel(slot)} (còn trống)
                      </span>
                      <button
                        type="button"
                        onClick={() => setSubTab('unassigned')}
                        title={`Gán giảng viên vào vị trí ${slotLabel(slot)}`}
                        className="h-8 px-3.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1565C0] border border-blue-200 text-[12px] font-bold transition cursor-pointer shrink-0"
                      >
                        Gán
                      </button>
                    </div>
                  )
                }
                return (
                  <div
                    key={slot}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 transition flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1 select-none">
                      <div className="font-bold text-[13px] text-slate-800 truncate">
                        {m?.fullName || `Giảng viên #${id}`}
                      </div>
                      <div className="text-[11.5px] text-slate-500 truncate">{m?.departmentName}</div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <select
                        value={slotToRoleKey(slot) ?? 'member'}
                        disabled={updateMembersMutation.isPending}
                        onChange={(e) => handleChangeRole(slot, e.target.value as RoleKey)}
                        aria-label={`Vai trò của ${m?.fullName || 'giảng viên'}`}
                        title="Thay đổi vai trò trong hội đồng"
                        className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:border-[#1565C0] text-[12px] font-semibold text-slate-700 outline-none cursor-pointer transition shadow-2xs"
                      >
                        <option value="chair">Chủ tịch</option>
                        <option value="secretary">Thư ký</option>
                        <option value="member">Ủy viên</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setReplaceTarget(slot)}
                        title="Thay thế giảng viên này trong hội đồng"
                        className="h-8 px-3.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1565C0] border border-blue-200 text-[12px] font-bold transition cursor-pointer shrink-0"
                      >
                        Thay thế
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : teachersLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
          ) : visibleTeachers.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-500 text-[13px]">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                <SearchX className="w-5 h-5" />
              </div>
              Không tìm thấy giảng viên phù hợp bộ lọc.
            </div>
          ) : (
            visibleTeachers.map((t) => {
              const slot = findSlotOf(draft.slots, t.teacherId)
              const assignedRole = slotToRoleKey(slot)
              const isChecked = slot !== null || draft.pending.includes(t.teacherId)
              const chkId = `lec-chk-${t.teacherId}`
              const other = otherCouncilMap.get(t.teacherId)

              return (
                <div
                  key={t.teacherId}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap ${
                    isChecked
                      ? 'border-[#1565C0]/60 bg-blue-50/40 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <label htmlFor={chkId} className="min-w-0 flex-1 select-none cursor-pointer">
                    <div className="flex items-center gap-1.5 min-w-0 flex-nowrap">
                      <span className="font-bold text-[13px] text-slate-800 shrink-0">{t.fullName}</span>
                      {t.departmentName && (
                        <>
                          <span className="text-slate-300 shrink-0">·</span>
                          <span
                            className="text-[12px] text-slate-600 font-medium truncate"
                            title={t.scope === 'EXTERNAL' ? `Trường / Đơn vị: ${t.departmentName}` : `Bộ môn: ${t.departmentName}`}
                          >
                            {t.departmentName}
                          </span>
                        </>
                      )}
                    </div>
                    {other && (
                      <div className="flex items-center gap-1.5 flex-wrap text-[11.5px] mt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            onSelectCouncil(other.publicId)
                          }}
                          title={`Bấm để chuyển sang ${other.name} để sửa / gỡ giảng viên`}
                          className="px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-[#1565C0] border border-blue-200 text-[10.5px] font-bold cursor-pointer transition"
                        >
                          HĐ: {other.name}
                        </button>
                      </div>
                    )}
                  </label>

                  <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 gap-0.5">
                      {ROLE_BUTTONS.map((rb) => (
                        <button
                          key={rb.role}
                          type="button"
                          onClick={() => handleSetRole(t, rb.role)}
                          title={rb.title}
                          className={`h-7 px-2.5 rounded-md text-[11.5px] transition whitespace-nowrap cursor-pointer ${
                            assignedRole === rb.role ? rb.active : rb.idle
                          }`}
                        >
                          {rb.label}
                        </button>
                      ))}
                    </div>
                    <input
                      id={chkId}
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleToggle(t, e.target.checked)}
                      title={isChecked ? 'Bỏ tích để gỡ khỏi hội đồng' : 'Tích để chọn vào hội đồng'}
                      className="w-4 h-4 shrink-0 cursor-pointer accent-[#1565C0]"
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
      }
      end={
      /* PHẢI: DANH SÁCH HỘI ĐỒNG */
      <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-190px)] min-h-[520px]">
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2 shrink-0">
          <div className="text-[13.5px] font-bold text-slate-800 truncate">Danh sách hội đồng</div>
          {subTab === 'unassigned' && (
            <Button
              type="button"
              onClick={handleConfirmAssign}
              disabled={!hasChanges || updateMembersMutation.isPending}
              className="h-9 px-4 rounded-lg bg-[#1565C0] text-white text-[12.5px] font-semibold hover:bg-[#0D47A1] shadow-sm inline-flex items-center gap-1.5 shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>
                {updateMembersMutation.isPending ? 'Đang lưu...' : `Gán (${currentDraftCount}/5)`}
              </span>
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {councils.map((c) => {
            const isSel = c.publicId === activeCouncil?.publicId
            const cnt = getMemberCount(c)
            const countColor =
              cnt >= 5 ? 'text-emerald-700' : cnt > 0 ? 'text-amber-700' : 'text-rose-700'
            return (
              <button
                key={c.publicId}
                type="button"
                onClick={() => onSelectCouncil(c.publicId)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition cursor-pointer select-none flex items-center justify-between gap-2.5 ${
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
                <span className={`font-bold text-[12px] ${countColor} shrink-0`}>{cnt}/5 TV</span>
              </button>
            )
          })}
        </div>
      </div>
      }
    />

      {/* Drawer thay thế 1 thành viên */}
      {activeCouncil && replaceTarget && (
        <ReplaceMemberDrawer
          council={activeCouncil}
          slot={replaceTarget}
          current={
            savedSlots[replaceTarget] !== null
              ? memberById.get(savedSlots[replaceTarget]!) ?? null
              : null
          }
          teachers={teachers}
          busyMap={busyMap}
          isPending={updateMembersMutation.isPending}
          onClose={() => setReplaceTarget(null)}
          onConfirm={(teacherId) =>
            saveSlots({ ...savedSlots, [replaceTarget]: teacherId }, () => setReplaceTarget(null))
          }
        />
      )}

      {/* Modal thay thế khi hội đồng đã đủ 5/5 */}
      <ReplaceWhenFullDialog
        council={activeCouncil ?? null}
        incoming={incomingTeacher}
        isPending={updateMembersMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setIncomingTeacher(null)
        }}
        onConfirm={(slot) => {
          if (!incomingTeacher) return
          saveSlots({ ...savedSlots, [slot]: incomingTeacher.teacherId }, () => {
            setIncomingTeacher(null)
            setDraftState(null)
          })
        }}
      />
    </>
  )
}
