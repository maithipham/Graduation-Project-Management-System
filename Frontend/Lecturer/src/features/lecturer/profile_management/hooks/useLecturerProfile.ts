import { useLecturerProfileStore } from '../store/lecturerProfile.store'
import { lecturerProfileService } from '../services/lecturerProfile.service'

export function useLecturerProfile() {
  const profile = useLecturerProfileStore((s) => s.profile)
  const isEditOpen = useLecturerProfileStore((s) => s.isEditOpen)
  const setIsEditOpen = useLecturerProfileStore((s) => s.setIsEditOpen)
  const updateContact = useLecturerProfileStore((s) => s.updateContact)

  const displayName = lecturerProfileService.formatDisplayName(
    profile.degree,
    profile.name,
  )
  const avatarText = lecturerProfileService.computeAvatar(profile.name)

  return {
    profile,
    displayName,
    avatarText,
    isEditOpen,
    setIsEditOpen,
    updateContact,
  }
}
