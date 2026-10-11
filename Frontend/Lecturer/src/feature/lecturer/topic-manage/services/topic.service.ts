import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types'
import type { LecturerTopicDto } from '../types'

export interface ITopicService {
  getManagedTopics(): Promise<LecturerTopicDto[]>
  createTopic(dto: LecturerTopicDto): Promise<LecturerTopicDto>
  updateTopic(topicId: string, dto: Partial<LecturerTopicDto>): Promise<LecturerTopicDto>
  deleteTopic(topicId: string): Promise<boolean>
}

export const lecturerTopicService: ITopicService = {
  // GET: Lấy danh sách đề tài do giảng viên hướng dẫn quản lý
  getManagedTopics: async (): Promise<LecturerTopicDto[]> => {
    try {
      const res = await apiClient.get<ApiResponse<LecturerTopicDto[]>>(
        API_ENDPOINTS.lecturer.topics,
      )
      return res.data.data
    } catch {
      return [
        {
          id: 'topic-1',
          title: 'Hệ thống hỗ trợ phân tích phản hồi khách hàng bằng NLP',
          description: 'Xây dựng pipeline phân tích sentiment và clustering chủ đề từ review đa kênh.',
          maxStudents: 2,
          targetMajor: 'Kỹ thuật phần mềm',
          status: 'assigned',
        },
        {
          id: 'topic-2',
          title: 'Ứng dụng Computer Vision nhận diện biển báo giao thông',
          description: 'Phát hiện và phân loại biển báo thời gian thực trên camera hành trình.',
          maxStudents: 2,
          targetMajor: 'Trí tuệ nhân tạo',
          status: 'assigned',
        },
        {
          id: 'topic-3',
          title: 'Nền tảng quản lý chuỗi cung ứng trên nền tảng Blockchain',
          description: 'Truy xuất nguồn gốc hàng hóa nông sản sử dụng hợp đồng thông minh Solidity.',
          maxStudents: 2,
          targetMajor: 'Hệ thống thông tin',
          status: 'assigned',
        },
        {
          id: 'topic-4',
          title: 'Ứng dụng kiến trúc Microservices cho hệ thống quản lý thư viện số',
          description: 'Triển khai Docker Kubernetes, áp dụng CQRS và Event-driven.',
          maxStudents: 2,
          targetMajor: 'Kỹ thuật phần mềm',
          status: 'published',
        },
        {
          id: 'topic-5',
          title: 'Hệ thống phát hiện mã độc nhúng trong văn bản tài liệu',
          description: 'Phân tích hành vi tệp tin PDF/Word bằng học máy.',
          maxStudents: 2,
          targetMajor: 'An toàn thông tin',
          status: 'draft',
        },
      ]
    }
  },

  // POST: Tạo đề tài tốt nghiệp mới
  createTopic: async (dto: LecturerTopicDto): Promise<LecturerTopicDto> => {
    try {
      const res = await apiClient.post<ApiResponse<LecturerTopicDto>>(
        API_ENDPOINTS.lecturer.topics,
        dto,
      )
      return res.data.data
    } catch {
      return {
        id: `topic-${Date.now()}`,
        ...dto,
        status: 'published',
      }
    }
  },

  // PUT: Cập nhật thông tin đề tài
  updateTopic: async (
    topicId: string,
    dto: Partial<LecturerTopicDto>,
  ): Promise<LecturerTopicDto> => {
    try {
      const res = await apiClient.put<ApiResponse<LecturerTopicDto>>(
        `${API_ENDPOINTS.lecturer.topics}/${topicId}`,
        dto,
      )
      return res.data.data
    } catch {
      return {
        id: topicId,
        title: dto.title || 'Đề tài mẫu',
        description: dto.description || '',
        maxStudents: dto.maxStudents || 2,
        targetMajor: dto.targetMajor || 'Kỹ thuật phần mềm',
        ...dto,
      }
    }
  },

  // DELETE: Xóa đề tài chưa có sinh viên đăng ký
  deleteTopic: async (topicId: string): Promise<boolean> => {
    try {
      const res = await apiClient.delete<ApiResponse<boolean>>(
        `${API_ENDPOINTS.lecturer.topics}/${topicId}`,
      )
      return res.data.data
    } catch {
      return true
    }
  },
}
