import { apiClient } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/types';
import type { DeadlineBatchUpdatePayload } from '../types';

export const scheduleService = {
  /**
   * Lấy toàn bộ mốc thời hạn đồ án theo học kỳ và chuyên ngành
   */
  getSchedule: async (semesterId: string, majorId?: string | null) => {
    const params: Record<string, string> = { semesterId };
    if (majorId) {
      params.majorId = majorId;
    }
    const response = await apiClient.get<ApiResponse<any>>('/api/v1/deadlines', { params });
    return response.data.data;
  },

  /**
   * Cập nhật thời gian mốc thời hạn
   */
  updateDeadlines: async (payload: DeadlineBatchUpdatePayload) => {
    await apiClient.put<ApiResponse<void>>('/api/v1/deadlines/batch-update', payload);
  },

  /**
   * Khởi tạo 15 mốc chuẩn cho học kỳ
   */
  initSemester: async (semesterId: string) => {
    await apiClient.post<ApiResponse<void>>('/api/v1/deadlines/init-semester', { semesterId });
  },
};

