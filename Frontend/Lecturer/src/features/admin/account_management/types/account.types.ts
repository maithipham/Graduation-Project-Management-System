import { z } from 'zod'
import type { StudentCreationRequest } from '@/features/department'

export type AccountRole = 'Quản trị viên' | 'Giảng viên' | 'Sinh viên'
/** Loại tài khoản có trang quản lý riêng (menu Quản lý tài khoản → Giảng viên / Sinh viên) */
export type ManagedAccountRole = Extract<AccountRole, 'Giảng viên' | 'Sinh viên'>
export type AccountStatus = 'active' | 'inactive'

/** Giá trị ô lọc "Trạng thái": '' = tất cả. Quy ước với BE: Hoạt động = true, Không hoạt động = false */
export type AccountStatusFilter = '' | 'true' | 'false'

export const ACCOUNT_STATUS_FILTER_OPTIONS: { value: Exclude<AccountStatusFilter, ''>; label: string }[] = [
  { value: 'true', label: 'Hoạt động' },
  { value: 'false', label: 'Không hoạt động' },
]

export interface AccountActivity {
  id: string
  action: string
  time: string
}

export interface UserAccount {
  id: number
  name: string
  email: string
  role: AccountRole
  status: AccountStatus
  phone?: string
  unit?: string
  /** Tên ngành / bộ môn (sinh viên, giảng viên trong trường) */
  major?: string
  /** Khóa của sinh viên, ví dụ K65 */
  batch?: string
  /** Lớp của sinh viên, ví dụ 64HTTT2 (cùng tên trường với StudentResponseBE) */
  className?: string
  createdAt?: string
  lastLogin?: string
  activities: AccountActivity[]
}

export const addAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập họ và tên')
    .max(100, 'Họ và tên tối đa 100 ký tự'),
  email: z.email('Email không đúng định dạng'),
  phone: z
    .string()
    .trim()
    .max(10, 'Số điện thoại tối đa 10 ký tự')
    .optional()
    .or(z.literal('')),
  role: z.enum(['Quản trị viên', 'Giảng viên', 'Sinh viên'], {
    error: 'Vui lòng chọn vai trò',
  }),
  lecturerType: z.enum(['internal', 'external']).optional(),
  unit: z
    .string()
    .trim()
    .max(150, 'Đơn vị / Khoa tối đa 150 ký tự')
    .optional()
    .or(z.literal('')),
  facultyId: z.string().optional().or(z.literal('')),
  major: z.string().optional().or(z.literal('')),
  batch: z.string().trim().max(20, 'Khóa tối đa 20 ký tự').optional().or(z.literal('')),
  className: z.string().trim().max(50, 'Lớp tối đa 50 ký tự').optional().or(z.literal('')),
  department: z.string().trim().max(200, 'Đơn vị công tác tối đa 200 ký tự').optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
})

export type AddAccountFormValues = z.infer<typeof addAccountSchema>

/** 1 dòng của GET /student/account */
export interface StudentAccountItem {
  publicId: string
  studentCode: string
  name: string
  email: string
  className: string
  batch: string
  majorName: string | null
  /** true = Hoạt động, false = Không hoạt động (bị khóa đăng nhập) */
  accountStatus: boolean
}

/** data của GET /student/account/{publicId} */
export interface StudentAccountDetail extends StudentAccountItem {
  phone: string | null
}

/** Query của GET /student/account (mọi tham số lọc đều không bắt buộc) */
export interface StudentAccountListParams {
  /** Khớp một phần mã SV, họ tên hoặc email */
  keyword?: string
  batch?: string
  /** publicId của ngành, không phải tên ngành */
  majorId?: string
  status?: boolean
  /** Trang bắt đầu từ 0 */
  page: number
  size: number
  sort?: string | string[]
}

/** Query của GET /student/account/export: cùng bộ lọc với danh sách, không phân trang */
export type StudentAccountExportParams = Omit<StudentAccountListParams, 'page' | 'size'>

/**
 * Body PUT /student/account/{publicId}: 8 trường như form thêm (major = tên ngành).
 * accountStatus: true = mở khóa, false = khóa đăng nhập, không gửi = giữ nguyên
 */
export interface StudentAccountUpdateRequest extends StudentCreationRequest {
  accountStatus?: boolean
}

export interface StudentResponseBE {
  publicId?: string
  studentCode: string
  name: string
  majorName: string
  className: string
  batch: string
}

export interface StudentCreationRequestBE {
  email: string
  firstName: string
  lastName: string
  phone?: string
  studentCode: string
  batch: string
  className: string
  majorId: number
}

export interface PermissionResponseBE {
  permissionName: string
  description?: string
}

export interface PermissionRequestBE {
  permissionName: string
  description?: string
}

export interface RoleResponseBE {
  roleName: string
  description?: string
  permissionName: string[]
}

export interface RoleRequestBE {
  roleName: string
  description?: string
  permissionName: string[]
}

export interface OutBoundUserResponseBE {
  id: string
  email: string
  verified_email?: string
  name: string
  given_name?: string
  family_name?: string
  picture?: string
}
