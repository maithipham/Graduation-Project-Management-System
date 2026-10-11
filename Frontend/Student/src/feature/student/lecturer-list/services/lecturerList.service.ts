import { apiClient } from '@/shared/api/client'
import type { LecturerInfo } from '../types'

export interface ILecturerListService {
  getLecturers(): Promise<LecturerInfo[]>
}

export const studentLecturerListService: ILecturerListService = {
  getLecturers: async (): Promise<LecturerInfo[]> => {
    try {
      const res = await apiClient.get<LecturerInfo[]>('/student/lecturers')
      return res.data
    } catch {
      return [
        { name: 'TS. Trần Minh Khôi', dept: 'Bộ môn CNPM', email: 'khoitm@tlu.edu.vn', quota: '4/5', field: 'NLP, AI Engineering' },
        { name: 'PGS. TS. Nguyễn Văn Hùng', dept: 'Bộ môn Hệ thống thông tin', email: 'hungnv@tlu.edu.vn', quota: '5/5', field: 'Data Mining, BI' },
        { name: 'ThS. Lê Thị Mai', dept: 'Bộ môn Mạng & ATTT', email: 'mailt@tlu.edu.vn', quota: '2/4', field: 'Cloud Security, DevOps' },
      ]
    }
  },
}
