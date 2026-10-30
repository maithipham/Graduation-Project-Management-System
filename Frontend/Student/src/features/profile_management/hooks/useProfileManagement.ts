import { useProfileStore } from '../store/profile.store'

export function useProfileManagement() {
  const {
    profile,
    isEditOpen,
    hasCustomName,
    setProfile,
    setIsEditOpen,
    setHasCustomName,
    updateContact,
  } = useProfileStore()

  return {
    profile,
    isEditOpen,
    hasCustomName,
    setProfile,
    setIsEditOpen,
    setHasCustomName,
    updateContact,
  }
}
