import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type { LecturerDocumentTemplate } from '../types/templateManagement.types'

export const useTemplateManagementStore = () => {
  const documentTemplates = useLecturerPortalStore((s) => s.documentTemplates)

  return {
    documentTemplates: documentTemplates as LecturerDocumentTemplate[],
  }
}

