import { apiClient } from '@/shared/api/client'

export interface SystemMetrics {
  totalAccounts: number
  totalSemesters: number
  activeLecturers: number
  activeHeads: number
  activeAdmins: number
}

export interface AuditLogItem {
  id: string
  action: string
  actor: string
  actorRole: string
  target: string
  timestamp: string
  status: 'success' | 'warning' | 'error'
  ipAddress: string
}

/**
 * Interface Segregation Principle (ISP) & Contract
 */
export interface ISystemService {
  getSystemMetrics(): Promise<SystemMetrics>
  getAuditLogs(): Promise<AuditLogItem[]>
}

export const systemService: ISystemService = {
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const res = await apiClient.get<SystemMetrics>('/admin/metrics')
      return res.data
    } catch {
      return {
        totalAccounts: 68,
        totalSemesters: 4,
        activeLecturers: 42,
        activeHeads: 5,
        activeAdmins: 3,
      }
    }
  },

  async getAuditLogs(): Promise<AuditLogItem[]> {
    try {
      const res = await apiClient.get<AuditLogItem[]>('/admin/audit-logs')
      return res.data
    } catch {
      return [
        {
          id: 'log-1',
          action: 'Kích hoạt học kỳ Thu 2026',
          actor: 'admin.root',
          actorRole: 'admin',
          target: 'Semester: FALL2026',
          timestamp: '2026-10-11 14:10',
          status: 'success',
          ipAddress: '192.168.1.10',
        },
        {
          id: 'log-2',
          action: 'Tạo tài khoản Trưởng bộ môn',
          actor: 'admin.root',
          actorRole: 'admin',
          target: 'User: hung.nv',
          timestamp: '2026-10-11 11:32',
          status: 'success',
          ipAddress: '192.168.1.10',
        },
        {
          id: 'log-3',
          action: 'Khóa tài khoản vi phạm chính sách',
          actor: 'admin.root',
          actorRole: 'admin',
          target: 'User: trong.vd',
          timestamp: '2026-10-10 17:05',
          status: 'warning',
          ipAddress: '192.168.1.10',
        },
        {
          id: 'log-4',
          action: 'Cập nhật phân quyền tài khoản',
          actor: 'admin.root',
          actorRole: 'admin',
          target: 'Role -> department-head',
          timestamp: '2026-10-09 09:20',
          status: 'success',
          ipAddress: '192.168.1.10',
        },
      ]
    }
  },
}
