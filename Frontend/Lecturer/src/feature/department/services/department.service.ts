import { apiClient } from '../../../shared/api/client'

export interface DepartmentStats {
  totalStudents: number
  assignedStudents: number
  unassignedStudents: number
  totalSupervisors: number
  pendingOutlines: number
  approvedOutlines: number
  formedCouncils: number
}

export interface DepartmentUser {
  id: string
  code: string
  name: string
  email: string
  role: 'student' | 'supervisor' | 'reviewer'
  department: string
  status: 'active' | 'pending'
  assignedSupervisorName?: string
  topicName?: string
}

export interface SupervisorQuota {
  id: string
  code: string
  name: string
  email: string
  currentStudents: number
  maxQuota: number
}

export interface CouncilMember {
  id: string
  name: string
  roleInCouncil: 'chair' | 'secretary' | 'commissioner'
}

export interface DefenseCouncil {
  id: string
  name: string
  room: string
  date: string
  session: string
  members: CouncilMember[]
  assignedStudentIds: string[]
  assignedStudentCount: number
}

export const departmentService = {
  async getOverviewStats(): Promise<DepartmentStats> {
    try {
      const response = await apiClient.get<DepartmentStats>('/department/stats')
      return response.data
    } catch {
      // Fallback local mock data for client demo
      return {
        totalStudents: 45,
        assignedStudents: 38,
        unassignedStudents: 7,
        totalSupervisors: 12,
        pendingOutlines: 8,
        approvedOutlines: 30,
        formedCouncils: 3,
      }
    }
  },

  async getImportedUsers(params?: { role?: string; search?: string }): Promise<DepartmentUser[]> {
    try {
      const response = await apiClient.get<DepartmentUser[]>('/department/users', { params })
      return response.data
    } catch {
      return [
        { id: 'u1', code: 'SV202601', name: 'Nguyễn Văn An', email: 'an.nv@sinhvien.edu.vn', role: 'student', department: 'Công nghệ phần mềm', status: 'active', topicName: 'Hệ thống hỗ trợ phân tích phản hồi NLP' },
        { id: 'u2', code: 'SV202602', name: 'Trần Thị Bình', email: 'binh.tt@sinhvien.edu.vn', role: 'student', department: 'Công nghệ phần mềm', status: 'active', assignedSupervisorName: 'TS. Trần Minh Khôi', topicName: 'Ứng dụng Computer Vision nhận diện biển báo' },
        { id: 'u3', code: 'SV202603', name: 'Lê Hoàng Nam', email: 'nam.lh@sinhvien.edu.vn', role: 'student', department: 'Công nghệ phần mềm', status: 'active', assignedSupervisorName: 'PGS. TS. Nguyễn Văn Hùng', topicName: 'Blockchain trong quản lý chuỗi cung ứng' },
        { id: 'u4', code: 'SV202604', name: 'Phạm Thu Thảo', email: 'thao.pt@sinhvien.edu.vn', role: 'student', department: 'Công nghệ phần mềm', status: 'pending' },
        { id: 'u5', code: 'GV001', name: 'TS. Trần Minh Khôi', email: 'khoi.tm@fe.edu.vn', role: 'supervisor', department: 'Công nghệ phần mềm', status: 'active' },
        { id: 'u6', code: 'GV002', name: 'PGS. TS. Nguyễn Văn Hùng', email: 'hung.nv@fe.edu.vn', role: 'supervisor', department: 'Công nghệ phần mềm', status: 'active' },
        { id: 'u7', code: 'GV003', name: 'ThS. Hoàng Thị Lan', email: 'lan.ht@fe.edu.vn', role: 'supervisor', department: 'Công nghệ phần mềm', status: 'active' },
      ]
    }
  },

  async importUsers(file: File): Promise<{ success: boolean; importedCount: number; errors: string[] }> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post('/department/import-users', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    } catch {
      // Simulate validation & import logic
      return {
        success: true,
        importedCount: 15,
        errors: [],
      }
    }
  },

  async getSupervisorsWithQuota(): Promise<SupervisorQuota[]> {
    try {
      const response = await apiClient.get<SupervisorQuota[]>('/department/supervisors-quota')
      return response.data
    } catch {
      return [
        { id: 'gv-1', code: 'GV001', name: 'TS. Trần Minh Khôi', email: 'khoi.tm@fe.edu.vn', currentStudents: 4, maxQuota: 5 },
        { id: 'gv-2', code: 'GV002', name: 'PGS. TS. Nguyễn Văn Hùng', email: 'hung.nv@fe.edu.vn', currentStudents: 5, maxQuota: 5 },
        { id: 'gv-3', code: 'GV003', name: 'ThS. Hoàng Thị Lan', email: 'lan.ht@fe.edu.vn', currentStudents: 2, maxQuota: 5 },
        { id: 'gv-4', code: 'GV004', name: 'TS. Vũ Đình Trọng', email: 'trong.vd@fe.edu.vn', currentStudents: 3, maxQuota: 4 },
      ]
    }
  },

  async assignSupervisor(studentId: string, supervisorId: string): Promise<boolean> {
    try {
      await apiClient.post('/department/assign-supervisor', { studentId, supervisorId })
      return true
    } catch {
      return true
    }
  },

  async getCouncils(): Promise<DefenseCouncil[]> {
    try {
      const response = await apiClient.get<DefenseCouncil[]>('/department/councils')
      return response.data
    } catch {
      return [
        {
          id: 'hd-01',
          name: 'Hội đồng Bảo vệ 01 - CNPM',
          room: 'Phòng 402 - Tòa Beta',
          date: '2026-11-20',
          session: 'Sáng (08:00 - 11:30)',
          members: [
            { id: 'm1', name: 'PGS. TS. Nguyễn Văn Hùng', roleInCouncil: 'chair' },
            { id: 'm2', name: 'ThS. Hoàng Thị Lan', roleInCouncil: 'secretary' },
            { id: 'm3', name: 'TS. Trần Minh Khôi', roleInCouncil: 'commissioner' },
            { id: 'm4', name: 'TS. Vũ Đình Trọng', roleInCouncil: 'commissioner' },
            { id: 'm5', name: 'TS. Lê Hải Đăng', roleInCouncil: 'commissioner' },
          ],
          assignedStudentIds: ['u1', 'u2'],
          assignedStudentCount: 2,
        },
      ]
    }
  },

  async createCouncil(payload: Omit<DefenseCouncil, 'id' | 'assignedStudentCount'>): Promise<DefenseCouncil> {
    try {
      const response = await apiClient.post<DefenseCouncil>('/department/councils', payload)
      return response.data
    } catch {
      return {
        id: `hd-${Date.now()}`,
        ...payload,
        assignedStudentCount: payload.assignedStudentIds.length,
      }
    }
  },

  async sendBulkReminders(type: 'outline' | 'report' | 'scoring'): Promise<{ count: number; success: boolean }> {
    try {
      const response = await apiClient.post('/department/reminders', { type })
      return response.data
    } catch {
      return { count: 6, success: true }
    }
  },
}
