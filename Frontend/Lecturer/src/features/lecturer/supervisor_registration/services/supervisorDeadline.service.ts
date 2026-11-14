import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'

import type { RegistrationDeadline } from '../types/supervisorRegistration.types'

export type { RegistrationDeadline }

export const supervisorDeadlineService = {
  // 5. GET /api/teacher/advisor-registrations/deadline — Lấy hạn đăng ký GVHD theo học kỳ
  getRegistrationDeadline: async (
    semesterPublicId: string,
  ): Promise<RegistrationDeadline> => {
    const response = await apiClient.get<ApiResponse<RegistrationDeadline>>(
      API_ENDPOINTS.lecturer.deadline,
      {
        params: {
          semesterPublicId,
        },
      },
    )

    return response.data.data
  },
}
