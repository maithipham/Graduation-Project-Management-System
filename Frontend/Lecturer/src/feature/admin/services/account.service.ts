import { apiClient } from '@/shared/api/client'
import type { UserRole } from '@/feature/auth/types'

export interface AdminAccount {
  id: string
  username: string
  name: string
  email: string
  role: UserRole
  status: 'active' | 'suspended'
  department?: string
  createdAt: string
  lastLogin?: string
}

export interface AccountFilterParams {
  role?: string
  search?: string
  status?: string
}

export interface CreateAccountDto {
  username?: string
  name: string
  email: string
  role: UserRole
  department?: string
}

/**
 * Interface Segregation Principle (ISP) & Contract
 */
export interface IAccountService {
  getAccounts(params?: AccountFilterParams): Promise<AdminAccount[]>
  createAccount(data: CreateAccountDto): Promise<AdminAccount>
  updateAccountStatus(id: string, status: 'active' | 'suspended'): Promise<boolean>
}

export const accountService: IAccountService = {
  async getAccounts(params?: AccountFilterParams): Promise<AdminAccount[]> {
    try {
      const res = await apiClient.get<AdminAccount[]>('/admin/accounts', { params })
      return res.data
    } catch {
      return [
        {
          id: 'acc-1',
          username: 'admin.root',
          name: 'Quản trị viên Hệ thống',
          email: 'admin@gpms.edu.vn',
          role: 'admin',
          status: 'active',
          department: 'Phòng Đào tạo',
          createdAt: '2025-09-01',
          lastLogin: '2026-10-11 14:20',
        },
        {
          id: 'acc-2',
          username: 'hung.nv',
          name: 'PGS. TS. Nguyễn Văn Hùng',
          email: 'hung.nv@fe.edu.vn',
          role: 'department-head',
          status: 'active',
          department: 'Khoa CNTT - Bộ môn CNPM',
          createdAt: '2025-09-10',
          lastLogin: '2026-10-11 09:15',
        },
        {
          id: 'acc-3',
          username: 'khoi.tm',
          name: 'TS. Trần Minh Khôi',
          email: 'khoi.tm@fe.edu.vn',
          role: 'lecturer',
          status: 'active',
          department: 'Bộ môn CNPM',
          createdAt: '2025-09-15',
          lastLogin: '2026-10-11 11:30',
        },
        {
          id: 'acc-4',
          username: 'lan.ht',
          name: 'ThS. Hoàng Thị Lan',
          email: 'lan.ht@fe.edu.vn',
          role: 'lecturer',
          status: 'active',
          department: 'Bộ môn CNPM',
          createdAt: '2025-09-20',
          lastLogin: '2026-10-10 16:45',
        },
        {
          id: 'acc-5',
          username: 'trong.vd',
          name: 'TS. Vũ Đình Trọng',
          email: 'trong.vd@fe.edu.vn',
          role: 'lecturer',
          status: 'suspended',
          department: 'Bộ môn Hệ thống thông tin',
          createdAt: '2025-10-01',
          lastLogin: '2026-09-15 08:20',
        },
      ]
    }
  },

  async createAccount(data: CreateAccountDto): Promise<AdminAccount> {
    try {
      const res = await apiClient.post<AdminAccount>('/admin/accounts', data)
      return res.data
    } catch {
      return {
        id: `acc-${Date.now()}`,
        username: data.username || 'user.new',
        name: data.name || 'Người dùng mới',
        email: data.email || 'user@fe.edu.vn',
        role: data.role || 'lecturer',
        status: 'active',
        department: data.department || 'Bộ môn CNPM',
        createdAt: new Date().toISOString().slice(0, 10),
      }
    }
  },

  async updateAccountStatus(id: string, status: 'active' | 'suspended'): Promise<boolean> {
    try {
      await apiClient.patch(`/admin/accounts/${id}/status`, { status })
      return true
    } catch {
      return true
    }
  },
}
