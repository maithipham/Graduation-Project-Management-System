import { z } from 'zod'

export type ActiveStatusCode = 'ACTIVE' | 'INACTIVE'
export type FacultyStatus = 'active' | 'inactive'

export interface Major {
  id: number
  backendId?: string
  code: string
  name: string
  description: string
  status: FacultyStatus
  headTeacherId?: number | null
  headTeacherPublicId?: string | null
  headAccountId?: number | null
  headFullName?: string | null
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
  totalMajors?: number
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
  code: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập mã chuyên ngành')
    .max(20, 'Mã ngành tối đa 20 ký tự'),
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên chuyên ngành')
    .max(150, 'Tên ngành tối đa 150 ký tự'),
  headTeacherId: z.string().optional(),
  headFullName: z.string().optional(),
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
  id: number // account id
  teacherId?: number
  teacherPublicId?: string
  fullName: string
  email: string
  academicRank?: string // TS., PGS., etc.
  majorName?: string
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
  majors?: MajorResponseBE[]
}

export interface FacultyCreationRequestBE {
  code: string
  name: string
  headOfDepartmentId?: number | null
  description?: string
  status?: ActiveStatusCode
}

export interface FacultyUpdateRequestBE {
  code: string
  name: string
  headOfDepartmentId?: number | null
  description?: string
  status: ActiveStatusCode
}

export interface MajorResponseBE {
  id: string
  publicId?: string
  code?: string
  name: string
  description?: string
  headTeacherId?: number | null
  headTeacherPublicId?: string | null
  headAccountId?: number | null
  headFullName?: string | null
  status: string
  statusCode: ActiveStatusCode
}

export interface MajorCreationRequestBE {
  code: string
  name: string
  headTeacherId?: number | null
  headAccountId?: number | null
  description?: string
  status?: ActiveStatusCode
}

export interface MajorUpdateRequestBE {
  code: string
  name: string
  headTeacherId?: number | null
  headAccountId?: number | null
  description?: string
  status: ActiveStatusCode
}

export interface MajorHeadRequestBE {
  teacherId?: number | null
  accountId?: number | null
}

export type MajorRequestBE = MajorCreationRequestBE

export interface FacultyListParams {
  keyword?: string
  status?: string
  page?: number
  size?: number
  sortBy?: 'code' | 'name' | 'headOfDepartment' | 'status' | 'id' | 'createdAt'
  sortDir?: 'ASC' | 'DESC' | 'asc' | 'desc'
}

export interface FacultyMajorParams {
  keyword?: string
  status?: string
  page?: number
  size?: number
  sortBy?: 'name' | 'status' | 'id' | 'createdAt'
  sortDir?: 'ASC' | 'DESC' | 'asc' | 'desc'
}

export const FACULTY_ERROR_CODES = {
  FACULTY_CODE_EMPTY: 4000,
  FACULTY_NAME_EMPTY: 4000,
  FACULTY_STATUS_NULL: 4000,
  MAJOR_NAME_EMPTY: 4000,
  MAJOR_STATUS_NULL: 4000,
  FACULTY_NOT_FOUND: 3008,
  FACULTY_CODE_EXIST: 3009,
  FACULTY_NAME_EXIST: 3010,
  MAJOR_NAME_EXIST_IN_FACULTY: 3011,
  FACULTY_CANNOT_BE_DEACTIVATED: 3012,
  FACULTY_CANNOT_BE_DELETED: 3013,
  MAJOR_CANNOT_BE_DELETED: 3014,
  HEAD_OF_DEPARTMENT_NOT_FOUND: 3015,
  ACCOUNT_NOT_HEAD_OF_DEPARTMENT: 3016,
  MAJOR_CODE_EXIST: 3021,
} as const

