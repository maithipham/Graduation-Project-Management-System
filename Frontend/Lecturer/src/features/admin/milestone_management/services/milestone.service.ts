import { apiClient } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/types';
import type {
  MilestoneGroupedData,
  MilestoneBatchUpdatePayload,
  InitSemesterMilestonesPayload,
} from '../types/milestone.types';

export const milestoneService = {
  /**
   * Lấy danh sách toàn bộ các mốc thời hạn được gom nhóm theo 3 giai đoạn:
   * GET /api/v1/milestones?semesterId={semesterId}&majorId={majorId}
   */
  getMilestones: async (semesterId: string, majorId?: string | null): Promise<MilestoneGroupedData> => {
    const params: Record<string, string> = { semesterId };
    if (majorId) {
      params.majorId = majorId;
    }
    const response = await apiClient.get<ApiResponse<MilestoneGroupedData>>('/api/v1/milestones', { params });
    return response.data.data;
  },

  /**
   * Cập nhật hàng loạt (batch update) ngày bắt đầu và kết thúc cho các mốc thời gian:
   * PUT /api/v1/milestones/batch-update
   */
  batchUpdate: async (payload: MilestoneBatchUpdatePayload): Promise<void> => {
    await apiClient.put<ApiResponse<void>>('/api/v1/milestones/batch-update', payload);
  },

  /**
   * Khởi tạo bộ mốc thời hạn cho học kỳ mới theo khuôn mẫu chuẩn:
   * POST /api/v1/milestones/init-semester
   */
  initSemester: async (payload: InitSemesterMilestonesPayload): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/api/v1/milestones/init-semester', payload);
  },
};

