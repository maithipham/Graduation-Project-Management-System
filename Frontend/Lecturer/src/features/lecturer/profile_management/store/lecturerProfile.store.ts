import { create } from 'zustand'
import type {
  LecturerProfileData,
  LecturerProfileContactPayload,
} from '../types/lecturerProfile.types'
import { lecturerProfileService } from '../services/lecturerProfile.service'

interface LecturerProfileState {
  profile: LecturerProfileData
  isEditOpen: boolean
  setProfile: (profile: LecturerProfileData) => void
  setIsEditOpen: (open: boolean) => void
  updateContact: (payload: LecturerProfileContactPayload) => void
}

export const useLecturerProfileStore = create<LecturerProfileState>((set, get) => ({
  profile: lecturerProfileService.loadInitialProfile(),
  isEditOpen: false,
  setProfile: (profile) => set({ profile }),
  setIsEditOpen: (isEditOpen) => set({ isEditOpen }),
  updateContact: (payload) => {
    const current = get().profile
    lecturerProfileService.saveProfileContact(payload, current)
    set({
      profile: {
        ...current,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
      },
      isEditOpen: false,
    })
  },
}))
