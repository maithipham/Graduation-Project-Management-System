import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type {
  LecturerProfileData,
  LecturerProfileContactPayload,
} from '../types/lecturerProfile.types'

export const LECTURER_PROFILE_STORAGE_KEY = 'lecturer_profile_contact_v2'

export const DEFAULT_LECTURER_PROFILE: LecturerProfileData = {
  degree: 'Tiến sĩ',
  name: 'Trần Mai Anh',
  role: 'Giảng viên',
  workplace: 'Trường Đại học Thủy lợi',
  isExternal: false,
  department: 'Kỹ thuật phần mềm',
  faculty: 'Công nghệ thông tin',
  email: 'maianh.tran@tlu.edu.vn',
  phone: '0912 345 678',
}

/** Chuyển mã học vị viết tắt sang tên đầy đủ viết rõ ràng */
export function formatDegreeFull(degree?: string): string {
  if (!degree) return 'Tiến sĩ'
  const clean = degree.trim().toLowerCase().replace(/\./g, '')
  if (clean === 'ts' || clean === 'tiến sĩ' || clean === 'tiến si') return 'Tiến sĩ'
  if (clean === 'ths' || clean === 'thạc sĩ' || clean === 'thạc si') return 'Thạc sĩ'
  if (clean.includes('phó giáo sư') || clean === 'pgsts' || clean === 'pgs') return 'Phó Giáo sư, Tiến sĩ'
  if (clean.includes('giáo sư') || clean === 'gsts' || clean === 'gs') return 'Giáo sư, Tiến sĩ'
  if (clean === 'ks' || clean === 'kỹ sư') return 'Kỹ sư'
  if (clean === 'cn' || clean === 'cử nhân') return 'Cử nhân'
  return degree
}

/** Lấy tiền tố học vị viết tắt để hiển thị trước họ tên (VD: TS., ThS.) */
export function getDegreePrefix(degree?: string): string {
  if (!degree) return 'TS.'
  const clean = degree.trim().toLowerCase().replace(/\./g, '')
  if (clean === 'ts' || clean === 'tiến sĩ') return 'TS.'
  if (clean === 'ths' || clean === 'thạc sĩ') return 'ThS.'
  if (clean.includes('phó giáo sư') || clean === 'pgsts') return 'PGS.TS.'
  if (clean.includes('giáo sư') || clean === 'gsts') return 'GS.TS.'
  if (clean === 'ks' || clean === 'kỹ sư') return 'KS.'
  if (clean === 'cn' || clean === 'cử nhân') return 'CN.'
  return degree
}

export const lecturerProfileService = {
  formatDegreeFull,
  getDegreePrefix,

  loadInitialProfile: (): LecturerProfileData => {
    let savedContact: Partial<LecturerProfileContactPayload> | null = null
    try {
      const raw = localStorage.getItem(LECTURER_PROFILE_STORAGE_KEY)
      if (raw) {
        savedContact = JSON.parse(raw) as Partial<LecturerProfileContactPayload>
      }
    } catch {
      // ignore
    }

    const teacher = useLecturerPortalStore.getState().teacher
    const isExt = teacher?.isExternal ?? false

    return {
      degree: formatDegreeFull(teacher?.degree || DEFAULT_LECTURER_PROFILE.degree),
      name: savedContact?.name?.trim() || teacher?.name.replace(/^(PGS\.TS\.|GS\.TS\.|TS\.|ThS\.|KS\.|CN\.)\s*/i, '').trim() || DEFAULT_LECTURER_PROFILE.name,
      role: teacher?.title || DEFAULT_LECTURER_PROFILE.role,
      workplace: teacher?.workplace || DEFAULT_LECTURER_PROFILE.workplace,
      isExternal: isExt,
      department: isExt ? '' : (teacher?.department || DEFAULT_LECTURER_PROFILE.department),
      faculty: isExt ? '' : (teacher?.faculty || DEFAULT_LECTURER_PROFILE.faculty),
      email: savedContact?.email?.trim() || teacher?.email || DEFAULT_LECTURER_PROFILE.email,
      phone: savedContact?.phone?.trim() || teacher?.phone || DEFAULT_LECTURER_PROFILE.phone,
    }
  },

  saveProfileContact: (payload: LecturerProfileContactPayload, currentProfile: LecturerProfileData): void => {
    try {
      localStorage.setItem(LECTURER_PROFILE_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // ignore
    }

    const prefix = getDegreePrefix(currentProfile.degree)
    const fullDisplayName = `${prefix} ${payload.name}`.trim()

    // Đồng bộ sang portal store để Header tự động cập nhật
    useLecturerPortalStore.getState().updateTeacherProfile({
      name: fullDisplayName,
      email: payload.email,
      phone: payload.phone,
    })
  },

  computeAvatar: (name: string): string => {
    const clean = name
      .replace(/^(PGS\.TS\.|GS\.TS\.|TS\.|ThS\.|KS\.|CN\.)\s*/i, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
    if (clean.length === 0) return 'MA'
    return clean
      .slice(-2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
  },

  formatDisplayName: (degree: string, name: string): string => {
    const cleanName = name.replace(/^(PGS\.TS\.|GS\.TS\.|TS\.|ThS\.|KS\.|CN\.)\s*/i, '').trim()
    const prefix = getDegreePrefix(degree)
    return `${prefix} ${cleanName}`.trim()
  },
}
