import { API_ENDPOINTS, apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  ApplyPreview,
  ScoreWeightBody,
  ScoreWeightConfig,
  SemesterRangeBody,
  UpdateScoreWeightBody,
} from '../types'

const WEIGHT = API_ENDPOINTS.departmentScoreWeight

// Gọi HTTP cho cấu hình trọng số điểm tổng kết, trả đúng DTO của BE (res.data.data).
// Request có `skipErrorToast` thì hộp thoại tự hiện lỗi thay vì toast đỏ.

export const scoreWeightService = {
  /** W1 – danh sách cấu hình trọng số */
  async getList(): Promise<ScoreWeightConfig[]> {
    const res = await apiClient.get<ApiResponse<ScoreWeightConfig[] | null>>(WEIGHT.base)
    return res.data.data ?? []
  },

  /** W2 – chi tiết (lấy `version` mới nhất trước khi sửa) */
  async getDetail(publicId: string): Promise<ScoreWeightConfig> {
    const res = await apiClient.get<ApiResponse<ScoreWeightConfig>>(WEIGHT.detail(publicId))
    return res.data.data
  },

  /** W3 – tạo cấu hình Nháp, trả publicId mới. Lỗi hiện trong hộp thoại */
  async create(body: ScoreWeightBody): Promise<string> {
    const res = await apiClient.post<ApiResponse<string>>(WEIGHT.base, body, { skipErrorToast: true })
    return res.data.data
  },

  /** W4 – sửa tên + trọng số. Lỗi (4000, 3170, 3173, 3179…) hiện trong hộp thoại */
  async update(publicId: string, body: UpdateScoreWeightBody): Promise<void> {
    await apiClient.put<ApiResponse<null>>(WEIGHT.detail(publicId), body, { skipErrorToast: true })
  },

  /** W5 – xóa cứng cấu hình Nháp */
  async remove(publicId: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(WEIGHT.detail(publicId))
  },

  /** W6 – xem trước Áp dụng / Sửa kỳ. `toSemesterId` null = chưa xác định (không gửi query) */
  async getApplyPreview(publicId: string, fromSemesterId: string, toSemesterId: string | null): Promise<ApplyPreview> {
    const res = await apiClient.get<ApiResponse<ApplyPreview>>(WEIGHT.applyPreview(publicId), {
      params: { fromSemesterId, toSemesterId: toSemesterId ?? undefined },
      skipErrorToast: true,
    })
    return res.data.data
  },

  /** W6b – xem trước Hủy áp dụng: `releasedSemesters` = các kỳ sẽ mất cấu hình trọng số */
  async getCancelApplyPreview(publicId: string): Promise<ApplyPreview> {
    const res = await apiClient.get<ApiResponse<ApplyPreview>>(WEIGHT.cancelApplyPreview(publicId), {
      skipErrorToast: true,
    })
    return res.data.data
  },

  /** W7 – áp dụng cấu hình Nháp cho khoảng học kỳ */
  async apply(publicId: string, body: SemesterRangeBody): Promise<void> {
    await apiClient.post<ApiResponse<null>>(WEIGHT.apply(publicId), body, { skipErrorToast: true })
  },

  /** W8 – sửa kỳ áp dụng của cấu hình Sắp / Đang áp dụng */
  async changeSemesterRange(publicId: string, body: SemesterRangeBody): Promise<void> {
    await apiClient.patch<ApiResponse<null>>(WEIGHT.semesterRange(publicId), body, { skipErrorToast: true })
  },

  /** W9 – hủy áp dụng, cấu hình về Nháp */
  async cancelApply(publicId: string): Promise<void> {
    await apiClient.post<ApiResponse<null>>(WEIGHT.cancelApply(publicId))
  },
}
