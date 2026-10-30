import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type { LecturerDocumentTemplate } from '../types/templateManagement.types'

export const templateManagementService = {
  getTemplates: (): LecturerDocumentTemplate[] => {
    return useLecturerPortalStore.getState().documentTemplates
  },
}

