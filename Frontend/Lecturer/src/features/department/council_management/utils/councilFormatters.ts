import type { CouncilMember, CouncilRole, DefenseCouncil, FormationMilestoneState } from '../types'

/** 5 vị trí cố định của hội đồng: 1 Chủ tịch, 1 Thư ký, 3 Ủy viên */
export type MemberSlotKey = 'chair' | 'secretary' | 'm1' | 'm2' | 'm3'
export const MEMBER_SLOT_KEYS: MemberSlotKey[] = ['chair', 'secretary', 'm1', 'm2', 'm3']
/** Giá trị mỗi vị trí là teacherId (null = còn trống) */
export type MemberSlots = Record<MemberSlotKey, number | null>

export const EMPTY_SLOTS: MemberSlots = { chair: null, secretary: null, m1: null, m2: null, m3: null }

export function slotRole(slot: MemberSlotKey): CouncilRole {
  if (slot === 'chair') return 'CHAIRPERSON'
  if (slot === 'secretary') return 'SECRETARY'
  return 'COUNCIL_MEMBER'
}

export function slotLabel(slot: MemberSlotKey): string {
  return ROLE_CONFIG[slotRole(slot)].label
}

/** Chuyển danh sách thành viên từ BE sang 5 vị trí */
export function membersToSlots(members: CouncilMember[] = []): MemberSlots {
  const slots: MemberSlots = { ...EMPTY_SLOTS }
  const memberSlots: MemberSlotKey[] = ['m1', 'm2', 'm3']
  members.forEach((m) => {
    if (m.role === 'CHAIRPERSON' && slots.chair === null) slots.chair = m.teacherId
    else if (m.role === 'SECRETARY' && slots.secretary === null) slots.secretary = m.teacherId
    else {
      const empty = memberSlots.find((k) => slots[k] === null)
      if (empty) slots[empty] = m.teacherId
    }
  })
  return slots
}

export function slotsToPayload(slots: MemberSlots) {
  return MEMBER_SLOT_KEYS.filter((k) => slots[k] !== null).map((k) => ({
    teacherId: slots[k] as number,
    role: slotRole(k),
  }))
}

export function findSlotOf(slots: MemberSlots, teacherId: number): MemberSlotKey | null {
  return MEMBER_SLOT_KEYS.find((k) => slots[k] === teacherId) ?? null
}

export function getMemberCount(council: DefenseCouncil): number {
  return (council.members || []).length
}

export function isCouncilMembersComplete(council: DefenseCouncil): boolean {
  return getMemberCount(council) >= 5
}

/** ISO datetime → 'YYYY-MM-DD' (dùng cho input type=date) */
export function toDateInputValue(iso?: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

export function formatDefenseDateRange(startStr?: string | null, endStr?: string | null): string {
  if (!startStr && !endStr) return 'Chưa xếp ngày'

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) return iso
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}/${month}/${year}`
    } catch {
      return iso
    }
  }

  const s = startStr ? formatDate(startStr) : ''
  const e = endStr ? formatDate(endStr) : ''
  if (s && e) {
    return s === e ? s : `${s} - ${e}`
  }
  return s || e || 'Chưa xếp ngày'
}

/** Suy ra trạng thái mốc THANH_LAP_HOI_DONG từ ngày bắt đầu/kết thúc (giống cách BE kiểm tra) */
export function resolveMilestoneState(
  startDate?: string | null,
  endDate?: string | null,
  now: Date = new Date(),
): FormationMilestoneState {
  if (!startDate || !endDate) return 'NOT_CONFIGURED'
  if (now < new Date(startDate)) return 'NOT_STARTED'
  if (now > new Date(endDate)) return 'CLOSED'
  return 'OPEN'
}

/** Thông báo hiển thị khi mốc không cho phép thao tác */
export const MILESTONE_BLOCK_MESSAGE: Record<FormationMilestoneState, string> = {
  LOADING: '',
  OPEN: '',
  NOT_CONFIGURED: 'Mốc "Thành lập hội đồng" chưa được thiết lập cho học kỳ này.',
  NOT_STARTED: 'Chưa đến thời gian mở mốc "Thành lập hội đồng".',
  CLOSED: 'Mốc "Thành lập hội đồng" đã đóng, không thể tạo hoặc chỉnh sửa hội đồng.',
}

export function generateCouncilCodes(
  majorCode: string,
  quantity: number,
  existingCount: number = 0,
  year?: string | number,
): string[] {
  const codes: string[] = []
  const rawCode = majorCode.trim().toUpperCase() || 'KTPM'
  const cleanCode = rawCode.replace(/\d+$/, '') || rawCode
  const yearStr = year ? String(year).trim().slice(0, 4) : new Date().getFullYear().toString()
  for (let i = 1; i <= quantity; i++) {
    const idx = existingCount + i
    const numStr = idx < 10 ? `0${idx}` : `${idx}`
    codes.push(`${cleanCode}${yearStr}${numStr}`)
  }
  return codes
}

export const ROLE_CONFIG: Record<
  CouncilRole,
  { label: string; badgeClass: string; activeClass: string }
> = {
  CHAIRPERSON: {
    label: 'Chủ tịch',
    badgeClass: 'bg-blue-100 text-[#1565C0] border-blue-200',
    activeClass: 'bg-[#1565C0] text-white shadow-xs',
  },
  SECRETARY: {
    label: 'Thư ký',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
    activeClass: 'bg-purple-600 text-white shadow-xs',
  },
  COUNCIL_MEMBER: {
    label: 'Ủy viên',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    activeClass: 'bg-emerald-600 text-white shadow-xs',
  },
}
