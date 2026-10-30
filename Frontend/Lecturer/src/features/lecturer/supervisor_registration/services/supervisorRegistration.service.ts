import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type {
  SupervisorRequestItem,
  SupervisorRequestCounts,
} from '../types/supervisorRegistration.types'

export const supervisorRegistrationService = {
  getRequests: (): SupervisorRequestItem[] => {
    return useLecturerPortalStore.getState().supervisorRequests
  },

  approveRequest: (id: string): void => {
    useLecturerPortalStore.getState().approveSupervisorRequest(id)
  },

  rejectRequest: (id: string, reason?: string): void => {
    useLecturerPortalStore.getState().rejectSupervisorRequest(id, reason)
  },

  getCounts: (items: SupervisorRequestItem[]): SupervisorRequestCounts => {
    return {
      pending: items.filter((r) => r.status === 'pending').length,
      approved: items.filter((r) => r.status === 'approved').length,
      rejected: items.filter((r) => r.status === 'rejected').length,
      all: items.length,
    }
  },
}

