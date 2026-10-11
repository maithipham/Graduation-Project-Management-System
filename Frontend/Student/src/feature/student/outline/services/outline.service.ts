import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types'
import type { StudentOutline } from '../types'

export interface IOutlineService {
  getOutline(): Promise<StudentOutline>
  submitOutline(formData: FormData, signal?: AbortSignal): Promise<StudentOutline>
  updateOutline(outlineId: string, data: Partial<StudentOutline>): Promise<StudentOutline>
  deleteDraftOutline(outlineId: string): Promise<boolean>
}

export const studentOutlineService: IOutlineService = {
  // GET: Lấy thông tin đề cương hiện tại
  getOutline: async (): Promise<StudentOutline> => {
    try {
      const res = await apiClient.get<ApiResponse<StudentOutline>>(
        API_ENDPOINTS.student.outline,
      )
      return res.data.data
    } catch {
      return {
        id: 'out-1',
        title: 'Đề cương chi tiết: Hệ thống hỗ trợ phân tích phản hồi khách hàng bằng NLP',
        fileName: 'de_cuong_chi_tiet_v2.docx',
        fileUrl: '/mock/de_cuong_v2.docx',
        submittedAt: '2026-10-10 16:30',
        version: 2,
        status: 'needs_revision',
        feedback: 'Cần làm rõ thêm mô hình sentiment analysis và thuật toán tiền xử lý tiếng Việt.',
      }
    }
  },

  // POST: Nộp bản đề cương mới kèm file upload (hỗ trợ AbortSignal)
  submitOutline: async (
    formData: FormData,
    signal?: AbortSignal,
  ): Promise<StudentOutline> => {
    try {
      const res = await apiClient.post<ApiResponse<StudentOutline>>(
        API_ENDPOINTS.student.outline,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          signal,
        },
      )
      return res.data.data
    } catch {
      return {
        id: `out-${Date.now()}`,
        title: 'Đề cương chi tiết (Bản nộp mới)',
        fileName: 'de_cuong_moi.docx',
        fileUrl: '#',
        submittedAt: new Date().toISOString(),
        version: 3,
        status: 'submitted',
      }
    }
  },

  // PUT: Chỉnh sửa thông tin/ghi chú đề cương
  updateOutline: async (
    outlineId: string,
    data: Partial<StudentOutline>,
  ): Promise<StudentOutline> => {
    try {
      const res = await apiClient.put<ApiResponse<StudentOutline>>(
        `${API_ENDPOINTS.student.outline}/${outlineId}`,
        data,
      )
      return res.data.data
    } catch {
      return {
        id: outlineId,
        title: data.title || '',
        fileName: data.fileName || '',
        fileUrl: data.fileUrl || '',
        submittedAt: new Date().toISOString(),
        version: data.version || 1,
        status: data.status || 'draft',
        ...data,
      }
    }
  },

  // DELETE: Xóa bản nháp đề cương
  deleteDraftOutline: async (outlineId: string): Promise<boolean> => {
    try {
      const res = await apiClient.delete<ApiResponse<boolean>>(
        `${API_ENDPOINTS.student.outline}/${outlineId}`,
      )
      return res.data.data
    } catch {
      return true
    }
  },
}
