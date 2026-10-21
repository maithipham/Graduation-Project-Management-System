import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse, SpringPage } from '@/shared/types'
import { compactParams, toSpringPage, type RawSpringPage } from '@/shared/utils'
import type {
  MajorOption,
  StudentCreationRequest,
  StudentDetail,
  StudentImportResponse,
  StudentListItem,
  StudentListParams,
  StudentWriteResult,
} from '../types'

const STUDENT = API_ENDPOINTS.departmentStudent

// BE đọc file Excel tối đa 50MB, có thể lâu hơn timeout mặc định 30 giây của apiClient
const IMPORT_TIMEOUT_MS = 5 * 60 * 1000

// Giống một @Service: chỉ gọi API và bóc wrapper ApiResponse, không xử lý giao diện
export const studentService = {
  // GET /student?keyword=...&batch=K63&majorId=...&status=ACTIVE&page=0&size=15&sort=name,asc
  async getStudents(params: StudentListParams): Promise<SpringPage<StudentListItem>> {
    const res = await apiClient.get<ApiResponse<RawSpringPage<StudentListItem>>>(STUDENT.base, {
      params: compactParams(params),
      // sort dạng mảng → ?sort=a,asc&sort=b,desc (đúng kiểu Spring Pageable), không phải sort[]=...
      paramsSerializer: { indexes: null },
    })
    // BE có thể trả Page phẳng hoặc PagedModel ({ content, page: {...} }) → đưa về một dạng
    return toSpringPage(res.data.data, params)
  },

  async getStudentDetail(publicId: string): Promise<StudentDetail> {
    const res = await apiClient.get<ApiResponse<StudentDetail>>(STUDENT.detail(publicId))
    return res.data.data
  },

  // GET /major — BE đã sắp theo tên ngành
  async getMajors(): Promise<MajorOption[]> {
    const res = await apiClient.get<ApiResponse<MajorOption[]>>(API_ENDPOINTS.major.base)
    return res.data.data
  },

  // POST /student/import — multipart, part tên "file" (giống @RequestParam("file") MultipartFile)
  async importStudents(file: File): Promise<StudentImportResponse> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await apiClient.post<ApiResponse<StudentImportResponse>>(STUDENT.import, formData, {
      // apiClient mặc định gửi JSON. Đổi sang multipart thì trình duyệt tự thêm boundary
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: IMPORT_TIMEOUT_MS,
      // Lỗi mức toàn file (code 4000) hiện ngay dưới ô chọn file, không toast
      skipErrorToast: true,
    })
    return res.data.data
  },

  // POST /student — popup "Thêm sinh viên" và gửi lại từng dòng import bị lỗi sau khi sửa
  async createStudent(body: StudentCreationRequest): Promise<StudentWriteResult> {
    const res = await apiClient.post<ApiResponse<unknown>>(STUDENT.base, body, {
      // Lỗi hiện ngay trong form. Cảnh báo 11xx vẫn để interceptor hiện toast vàng
      skipErrorToast: true,
    })
    return { code: res.data.code, message: res.data.message }
  },
}
