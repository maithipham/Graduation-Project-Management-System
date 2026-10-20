import { z } from 'zod'

export type AccountRole = 'Quản trị viên' | 'Giảng viên' | 'Sinh viên'
export type AccountStatus = 'active' | 'inactive'

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
  department: z.string().trim().max(200, 'Đơn vị công tác tối đa 200 ký tự').optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
})

export type AddAccountFormValues = z.infer<typeof addAccountSchema>

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
