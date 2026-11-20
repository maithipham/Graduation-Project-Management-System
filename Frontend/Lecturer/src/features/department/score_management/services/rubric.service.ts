import { API_ENDPOINTS, apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { RawSpringPage } from '@/shared/utils'
import type {
  ApplyPreview,
  CreateRubricBody,
  EvaluationTemplateDetail,
  EvaluationTemplateSummary,
  EvaluationType,
  RubricSemesterOption,
  SaveRubricBody,
  SemesterEvaluationTemplate,
  SemesterRangeBody,
} from '../types'

const RUBRIC = API_ENDPOINTS.departmentRubric

// Giống @Service bên Spring nhưng chỉ gọi HTTP: trả đúng DTO của BE (res.data.data), không xử lý giao diện.
// Đổi DTO → model giao diện nằm ở hooks (qua utils/rubricMapper).
// Request nào có `skipErrorToast` thì màn hình tự hiện lỗi (dưới ô nhập / trong popup) thay vì toast đỏ.

export const rubricService = {
  /** A1 – kho rubric của một loại phiếu */
  async getList(type: EvaluationType): Promise<EvaluationTemplateSummary[]> {
    const res = await apiClient.get<ApiResponse<EvaluationTemplateSummary[] | null>>(RUBRIC.base, {
      params: { type },
    })
    return res.data.data ?? []
  },

  /** A2 – chi tiết kèm cây tiêu chí, `version` và các cờ canXxx */
  async getDetail(publicId: string): Promise<EvaluationTemplateDetail> {
    const res = await apiClient.get<ApiResponse<EvaluationTemplateDetail>>(RUBRIC.detail(publicId))
    return res.data.data
  },

  /** A3 – tạo rubric Nháp rỗng, trả publicId mới. Lỗi hiện ngay ở dòng nhập tên */
  async create(body: CreateRubricBody): Promise<string> {
    const res = await apiClient.post<ApiResponse<string>>(RUBRIC.base, body, { skipErrorToast: true })
    return res.data.data
  },

  /** A4 – nhân bản thành rubric Nháp mới, trả publicId bản sao */
  async clone(publicId: string): Promise<string> {
    const res = await apiClient.post<ApiResponse<string>>(RUBRIC.clone(publicId))
    return res.data.data
  },

  /** A5 – lưu toàn bộ cây. Lỗi (4000, 3103, 3109…) hiện trong popup chi tiết */
  async save(publicId: string, body: SaveRubricBody): Promise<void> {
    await apiClient.put<ApiResponse<null>>(RUBRIC.detail(publicId), body, { skipErrorToast: true })
  },

  /** A6 – xóa cứng rubric Nháp */
  async remove(publicId: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(RUBRIC.detail(publicId))
  },

  /**
   * A7 – xem trước Áp dụng (Nháp) / Sửa kỳ áp dụng (Sắp / Đang áp dụng). Không ghi DB;
   * lỗi khoảng kỳ hiện ngay dưới 2 ô chọn. `toSemesterId` null = chưa xác định (không gửi query)
   */
  async getApplyPreview(publicId: string, fromSemesterId: string, toSemesterId: string | null): Promise<ApplyPreview> {
    const res = await apiClient.get<ApiResponse<ApplyPreview>>(RUBRIC.applyPreview(publicId), {
      params: { fromSemesterId, toSemesterId: toSemesterId ?? undefined },
      skipErrorToast: true,
    })
    return res.data.data
  },

  /** A7b – xem trước Hủy áp dụng: `releasedSemesters` = các kỳ sẽ mất rubric. Lỗi hiện trong hộp thoại xác nhận */
  async getCancelApplyPreview(publicId: string): Promise<ApplyPreview> {
    const res = await apiClient.get<ApiResponse<ApplyPreview>>(RUBRIC.cancelApplyPreview(publicId), {
      skipErrorToast: true,
    })
    return res.data.data
  },

  /** A8 – áp dụng rubric Nháp cho khoảng học kỳ */
  async apply(publicId: string, body: SemesterRangeBody): Promise<void> {
    await apiClient.post<ApiResponse<null>>(RUBRIC.apply(publicId), body, { skipErrorToast: true })
  },

  /** A9 – sửa kỳ áp dụng của rubric Sắp / Đang áp dụng */
  async changeSemesterRange(publicId: string, body: SemesterRangeBody): Promise<void> {
    await apiClient.patch<ApiResponse<null>>(RUBRIC.semesterRange(publicId), body, { skipErrorToast: true })
  },

  /** A10 – hủy áp dụng, rubric về Nháp */
  async cancelApply(publicId: string): Promise<void> {
    await apiClient.post<ApiResponse<null>>(RUBRIC.cancelApply(publicId))
  },

  /** B1 – 3 rubric (hướng dẫn / phản biện / hội đồng) của một học kỳ, chỉ xem */
  async getSemesterRubrics(semesterPublicId: string): Promise<SemesterEvaluationTemplate[]> {
    const res = await apiClient.get<ApiResponse<SemesterEvaluationTemplate[] | null>>(
      RUBRIC.semester(semesterPublicId),
    )
    return res.data.data ?? []
  },

  /**
   * Học kỳ cho ô chọn "Từ kỳ" / "Đến kỳ": dùng GET /semester có sẵn, sắp tăng dần theo ngày bắt đầu.
   * Không dùng lại semesterService.getAllSemesters (code dùng chung, sắp giảm dần)
   */
  async getSemesterOptions(): Promise<RubricSemesterOption[]> {
    const res = await apiClient.get<ApiResponse<RawSpringPage<RubricSemesterOption> | null>>(
      API_ENDPOINTS.semester.base,
      { params: { page: 0, size: 100, sortBy: 'startDate', sortDir: 'ASC' } },
    )
    return res.data.data?.content ?? []
  },
}
