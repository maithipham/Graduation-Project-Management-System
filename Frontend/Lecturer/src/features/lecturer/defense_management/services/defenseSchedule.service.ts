import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  CouncilDefenseSchedule,
  ScheduleDefenseSlotRequest,
} from '../types'

export const defenseScheduleService = {
  // 1. GET /defense-council/{councilPublicId}/defense-schedule
  getCouncilDefenseSchedule: async (
    councilPublicId: string,
  ): Promise<CouncilDefenseSchedule> => {
    const res = await apiClient.get<ApiResponse<CouncilDefenseSchedule>>(
      API_ENDPOINTS.defenseSchedule.councilSchedule(councilPublicId),
    )
    return res.data.data
  },

  // 2. PUT /defense-assignment/{defenseAssignmentPublicId}/defense-slot
  scheduleDefenseSlot: async (
    defenseAssignmentPublicId: string,
    data: ScheduleDefenseSlotRequest,
    options?: { skipErrorToast?: boolean },
  ): Promise<void> => {
    const res = await apiClient.put<ApiResponse<void>>(
      API_ENDPOINTS.defenseSchedule.scheduleSlot(defenseAssignmentPublicId),
      data,
      {
        skipErrorToast: options?.skipErrorToast,
      },
    )
    return res.data.data
  },

  // 3. DELETE /defense-assignment/{defenseAssignmentPublicId}/defense-slot
  unscheduleDefenseSlot: async (
    defenseAssignmentPublicId: string,
    options?: { skipErrorToast?: boolean },
  ): Promise<void> => {
    const res = await apiClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.defenseSchedule.unscheduleSlot(defenseAssignmentPublicId),
      {
        skipErrorToast: options?.skipErrorToast,
      },
    )
    return res.data.data
  },
}
