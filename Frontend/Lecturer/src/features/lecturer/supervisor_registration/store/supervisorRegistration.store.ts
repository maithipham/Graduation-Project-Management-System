import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import type { SupervisorRequestItem } from '../types/supervisorRegistration.types'

export const useSupervisorRegistrationStore = () => {
  const supervisorRequests = useLecturerPortalStore((s) => s.supervisorRequests)
  const approveSupervisorRequest = useLecturerPortalStore((s) => s.approveSupervisorRequest)
  const rejectSupervisorRequest = useLecturerPortalStore((s) => s.rejectSupervisorRequest)

  return {
    supervisorRequests: supervisorRequests as SupervisorRequestItem[],
    approveSupervisorRequest,
    rejectSupervisorRequest,
  }
}

