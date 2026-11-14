import { apiClient, API_ENDPOINTS } from '@/shared/api'
import type { ApiResponse, SpringPage } from '@/shared/types'
import { compactParams, toSpringPage, type RawSpringPage } from '@/shared/utils'
import type { MajorOption } from '@/features/department/student_management'
import type {
  AcademicTitle,
  AdvisorImportResponse,
  AssignAdvisorsRequest,
  TeacherCreationRequest,
  TeacherUpdateRequest,
  TeacherDetail,
  TeacherImportResponse,
  TeacherListItem,
  TeacherListParams,
  TeacherAllListParams,
  TeacherWriteResult,
} from '../types'

const TEACHER = API_ENDPOINTS.departmentTeacher

// BE đọc file Excel tối đa 50MB, có thể lâu hơn timeout mặc định 30 giây của apiClient
const IMPORT_TIMEOUT_MS = 5 * 60 * 1000

// 4 bản ghi học hàm, học vị được backend gieo mầm mặc định trong ApplicationInitConfig
export const DEFAULT_ACADEMIC_TITLES: AcademicTitle[] = [
  { id: 1, code: 'MASTER', name: 'Thạc sĩ', abbreviation: 'ThS.', sortOrder: 1 },
  { id: 2, code: 'DOCTOR', name: 'Tiến sĩ', abbreviation: 'TS.', sortOrder: 2 },
  { id: 3, code: 'ASSOCIATE_PROFESSOR', name: 'Phó Giáo sư', abbreviation: 'PGS.TS.', sortOrder: 3 },
  { id: 4, code: 'PROFESSOR', name: 'Giáo sư', abbreviation: 'GS.TS.', sortOrder: 4 },
]

// Giống một @Service: chỉ gọi API và bóc wrapper ApiResponse, không xử lý giao diện
export const teacherService = {
  // GET /teacher/all?semesterId=...&keyword=...&majorId=...&unitType=...&isAssigned=...
  // Lấy toàn bộ danh sách giáo viên hệ thống không phân trang từ backend
  async getAllTeachersList(
    params: TeacherAllListParams,
    config?: { skipErrorToast?: boolean },
  ): Promise<TeacherListItem[]> {
    const cleanParams: Record<string, any> = {}
    if (params.semesterId && params.semesterId !== 'all') {
      cleanParams.semesterId = params.semesterId
    }
    if (params.keyword?.trim()) {
      cleanParams.keyword = params.keyword.trim()
    } else if (params.name?.trim()) {
      cleanParams.keyword = params.name.trim()
    }
    if (params.majorId?.trim()) {
      cleanParams.majorId = params.majorId.trim()
    }
    if (params.unitType && params.unitType !== 'ALL' && (params.unitType as string) !== '') {
      cleanParams.unitType = params.unitType
    }
    if (params.isAssigned !== undefined) {
      cleanParams.isAssigned = params.isAssigned
    }

    const res = await apiClient.get<ApiResponse<TeacherListItem[]>>(TEACHER.all, {
      params: cleanParams,
      skipErrorToast: config?.skipErrorToast,
    })
    return res.data?.data || []
  },

  // GET /teacher?keyword=...&majorId=...&unitType=...&isAssigned=...&page=0&size=15&sort=name,asc
  // Không gửi sort thì BE tự sắp: đang hoạt động trước, mới thêm trước
  async getTeachers(
    params: TeacherListParams,
    config?: { skipErrorToast?: boolean },
  ): Promise<SpringPage<TeacherListItem>> {
    const cleanParams = { ...params }
    if (cleanParams.unitType === 'ALL' || cleanParams.unitType === '') {
      delete cleanParams.unitType
    }
    if (cleanParams.semesterId === 'all' || cleanParams.semesterId === '') {
      delete cleanParams.semesterId
    }
    const res = await apiClient.get<ApiResponse<RawSpringPage<TeacherListItem>>>(TEACHER.base, {
      params: compactParams(cleanParams),
      // sort dạng mảng → ?sort=a,asc&sort=b,desc (đúng kiểu Spring Pageable), không phải sort[]=...
      paramsSerializer: { indexes: null },
      skipErrorToast: config?.skipErrorToast,
    })
    // BE có thể trả Page phẳng hoặc PagedModel ({ content, page: {...} }) → đưa về một dạng
    return toSpringPage(res.data.data, params)
  },

  // POST /api/advisors/assign hoặc /semesters/{semesterId}/advisors — Cấu hình danh sách giáo viên hướng dẫn
  async assignAdvisors(semesterId: string, body: AssignAdvisorsRequest): Promise<string> {
    const payload: Record<string, any> = {
      semesterId,
      teacherIds: body.teacherIds,
    }
    if (body.maxStudentsPerTeacher !== undefined) {
      payload.maxStudentsPerTeacher = body.maxStudentsPerTeacher
    }

    const cleanSemesterId = encodeURIComponent(semesterId)
    // Backend AdvisorController nhận semesterId qua path variable hoặc query param @RequestParam("semesterId")
    const urlWithParam = `/api/advisors/assign?semesterId=${cleanSemesterId}`
    const pathUrl = TEACHER.advisors(semesterId)

    try {
      const res = await apiClient.post<ApiResponse<null>>(urlWithParam, payload)
      return res.data.message || 'Cấu hình danh sách giáo viên hướng dẫn thành công'
    } catch (err: any) {
      if (err?.response?.status === 404) {
        try {
          const res = await apiClient.post<ApiResponse<null>>(pathUrl, payload)
          return res.data.message || 'Cấu hình danh sách giáo viên hướng dẫn thành công'
        } catch (innerErr: any) {
          if (innerErr?.response?.status === 404) {
            const res = await apiClient.post<ApiResponse<null>>('/api/advisors', payload)
            return res.data.message || 'Cấu hình danh sách giáo viên hướng dẫn thành công'
          }
          throw innerErr
        }
      }
      throw err
    }
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

  // GET /teacher/academic-titles — Danh mục học hàm, học vị
  async getAcademicTitles(): Promise<AcademicTitle[]> {
    try {
      const res = await apiClient.get<ApiResponse<AcademicTitle[]>>(TEACHER.academicTitles, {
        skipErrorToast: true,
      })
      const data = res.data?.data
      if (Array.isArray(data) && data.length > 0) {
        return data
      }
    } catch {
      // Bỏ qua lỗi mạng, dùng danh mục mặc định
    }
    return DEFAULT_ACADEMIC_TITLES
  },

  // GET /teacher/available?semesterId=&keyword= — Danh sách giảng viên khả dụng chưa làm GVHD trong kỳ
  async getAvailableTeachers(params: {
    semesterId?: string
    keyword?: string
    page?: number
    size?: number
  }): Promise<SpringPage<TeacherListItem>> {
    const res = await apiClient.get<ApiResponse<RawSpringPage<TeacherListItem>>>(TEACHER.available, {
      params: compactParams(params),
    })
    return toSpringPage(res.data.data, { page: params.page ?? 0, size: params.size ?? 15 })
  },

  // POST /semesters/{semesterId}/advisors/import-excel — Import file Excel danh sách GVHD trong kỳ
  async importAdvisorsExcel(semesterId: string, file: File): Promise<AdvisorImportResponse> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await apiClient.post<ApiResponse<AdvisorImportResponse>>(
      TEACHER.importAdvisorsExcel(semesterId),
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: IMPORT_TIMEOUT_MS,
      },
    )
    return res.data?.data || {
      totalRows: 0,
      successCount: 0,
      skippedCount: 0,
      failedCount: 0,
      errors: [],
    }
  },

  // GET /teacher/managed-major — Lấy ngành mà TBM phụ trách quản lý
  async getManagedMajor(): Promise<MajorOption | null> {
    const res = await apiClient.get<ApiResponse<MajorOption | null>>('/teacher/managed-major')
    return res.data.data
  },

  // PUT /api/teachers/{id} — cập nhật thông tin giảng viên
  async updateTeacher(id: string | number, body: TeacherUpdateRequest): Promise<TeacherWriteResult> {
    try {
      const res = await apiClient.put<ApiResponse<unknown>>(`/api/teachers/${id}`, body, {
        skipErrorToast: true,
      })
      return { code: res.data.code, message: res.data.message }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const res = await apiClient.put<ApiResponse<unknown>>(TEACHER.detail(String(id)), body, {
          skipErrorToast: true,
        })
        return { code: res.data.code, message: res.data.message }
      }
      throw err
    }
  },

  // DELETE /api/teachers/{id} — xóa giảng viên
  async deleteTeacher(id: string | number): Promise<string> {
    try {
      const res = await apiClient.delete<ApiResponse<unknown>>(`/api/teachers/${id}`)
      return res.data.message || 'Xóa giảng viên thành công'
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const res = await apiClient.delete<ApiResponse<unknown>>(TEACHER.detail(String(id)))
        return res.data.message || 'Xóa giảng viên thành công'
      }
      throw err
    }
  },
}
