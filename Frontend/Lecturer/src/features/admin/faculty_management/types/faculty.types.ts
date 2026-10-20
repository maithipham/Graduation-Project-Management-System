import { z } from 'zod'

export type ActiveStatusCode = 'ACTIVE' | 'INACTIVE'
export type FacultyStatus = 'active' | 'inactive'

export interface Major {
  id: number
  name: string
  description: string
  status: FacultyStatus
}

export interface Faculty {
  id: number
  backendId?: string
  code: string
  name: string
  dean: string
  description: string
  status: FacultyStatus
  majors: Major[]
}

export const facultySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập mã khoa')
    .max(20, 'Mã khoa tối đa 20 ký tự'),
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên khoa')
    .max(150, 'Tên khoa tối đa 150 ký tự'),
  headOfDepartmentId: z.string().optional(),
  dean: z.string().trim().optional(),
  description: z
    .string()
    .trim()
    .max(500, 'Thông tin chi tiết tối đa 500 ký tự')
    .optional(),
  status: z.enum(['active', 'inactive']),
})

export type FacultyFormValues = z.infer<typeof facultySchema>

export const majorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên chuyên ngành')
    .max(150, 'Tên ngành tối đa 150 ký tự'),
  description: z
    .string()
    .trim()
    .max(500, 'Thông tin chi tiết tối đa 500 ký tự')
    .optional(),
  status: z.enum(['active', 'inactive']),
})

export type MajorFormValues = z.infer<typeof majorSchema>

export interface HeadOfDepartmentResponseBE {
  id: number
  fullName: string
  title: string
}

export interface HeadCandidateResponseBE {
  id: number
  fullName: string
  email: string
  academicRank: string // TS., PGS., etc.
}

export interface FacultyResponseBE {
  id: string
  publicId?: string
  code: string
  name: string
  headOfDepartment?: HeadOfDepartmentResponseBE
  totalMajors: number
  status: string
  statusCode: ActiveStatusCode
}

export interface FacultyDetailResponseBE {
  id: string
  publicId?: string
  code: string
  name: string
  headOfDepartment?: HeadOfDepartmentResponseBE
  description: string
  status: string
  statusCode: ActiveStatusCode
}

export interface FacultyCreationRequestBE {
  code: string
  name: string
  headOfDepartmentId?: number
  description?: string
  status?: ActiveStatusCode
}

export interface FacultyUpdateRequestBE {
  code: string
  name: string
  headOfDepartmentId?: number
  description?: string
  status: ActiveStatusCode
}

export interface MajorResponseBE {
  id: string
  publicId?: string
  name: string
  description?: string
  status: string
  statusCode: ActiveStatusCode
}

export interface MajorRequestBE {
  name: string
  description?: string
  status?: ActiveStatusCode
}

