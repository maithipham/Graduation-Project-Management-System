import { apiClient } from '@/shared/api/client'
import type { LecturerDashboardStats, SupervisedStudent } from '../types'

export interface IDashboardService {
  getOverviewStats(): Promise<LecturerDashboardStats>
  getSupervisedStudents(): Promise<SupervisedStudent[]>
}

export const dashboardService: IDashboardService = {
  async getOverviewStats(): Promise<LecturerDashboardStats> {
    try {
      const res = await apiClient.get<LecturerDashboardStats>('/lecturer/dashboard/stats')
      return res.data
    } catch {
      return {
        supervisedCount: 4,
        maxQuota: 5,
        pendingOutlinesCount: 2,
        weeklyReportsCount: 4,
        councilsCount: 2,
      }
    }
  },

  async getSupervisedStudents(): Promise<SupervisedStudent[]> {
    try {
      const res = await apiClient.get<SupervisedStudent[]>('/lecturer/dashboard/students')
      return res.data
    } catch {
      return [
        { msv: '2251061234', name: 'Nguyễn Văn An', topic: 'Hệ thống hỗ trợ phân tích phản hồi khách hàng bằng NLP', status: 'Cần sửa đề cương' },
        { msv: '2251065678', name: 'Trần Thị Bình', topic: 'Ứng dụng Computer Vision nhận diện biển báo giao thông', status: 'Đang làm đồ án' },
        { msv: '2251069012', name: 'Lê Hoàng Nam', topic: 'Nền tảng quản lý chuỗi cung ứng trên nền tảng Blockchain', status: 'Đang làm đồ án' },
      ]
    }
  },
}
