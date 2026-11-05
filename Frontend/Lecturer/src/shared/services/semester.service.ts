import apiClient from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type {
  ApiResponse,
  PageResponse,
  SemesterResponse,
} from '@/shared/types/semester.types'

export const semesterService = {
  getCurrentSemester: async (): Promise<SemesterResponse> => {
    const response = await apiClient.get<ApiResponse<SemesterResponse>>(
      API_ENDPOINTS.semester.current,
    )

    return response.data.data
  },

  getAllSemesters: async (): Promise<SemesterResponse[]> => {
    const response = await apiClient.get<
      ApiResponse<PageResponse<SemesterResponse>>
    >(API_ENDPOINTS.semester.base, {
      params: {
        page: 0,
        size: 100,
        sortBy: 'startDate',
        sortDir: 'DESC',
      },
    })

    return response.data.data.content
  },
}