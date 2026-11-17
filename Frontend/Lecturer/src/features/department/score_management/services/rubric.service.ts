import { API_ENDPOINTS, apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type {
  ApiDate,
  ApplyPreview,
  ChangeSemesterRubricBody,
  CreateRubricBody,
  EvaluationTemplateDetail,
  EvaluationTemplateSummary,
  EvaluationType,
  SaveRubricBody,
  SemesterEvaluationTemplate,
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

  /** A7 – xem trước khi Áp dụng / Đổi ngày. Không ghi DB; lỗi hiện dưới ô chọn ngày */
  async getApplyPreview(publicId: string, effectiveFrom: ApiDate): Promise<ApplyPreview> {
    const res = await apiClient.get<ApiResponse<ApplyPreview>>(RUBRIC.applyPreview(publicId), {
      params: { effectiveFrom },
      skipErrorToast: true,
    })
    return res.data.data
  },

  /** A8 – áp dụng rubric Nháp từ ngày `effectiveFrom` */
  async apply(publicId: string, effectiveFrom: ApiDate): Promise<void> {
    await apiClient.post<ApiResponse<null>>(RUBRIC.apply(publicId), { effectiveFrom }, { skipErrorToast: true })
  },

  /** A9 – đổi ngày áp dụng của rubric Sắp áp dụng */
  async changeEffectiveFrom(publicId: string, effectiveFrom: ApiDate): Promise<void> {
    await apiClient.patch<ApiResponse<null>>(
      RUBRIC.effectiveFrom(publicId),
      { effectiveFrom },
      { skipErrorToast: true },
    )
  },

  /** A10 – hủy áp dụng, rubric về Nháp */
  async cancelApply(publicId: string): Promise<void> {
    await apiClient.post<ApiResponse<null>>(RUBRIC.cancelApply(publicId))
  },

  /** B1 – 3 rubric (hướng dẫn / phản biện / hội đồng) của một học kỳ */
  async getSemesterRubrics(semesterPublicId: string): Promise<SemesterEvaluationTemplate[]> {
    const res = await apiClient.get<ApiResponse<SemesterEvaluationTemplate[] | null>>(
      RUBRIC.semester(semesterPublicId),
    )
    return res.data.data ?? []
  },

  /** B2 – đổi rubric của một loại phiếu trong học kỳ */
  async changeSemesterRubric(semesterPublicId: string, body: ChangeSemesterRubricBody): Promise<void> {
    await apiClient.put<ApiResponse<null>>(RUBRIC.semester(semesterPublicId), body)
  },
}
