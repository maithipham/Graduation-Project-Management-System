import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { Semester } from '../types/semester.types'

interface PageResponse<T> {
  totalElements: number
  totalPages: number
  page: number
  size: number
  content: T[]
}

export const semesterService = {
  // Lấy học kỳ hiện tại
  async getCurrent(): Promise<Semester | null> {
    const res = await apiClient.get<ApiResponse<Semester | null>>(
      '/semester/current',
    )

    return res.data.data ?? null
  },

  // Lấy danh sách tất cả học kỳ
  async getAll(): Promise<Semester[]> {
    const res = await apiClient.get<
      ApiResponse<PageResponse<Semester>>
    >('/semester', {
      params: {
        page: 0,
        size: 100,
        sortBy: 'startDate',
        sortDir: 'DESC',
      },
    })

    return res.data.data.content
  },
}