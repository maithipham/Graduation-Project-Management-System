import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse, SpringPage } from '@/shared/types'
import { compactParams, toSpringPage, type RawSpringPage } from '@/shared/utils'
import type {
  MajorOption,
  SemesterOption,
  StudentBatchParams,
  StudentCreationRequest,
  StudentDeleteParams,
  StudentDetail,
  StudentImportResponse,
  StudentListItem,
  StudentListParams,
  StudentWriteResult,
} from '../types'

const STUDENT = API_ENDPOINTS.departmentStudent

// Đủ để lấy hết học kì cho dropdown (mỗi năm học chỉ có 2 kì)
const SEMESTER_OPTION_SIZE = 100

// BE đọc file Excel tối đa 50MB, có thể lâu hơn timeout mặc định 30 giây của apiClient
const IMPORT_TIMEOUT_MS = 5 * 60 * 1000

// Giống một @Service: chỉ gọi API và bóc wrapper ApiResponse, không xử lý giao diện
export const studentService = {
  // GET /student?semesterId=...&keyword=...&batch=K63&majorId=...&status=STAGE_2_TOPIC_CONFIRMED&page=0&size=15&sort=name,asc
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

  // GET /student/batch?semesterId=...&majorId=... — ["K63", "K64"], đã sắp tăng dần
  async getBatches(params: StudentBatchParams): Promise<string[]> {
    const res = await apiClient.get<ApiResponse<string[]>>(STUDENT.batch, {
      params: compactParams(params),
    })
    return res.data.data ?? []
  },

  // GET /semester — data là PageResponse ({ content, page, size, ... }), chỉ cần content.
  // BE mặc định sắp startDate DESC: học kì mới nhất lên đầu
  async getSemesters(): Promise<SemesterOption[]> {
    const res = await apiClient.get<ApiResponse<{ content?: SemesterOption[] | null }>>(
      API_ENDPOINTS.semester.base,
      { params: { page: 0, size: SEMESTER_OPTION_SIZE } },
    )
    return res.data.data?.content ?? []
  },

  // GET /semester/current — học kì chọn sẵn khi mở trang.
  // Không có kì hiện tại thì trang tự chọn kì mới nhất → không cần toast lỗi
  async getCurrentSemester(): Promise<SemesterOption> {
    const res = await apiClient.get<ApiResponse<SemesterOption>>(API_ENDPOINTS.semester.current, {
      skipErrorToast: true,
    })
    return res.data.data
  },

  // DELETE /student/{publicId}?semesterId=... — xóa sinh viên import nhầm khỏi học kì.
  // Trả message của BE: "Xóa sinh viên thành công" hoặc "Đã xóa sinh viên khỏi học kỳ"
  async deleteStudent({ publicId, semesterId }: StudentDeleteParams): Promise<string> {
    const res = await apiClient.delete<ApiResponse<unknown>>(STUDENT.detail(publicId), {
      params: { semesterId },
    })
    return res.data.message
  },

  // POST /student/import — multipart, chỉ part "file" (giống @RequestParam("file") MultipartFile).
  // Không gửi semesterId: BE tự thêm vào học kì hiện tại (chưa có → 409 3030)
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

  // POST /student — popup "Thêm sinh viên" và gửi lại từng dòng import bị lỗi sau khi sửa.
  // Không gửi semesterId: BE tự thêm vào học kì hiện tại (chưa có → 409 3030)
  async createStudent(body: StudentCreationRequest): Promise<StudentWriteResult> {
    const res = await apiClient.post<ApiResponse<unknown>>(STUDENT.base, body, {
      // Lỗi hiện ngay trong form. Cảnh báo 11xx vẫn để interceptor hiện toast vàng
      skipErrorToast: true,
    })
    return { code: res.data.code, message: res.data.message }
  },
}
