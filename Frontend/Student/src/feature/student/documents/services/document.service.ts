import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types'
import type { GraduationDocument } from '../types'

export interface IDocumentService {
  getDocuments(): Promise<GraduationDocument[]>
  downloadDocumentBlob(documentId: string): Promise<Blob>
}

export const studentDocumentService: IDocumentService = {
  // GET: Lấy danh sách biểu mẫu và tài liệu hướng dẫn
  getDocuments: async (): Promise<GraduationDocument[]> => {
    try {
      const res = await apiClient.get<ApiResponse<GraduationDocument[]>>(
        API_ENDPOINTS.student.documents,
      )
      return res.data.data
    } catch {
      return [
        {
          id: 'doc-1',
          title: 'Mẫu đề cương chi tiết đồ án tốt nghiệp',
          code: 'BM-DATN-01',
          fileExtension: 'docx',
          fileSize: 125000,
          downloadUrl: '#',
        },
        {
          id: 'doc-2',
          title: 'Sổ tay hướng dẫn trình bày đồ án chuẩn IEEE',
          code: 'HD-DATN-02',
          fileExtension: 'pdf',
          fileSize: 1540000,
          downloadUrl: '#',
        },
        {
          id: 'doc-3',
          title: 'Biểu mẫu nhật ký theo dõi tiến độ tuần',
          code: 'BM-DATN-03',
          fileExtension: 'xlsx',
          fileSize: 85000,
          downloadUrl: '#',
        },
      ]
    }
  },

  // GET: Tải tệp tài liệu về dưới dạng blob
  downloadDocumentBlob: async (documentId: string): Promise<Blob> => {
    try {
      const res = await apiClient.get<Blob>(
        `${API_ENDPOINTS.student.documents}/${documentId}/download`,
        { responseType: 'blob' },
      )
      return res.data
    } catch {
      return new Blob(['Mock document content'], { type: 'application/pdf' })
    }
  },
}
