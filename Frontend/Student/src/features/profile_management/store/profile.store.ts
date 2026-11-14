import { create } from 'zustand'
import type { StudentProfileData } from '../types/profile.types'
import { profileService } from '../services/profile.service'

interface ProfileState {
  profile: StudentProfileData
  isEditOpen: boolean
  hasCustomName: boolean
  setProfile: (profile: StudentProfileData) => void
  setIsEditOpen: (open: boolean) => void
  setHasCustomName: (hasCustom: boolean) => void
  updateContact: (contact: { name: string; email: string; phone: string }) => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: profileService.loadInitialProfile(),
  isEditOpen: false,
  hasCustomName: profileService.getHasCustomName(),
  setProfile: (profile) => set({ profile }),
  setIsEditOpen: (isEditOpen) => set({ isEditOpen }),
  setHasCustomName: (hasCustomName) => set({ hasCustomName }),
  updateContact: (contact) => {
    profileService.saveProfileContact(contact)
    set({
      profile: profileService.loadInitialProfile(),
      hasCustomName: true,
      isEditOpen: false,
    })
  },
}))
