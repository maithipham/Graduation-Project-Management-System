import { apiClient } from '@/shared/api/client'

export interface Major {
  id: string
  code: string
  name: string
  department: string
  totalTopics: number
  totalStudents: number
  isActive: boolean
}

export interface CreateMajorDto {
  code: string
  name: string
  department: string
}

/**
 * Interface Segregation Principle (ISP) & Contract
 */
export interface IMajorService {
  getMajors(): Promise<Major[]>
  createMajor(data: CreateMajorDto): Promise<Major>
  toggleMajorStatus(id: string, isActive: boolean): Promise<boolean>
}

export const majorService: IMajorService = {
  async getMajors(): Promise<Major[]> {
    try {
      const res = await apiClient.get<Major[]>('/admin/majors')
      return res.data
    } catch {
      return [
        {
          id: 'maj-1',
          code: 'SE',
          name: 'Kỹ thuật phần mềm (Software Engineering)',
          department: 'Khoa CNTT - Bộ môn CNPM',
          totalTopics: 28,
          totalStudents: 56,
          isActive: true,
        },
        {
          id: 'maj-2',
          code: 'IA',
          name: 'An toàn thông tin (Information Assurance)',
          department: 'Khoa CNTT - Bộ môn ATTT',
          totalTopics: 15,
          totalStudents: 30,
          isActive: true,
        },
        {
          id: 'maj-3',
          code: 'AI',
          name: 'Trí tuệ nhân tạo (Artificial Intelligence)',
          department: 'Khoa CNTT - Bộ môn KHMT',
          totalTopics: 20,
          totalStudents: 40,
          isActive: true,
        },
        {
          id: 'maj-4',
          code: 'IS',
          name: 'Hệ thống thông tin (Information Systems)',
          department: 'Khoa CNTT - Bộ môn HTTT',
          totalTopics: 12,
          totalStudents: 24,
          isActive: true,
        },
      ]
    }
  },

  async createMajor(data: CreateMajorDto): Promise<Major> {
    try {
      const res = await apiClient.post<Major>('/admin/majors', data)
      return res.data
    } catch {
      return {
        id: `maj-${Date.now()}`,
        code: data.code,
        name: data.name,
        department: data.department,
        totalTopics: 0,
        totalStudents: 0,
        isActive: true,
      }
    }
  },

  async toggleMajorStatus(id: string, isActive: boolean): Promise<boolean> {
    try {
      await apiClient.patch(`/admin/majors/${id}/status`, { isActive })
      return true
    } catch {
      return true
    }
  },
}
