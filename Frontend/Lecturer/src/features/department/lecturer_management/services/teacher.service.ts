import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse, SpringPage } from '@/shared/types'
import { compactParams, toSpringPage, type RawSpringPage } from '@/shared/utils'
import type {
  TeacherCreationRequest,
  TeacherDetail,
  TeacherImportResponse,
  TeacherListItem,
  TeacherListParams,
  TeacherWriteResult,
} from '../types'

const TEACHER = API_ENDPOINTS.departmentTeacher

// BE đọc file Excel tối đa 50MB, có thể lâu hơn timeout mặc định 30 giây của apiClient
const IMPORT_TIMEOUT_MS = 5 * 60 * 1000

// Giống một @Service: chỉ gọi API và bóc wrapper ApiResponse, không xử lý giao diện
export const teacherService = {
  // GET /teacher?name=...&organization=...&majorName=...&page=0&size=10&sort=name,asc
  // Không gửi sort thì BE tự sắp: đang hoạt động trước, mới thêm trước
  async getTeachers(params: TeacherListParams): Promise<SpringPage<TeacherListItem>> {
    const res = await apiClient.get<ApiResponse<RawSpringPage<TeacherListItem>>>(TEACHER.base, {
      params: compactParams(params),
      // sort dạng mảng → ?sort=a,asc&sort=b,desc (đúng kiểu Spring Pageable), không phải sort[]=...
      paramsSerializer: { indexes: null },
    })
    // BE có thể trả Page phẳng hoặc PagedModel ({ content, page: {...} }) → đưa về một dạng
    return toSpringPage(res.data.data, params)
  },

  // GET /teacher/{publicId} — publicId sai định dạng UUID hoặc không có → 404, code 3009 (Giáo viên không tồn tại)
  async getTeacherDetail(publicId: string): Promise<TeacherDetail> {
    const res = await apiClient.get<ApiResponse<TeacherDetail>>(TEACHER.detail(publicId))
    return res.data.data
  },

  // POST /teacher/import — multipart, part tên "file" (giống @RequestParam("file") MultipartFile)
  async importTeachers(file: File): Promise<TeacherImportResponse> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await apiClient.post<ApiResponse<TeacherImportResponse>>(TEACHER.import, formData, {
      // Ghi đè header JSON mặc định của apiClient (nếu không, axios đổi FormData thành JSON → BE trả 1006).
      // Trên trình duyệt axios tự bỏ header này để trình duyệt đặt multipart kèm boundary
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: IMPORT_TIMEOUT_MS,
      // Lỗi mức toàn file (4000, 2007) hiện ngay dưới ô chọn file, không toast
      skipErrorToast: true,
    })
    return res.data.data
  },

  // POST /teacher — thêm thủ công 1 giáo viên. Response chỉ có code + message
  async createTeacher(body: TeacherCreationRequest): Promise<TeacherWriteResult> {
    const res = await apiClient.post<ApiResponse<unknown>>(TEACHER.base, body, {
      // Lỗi (4000, 3006, 3007...) hiện ngay trong form. Cảnh báo 1100 vẫn để interceptor hiện toast vàng
      skipErrorToast: true,
    })
    return { code: res.data.code, message: res.data.message }
  },

  // PATCH /teacher/{publicId}/amount — gửi chuỗi để BE không làm tròn. Response chỉ có code + message.
  // Lỗi (4000, 3009, 3012) để interceptor hiện toast
  async updateTeacherAmount({ publicId, amount }: { publicId: string; amount: string }): Promise<string> {
    const res = await apiClient.patch<ApiResponse<unknown>>(TEACHER.amount(publicId), { amount })
    return res.data.message
  },
}
