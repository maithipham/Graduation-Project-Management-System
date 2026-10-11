import { apiClient } from '@/shared/api/client'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/types'
import type { WeeklyReport } from '../types'

export interface IReportService {
  getWeeklyReports(): Promise<WeeklyReport[]>
  submitWeeklyReport(data: Omit<WeeklyReport, 'id' | 'submittedAt' | 'status'>): Promise<WeeklyReport>
  updateWeeklyReport(reportId: string, data: Partial<WeeklyReport>): Promise<WeeklyReport>
}

export const studentReportService: IReportService = {
  // GET: Lấy danh sách báo cáo tiến độ tuần
  getWeeklyReports: async (): Promise<WeeklyReport[]> => {
    try {
      const res = await apiClient.get<ApiResponse<WeeklyReport[]>>(
        API_ENDPOINTS.student.reports,
      )
      return res.data.data
    } catch {
      return [
        {
          id: 'rep-1',
          weekNumber: 1,
          tasksDone: 'Thu thập tài liệu và khảo sát các mô hình BERT / RoBERTa',
          nextWeekTasks: 'Xây dựng sơ đồ kiến trúc tổng thể của hệ thống',
          submittedAt: '2026-09-15',
          status: 'reviewed',
          lecturerComment: 'Đã hoàn thành tốt.',
        },
        {
          id: 'rep-2',
          weekNumber: 2,
          tasksDone: 'Thiết kế cơ sở dữ liệu và dựng API backend Node.js',
          nextWeekTasks: 'Viết đề cương chi tiết',
          submittedAt: '2026-09-22',
          status: 'reviewed',
          lecturerComment: 'Cần chú ý chuẩn hóa dữ liệu.',
        },
      ]
    }
  },

  // POST: Nộp báo cáo tuần mới
  submitWeeklyReport: async (
    data: Omit<WeeklyReport, 'id' | 'submittedAt' | 'status'>,
  ): Promise<WeeklyReport> => {
    try {
      const res = await apiClient.post<ApiResponse<WeeklyReport>>(
        API_ENDPOINTS.student.reports,
        data,
      )
      return res.data.data
    } catch {
      return {
        id: `rep-${Date.now()}`,
        submittedAt: new Date().toISOString(),
        status: 'submitted',
        ...data,
      }
    }
  },

  // PUT: Sửa nội dung báo cáo tuần
  updateWeeklyReport: async (
    reportId: string,
    data: Partial<WeeklyReport>,
  ): Promise<WeeklyReport> => {
    try {
      const res = await apiClient.put<ApiResponse<WeeklyReport>>(
        `${API_ENDPOINTS.student.reports}/${reportId}`,
        data,
      )
      return res.data.data
    } catch {
      return {
        id: reportId,
        weekNumber: data.weekNumber || 1,
        tasksDone: data.tasksDone || '',
        nextWeekTasks: data.nextWeekTasks || '',
        submittedAt: new Date().toISOString(),
        status: 'submitted',
        ...data,
      }
    }
  },
}
