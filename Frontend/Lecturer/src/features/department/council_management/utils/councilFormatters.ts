import type { CouncilRole } from '../types'

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
