import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types'
import type { StudentTopic, TopicRegistrationDto } from '../types'

export interface IRegistrationService {
  getAvailableTopics(): Promise<StudentTopic[]>
  getCurrentRegisteredTopic(): Promise<StudentTopic | null>
  registerTopic(dto: TopicRegistrationDto): Promise<StudentTopic>
  cancelRegistration(registrationId: string): Promise<boolean>
}

export const studentRegistrationService: IRegistrationService = {
  // GET: Lấy danh sách đề tài mở cho sinh viên đăng ký
  getAvailableTopics: async (): Promise<StudentTopic[]> => {
    try {
      const res = await apiClient.get<ApiResponse<StudentTopic[]>>(
        API_ENDPOINTS.student.registration,
      )
      return res.data.data
    } catch {
      return [
        {
          id: 'topic-1',
          code: 'DATN-26-0148',
          title: 'Hệ thống hỗ trợ phân tích phản hồi khách hàng bằng xử lý ngôn ngữ tự nhiên',
          lecturerName: 'TS. Trần Minh Khôi',
          department: 'Công nghệ phần mềm',
          status: 'approved',
        },
      ]
    }
  },

  // GET: Lấy đề tài hiện tại sinh viên đã đăng ký
  getCurrentRegisteredTopic: async (): Promise<StudentTopic | null> => {
    try {
      const res = await apiClient.get<ApiResponse<StudentTopic | null>>(
        `${API_ENDPOINTS.student.registration}/current`,
      )
      return res.data.data
    } catch {
      return {
        id: 'topic-1',
        code: 'DATN-26-0148',
        title: 'Hệ thống hỗ trợ phân tích phản hồi khách hàng bằng xử lý ngôn ngữ tự nhiên',
        lecturerName: 'TS. Trần Minh Khôi',
        department: 'Công nghệ phần mềm',
        status: 'approved',
      }
    }
  },

  // POST: Đăng ký đề tài
  registerTopic: async (dto: TopicRegistrationDto): Promise<StudentTopic> => {
    try {
      const res = await apiClient.post<ApiResponse<StudentTopic>>(
        API_ENDPOINTS.student.registration,
        dto,
      )
      return res.data.data
    } catch {
      return {
        id: dto.topicId,
        code: 'DATN-26-0148',
        title: 'Hệ thống hỗ trợ phân tích phản hồi khách hàng bằng NLP',
        lecturerName: 'TS. Trần Minh Khôi',
        department: 'Công nghệ phần mềm',
        status: 'pending',
      }
    }
  },

  // DELETE: Hủy đăng ký đề tài (khi chưa khóa)
  cancelRegistration: async (registrationId: string): Promise<boolean> => {
    try {
      const res = await apiClient.delete<ApiResponse<boolean>>(
        `${API_ENDPOINTS.student.registration}/${registrationId}`,
      )
      return res.data.data
    } catch {
      return true
    }
  },
}
