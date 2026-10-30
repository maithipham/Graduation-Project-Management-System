import {
  STUDENT_PROFILE_MOCK,
  STUDENT_TOPIC_STORAGE_KEYS,
} from '@/shared/constants/studentProfile.mock'
import type { StudentProfileData } from '../types/profile.types'

export const PROFILE_CONTACT_STORAGE_KEY = 'student_profile_contact_v1'

export interface StoredProfileContact {
  name?: string
  email?: string
  phone?: string
}

export const profileService = {
  loadInitialProfile: (): StudentProfileData => {
    let savedContact: StoredProfileContact | null = null
    let savedTopic = ''
    try {
      const rawContact = localStorage.getItem(PROFILE_CONTACT_STORAGE_KEY)
      if (rawContact) {
        savedContact = JSON.parse(rawContact) as StoredProfileContact
      }
      savedTopic = localStorage.getItem(STUDENT_TOPIC_STORAGE_KEYS.topic) || ''
    } catch {
      // ignore storage errors
    }

    return {
      name: savedContact?.name?.trim() || STUDENT_PROFILE_MOCK.name,
      mssv: STUDENT_PROFILE_MOCK.mssv,
      className: STUDENT_PROFILE_MOCK.className,
      department: STUDENT_PROFILE_MOCK.department,
      faculty: STUDENT_PROFILE_MOCK.faculty,
      academicYear: STUDENT_PROFILE_MOCK.academicYear,
      status: STUDENT_PROFILE_MOCK.status,
      email: savedContact?.email?.trim() || STUDENT_PROFILE_MOCK.email,
      phone: savedContact?.phone?.trim() || STUDENT_PROFILE_MOCK.phone,
      mentor: STUDENT_PROFILE_MOCK.mentor,
      topic: savedTopic.trim() || STUDENT_PROFILE_MOCK.topic,
    }
  },

  getHasCustomName: (): boolean => {
    try {
      const raw = localStorage.getItem(PROFILE_CONTACT_STORAGE_KEY)
      if (!raw) return false
      const parsed = JSON.parse(raw) as StoredProfileContact
      return Boolean(parsed.name?.trim())
    } catch {
      return false
    }
  },

  saveProfileContact: (contact: { name: string; email: string; phone: string }): void => {
    try {
      localStorage.setItem(
        PROFILE_CONTACT_STORAGE_KEY,
        JSON.stringify(contact),
      )
    } catch {
      // ignore storage errors
    }
  },

  computeProfileAvatar: (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return STUDENT_PROFILE_MOCK.avatar
    return parts
      .slice(-2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join('')
  },
}
