import { apiClient } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/types';
import type { DeadlineBatchUpdatePayload } from '../types';

export const scheduleService = {
  /**
   * Lấy toàn bộ mốc thời hạn đồ án theo học kỳ (mọi mốc áp dụng chung cả khoa)
   */
  getSchedule: async (semesterId: string) => {
    const response = await apiClient.get<ApiResponse<any>>('/api/v1/deadlines', { params: { semesterId } });
    return response.data.data;
  },

  /**
   * Cập nhật thời gian mốc thời hạn
   */
  updateDeadlines: async (payload: DeadlineBatchUpdatePayload) => {
    // Hook tự hiện toast lỗi (đúng message BE), tắt toast của interceptor để không bị 2 thông báo
    await apiClient.put<ApiResponse<void>>('/api/v1/deadlines/batch-update', payload, { skipErrorToast: true });
  },

  /**
   * Khởi tạo 15 mốc chuẩn cho học kỳ
   */
  initSemester: async (semesterId: string) => {
    await apiClient.post<ApiResponse<void>>('/api/v1/deadlines/init-semester', { semesterId });
  },
};

