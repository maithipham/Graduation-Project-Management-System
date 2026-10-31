import type { TeacherListItem } from '../types'

/** Hạn mức chưa thiết lập (null) hiện "—"; 0 vẫn là một hạn mức hợp lệ nên hiện "0" */
export function formatAmount(amount: number | null): string {
  return amount === null ? '—' : String(amount)
}

/** id của ô nhập hạn mức trên từng dòng — nút bút chì dùng để đưa con trỏ vào ô */
export function teacherAmountInputId(publicId: string): string {
  return `teacher-amount-${publicId}`
}

/** Lấy id định danh duy nhất (dạng số hoặc publicId) */
export function getTeacherId(teacher: TeacherListItem): number | string {
  return teacher.id ?? teacher.teacherId ?? teacher.publicId
}

/**
 * Lấy chữ cái viết tắt cho avatar:
 * VD: "Trần Quốc Bảo" -> TB
 * "Vũ Thị Lan" -> VL
 */
export function getAvatarInitials(teacher: TeacherListItem | string): string {
  if (typeof teacher === 'string') {
    const parts = teacher
      .replace(/^(PGS\.TS\.|GS\.TS\.|TS\.|ThS\.|CN\.|KS\.)\s*/i, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
    if (parts.length === 0) return 'GV'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  if (teacher.firstName && teacher.lastName) {
    const firstWord = teacher.firstName.trim().split(/\s+/)[0] || ''
    const lastWord = teacher.lastName.trim().split(/\s+/).slice(-1)[0] || ''
    return `${firstWord[0] || ''}${lastWord[0] || ''}`.toUpperCase() || 'GV'
  }

  const parts = teacher.name
    .replace(/^(PGS\.TS\.|GS\.TS\.|TS\.|ThS\.|CN\.|KS\.)\s*/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return 'GV'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

/** Bảng màu ngẫu nhiên nhưng ổn định cho Avatar */
const AVATAR_BG_COLORS = [
  'bg-rose-600',
  'bg-amber-600',
  'bg-blue-600',
  'bg-purple-600',
  'bg-emerald-600',
  'bg-indigo-600',
  'bg-teal-600',
  'bg-pink-600',
]

export function getAvatarColor(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i)
    hash |= 0
  }
  return AVATAR_BG_COLORS[Math.abs(hash) % AVATAR_BG_COLORS.length]
}

export function getTeacherPlainName(teacher: TeacherListItem | string): string {
  const rawName = typeof teacher === 'string' ? teacher : teacher.name
  return rawName.replace(/^(PGS\.TS\.|GS\.TS\.|TS\.|ThS\.|CN\.|KS\.)\s*/i, '').trim()
}

export function getTeacherFullName(teacher: TeacherListItem): string {
  if (teacher.fullNameWithTitle) {
    return teacher.fullNameWithTitle
  }
  if (teacher.displayName) {
    return teacher.displayName
  }
  if (teacher.academicTitle) {
    return `${teacher.academicTitle} ${teacher.name}`
  }
  return teacher.name
}
