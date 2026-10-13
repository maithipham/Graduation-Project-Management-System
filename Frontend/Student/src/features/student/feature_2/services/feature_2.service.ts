import { apiClient } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/types'
import type { Feature2Item } from '../types'

export interface IFeature2Service {
  getItems: () => Promise<Feature2Item[]>
}

export const feature2Service: IFeature2Service = {
  getItems: async (): Promise<Feature2Item[]> => {
    try {
      const res = await apiClient.get<ApiResponse<Feature2Item[]>>('/student/feature-2')
      return res.data.data
    } catch {
      return []
    }
  },
}
