
import apiClient from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'

export interface RegistrationDeadline {
  semesterPublicId: string
  name: string | null
  startDate: string | null
  endDate: string | null
  isActive: boolean | null
  status:
    | 'NOT_CONFIGURED'
    | 'INACTIVE'
    | 'NOT_STARTED'
    | 'CLOSED'
    | 'OPEN'
}

export const supervisorDeadlineService = {
  getRegistrationDeadline: async (
    semesterPublicId: string,
  ): Promise<RegistrationDeadline> => {
    const response = await apiClient.get<RegistrationDeadline>(
      API_ENDPOINTS.lecturer.deadline,
      {
        params: {
          semesterPublicId,
        },
      },
    )

    return response.data
  },
}
