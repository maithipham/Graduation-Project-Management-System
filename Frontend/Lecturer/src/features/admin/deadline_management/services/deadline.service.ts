import { apiClient } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/types';
import type {
  DeadlineGroupedData,
  DeadlineBatchUpdatePayload,
  InitSemesterDeadlinesPayload,
} from '../types/deadline.types';

export const deadlineService = {
  /**
   * Lấy danh sách toàn bộ các mốc thời hạn được gom nhóm theo 3 giai đoạn:
   * GET /api/v1/deadlines?semesterId={semesterId}&majorId={majorId}
   */
  getDeadlines: async (semesterId: string, majorId?: string | null): Promise<DeadlineGroupedData> => {
    const params: Record<string, string> = { semesterId };
    if (majorId) {
      params.majorId = majorId;
    }
    const response = await apiClient.get<ApiResponse<DeadlineGroupedData>>('/api/v1/deadlines', { params });
    return response.data.data;
  },

  /**
   * Cập nhật hàng loạt (batch update) ngày bắt đầu và kết thúc cho các mốc thời gian:
   * PUT /api/v1/deadlines/batch-update
   */
  batchUpdate: async (payload: DeadlineBatchUpdatePayload): Promise<void> => {
    await apiClient.put<ApiResponse<void>>('/api/v1/deadlines/batch-update', payload);
  },

  /**
   * Khởi tạo bộ mốc thời hạn cho học kỳ mới theo khuôn mẫu chuẩn:
   * POST /api/v1/deadlines/init-semester
   */
  initSemester: async (payload: InitSemesterDeadlinesPayload): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/api/v1/deadlines/init-semester', payload);
  },
};

