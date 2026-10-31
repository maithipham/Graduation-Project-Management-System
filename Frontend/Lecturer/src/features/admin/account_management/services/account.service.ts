import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse, SpringPage } from '@/shared/types'
import {
  compactParams,
  getFilenameFromDisposition,
  toSpringPage,
  type DownloadedFile,
  type RawSpringPage,
} from '@/shared/utils'
import type { PageResponseBE } from '@/features/admin/semester_management'
import type {
  StudentCreationRequest,
  StudentImportResponse,
  StudentWriteResult,
} from '@/features/department'
import type {
  AddAccountFormValues,
  AccountActivity,
  AccountRole,
  AccountStatus,
  StudentAccountDetail,
  StudentAccountExportParams,
  StudentAccountItem,
  StudentAccountListParams,
  StudentAccountUpdateRequest,
} from '../types/account.types'

// Import / xuất file nhiều dòng có thể lâu hơn timeout mặc định
const IMPORT_TIMEOUT_MS = 5 * 60 * 1000
const EXPORT_TIMEOUT_MS = 2 * 60 * 1000
// Dùng khi BE không gửi Content-Disposition
const EXPORT_FALLBACK_FILENAME = 'danh_sach_tai_khoan_sinh_vien.xlsx'

export interface AccountListParams {
  page?: number
  size?: number
  keyword?: string
  role?: string
  /** Quy ước với BE: Hoạt động = true, Không hoạt động = false */
  status?: boolean
}

export interface AccountResponseBE {
  id: string
  name: string
  email: string
  phone?: string
  role: AccountRole
  status: AccountStatus
  unit?: string
  department?: string
  createdAt: string
  lastLogin?: string
}

export interface AccountDetailResponseBE extends AccountResponseBE {
  activities?: AccountActivity[]
}

export const accountService = {
  /**
   * Lấy danh sách tài khoản người dùng có phân trang và bộ lọc
   */
  getAccounts: async (params?: AccountListParams) => {
    const res = await apiClient.get<ApiResponse<PageResponseBE<AccountResponseBE>>>(
      API_ENDPOINTS.admin.accounts,
      { params },
    )
    return res.data.data
  },

  /**
   * Lấy tất cả khóa sinh viên cho bộ lọc "Tất cả khóa" (GET /student/batch/all), ví dụ ["K63", "K64"]
   */
  getAllStudentBatches: async (): Promise<string[]> => {
    const res = await apiClient.get<ApiResponse<string[]>>(API_ENDPOINTS.admin.studentBatchAll)
    return res.data.data ?? []
  },

  /**
   * Danh sách tài khoản sinh viên có lọc + phân trang (GET /student/account)
   */
  getStudentAccounts: async (
    params: StudentAccountListParams,
  ): Promise<SpringPage<StudentAccountItem>> => {
    const res = await apiClient.get<ApiResponse<RawSpringPage<StudentAccountItem>>>(
      API_ENDPOINTS.admin.studentAccounts,
      // indexes: null → sort=a,asc&sort=b,desc như Spring cần
      { params: compactParams(params), paramsSerializer: { indexes: null } },
    )
    return toSpringPage(res.data.data, params)
  },

  /**
   * Chi tiết một tài khoản sinh viên (GET /student/account/{publicId})
   */
  getStudentAccountDetail: async (publicId: string): Promise<StudentAccountDetail> => {
    const res = await apiClient.get<ApiResponse<StudentAccountDetail>>(
      API_ENDPOINTS.admin.studentAccountDetail(publicId),
    )
    return res.data.data
  },

  /**
   * Xóa tài khoản sinh viên (DELETE /student/account/{publicId}).
   * BE tự quyết định xóa hẳn hay chỉ khóa → trả về message BE để hiện toast.
   */
  deleteStudentAccount: async (publicId: string): Promise<string> => {
    const res = await apiClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.admin.studentAccountDetail(publicId),
    )
    return res.data.message || 'Xóa tài khoản sinh viên thành công'
  },

  /**
   * Sửa tài khoản sinh viên (PUT /student/account/{publicId}): đổi được ngành, mở / khóa tài khoản.
   * BE trả data rỗng, chỉ có code + message (1000 "Đã cập nhật: ..." / 1103 không đổi gì)
   */
  updateStudentAccount: async ({
    publicId,
    body,
  }: {
    publicId: string
    body: StudentAccountUpdateRequest
  }): Promise<StudentWriteResult> => {
    const res = await apiClient.put<ApiResponse<unknown>>(
      API_ENDPOINTS.admin.studentAccountDetail(publicId),
      body,
      // Lỗi hiện ngay trong form. Cảnh báo 11xx vẫn để interceptor hiện toast vàng
      { skipErrorToast: true },
    )
    return { code: res.data.code, message: res.data.message }
  },

  /**
   * Thêm tài khoản sinh viên (POST /student/account): chỉ tạo tài khoản, không gắn học kì.
   * Dùng cho popup "Thêm sinh viên" và gửi lại dòng import bị lỗi
   */
  createStudentAccount: async (body: StudentCreationRequest): Promise<StudentWriteResult> => {
    const res = await apiClient.post<ApiResponse<unknown>>(
      API_ENDPOINTS.admin.studentAccounts,
      body,
      // Lỗi (4000, 3014) hiện ngay trong form
      { skipErrorToast: true },
    )
    return { code: res.data.code, message: res.data.message }
  },

  /**
   * Import file Excel tạo tài khoản sinh viên (POST /student/account/import), cùng file mẫu với Trưởng bộ môn
   */
  importStudentAccounts: async (file: File): Promise<StudentImportResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await apiClient.post<ApiResponse<StudentImportResponse>>(
      API_ENDPOINTS.admin.studentAccountImport,
      formData,
      {
        // apiClient mặc định gửi JSON. Đổi sang multipart thì trình duyệt tự thêm boundary
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: IMPORT_TIMEOUT_MS,
        // Lỗi mức toàn file (code 4000) hiện ngay dưới ô chọn file, không toast
        skipErrorToast: true,
      },
    )
    return res.data.data
  },

  /**
   * Xuất Excel theo đúng bộ lọc đang chọn (GET /student/account/export). Body là file .xlsx, không bọc APIResponse
   */
  exportStudentAccounts: async (params: StudentAccountExportParams): Promise<DownloadedFile> => {
    const res = await apiClient.get<Blob>(API_ENDPOINTS.admin.studentAccountExport, {
      params: compactParams(params),
      paramsSerializer: { indexes: null },
      responseType: 'blob',
      timeout: EXPORT_TIMEOUT_MS,
    })
    return {
      blob: res.data,
      filename: getFilenameFromDisposition(
        res.headers['content-disposition'] as string | undefined,
        EXPORT_FALLBACK_FILENAME,
      ),
    }
  },

  /**
   * Lấy thông tin chi tiết một tài khoản
   */
  getAccountById: async (id: string | number) => {
    const res = await apiClient.get<ApiResponse<AccountDetailResponseBE>>(
      `${API_ENDPOINTS.admin.accounts}/${id}`,
    )
    return res.data.data
  },

  /**
   * Tạo tài khoản mới (Sinh viên / Giảng viên)
   */
  createAccount: async (body: AddAccountFormValues) => {
    const res = await apiClient.post<ApiResponse<AccountResponseBE>>(
      API_ENDPOINTS.admin.accounts,
      body,
    )
    return res.data.data
  },

  /**
   * Cập nhật thông tin vai trò hoặc trạng thái tài khoản
   */
  updateAccountStatus: async (
    id: string | number,
    data: { role?: AccountRole; status?: AccountStatus },
  ) => {
    const res = await apiClient.patch<ApiResponse<void>>(
      `${API_ENDPOINTS.admin.accounts}/${id}`,
      data,
    )
    return res.data.data
  },

  /**
   * Lấy lịch sử hoạt động của một tài khoản
   */
  getAccountActivities: async (id: string | number) => {
    const res = await apiClient.get<ApiResponse<AccountActivity[]>>(
      `${API_ENDPOINTS.admin.accounts}/${id}/activities`,
    )
    return res.data.data
  },
}
