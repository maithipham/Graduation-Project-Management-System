import { apiClient } from '@/shared/api/client'
import type { DepartmentInfo, DepartmentAnnouncement } from '../types'

export interface IDepartmentContactService {
  getDepartmentInfo(): Promise<DepartmentInfo>
  getAnnouncements(): Promise<DepartmentAnnouncement[]>
}

export const departmentContactService: IDepartmentContactService = {
  getDepartmentInfo: async (): Promise<DepartmentInfo> => {
    try {
      const res = await apiClient.get<DepartmentInfo>('/lecturer/department/info')
      return res.data
    } catch {
      return {
        name: 'Bộ môn Công nghệ phần mềm',
        dean: 'PGS. TS. Nguyễn Văn Hùng',
        totalSupervisors: 12,
        totalGraduationStudents: 45,
        assignedRate: '100% (45/45)',
      }
    }
  },

  getAnnouncements: async (): Promise<DepartmentAnnouncement[]> => {
    try {
      const res = await apiClient.get<DepartmentAnnouncement[]>('/lecturer/department/announcements')
      return res.data
    } catch {
      return [
        {
          id: 'ann-1',
          title: 'Hạn chót nộp bản nhận xét đề cương lần 2: 15/10/2026',
          date: '2026-10-08',
          isUrgent: true,
        },
        {
          id: 'ann-2',
          title: 'Lịch họp hội đồng duyệt danh sách bảo vệ đợt 1',
          date: '2026-10-05',
          isUrgent: false,
        },
      ]
    }
  },
}
