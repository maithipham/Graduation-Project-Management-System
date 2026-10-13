import { apiClient } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/types'
import type { Feature1Item } from '../types'

export interface IFeature1Service {
  getItems: () => Promise<Feature1Item[]>
}

export const feature1Service: IFeature1Service = {
  getItems: async (): Promise<Feature1Item[]> => {
    try {
      const res = await apiClient.get<ApiResponse<Feature1Item[]>>('/student/feature-1')
      return res.data.data
    } catch {
      return []
    }
  },
}
