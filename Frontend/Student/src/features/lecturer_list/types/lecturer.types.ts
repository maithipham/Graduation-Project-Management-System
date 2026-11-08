export type LecturerOrigin = 'internal' | 'external'

export type LecturerOriginFilter = 'all' | LecturerOrigin

export interface Lecturer {
  id: number | string
  teacherPublicId?: string
  teacherCode?: string
  name: string
  plainName?: string
  degree: string
  department: string
  origin: LecturerOrigin
  unit?: string
  email: string
  phone: string
  room: string
  quota: string
  maxStudents?: number
  assignedCount?: number
  isAccepting: number
  field: string
  bio: string
}

export interface LecturerFilterState {
  search: string
  department: string
  origin: LecturerOriginFilter
  currentPage: number
}

export const DEFAULT_DEPARTMENT = ''
export const DEFAULT_ORIGIN: LecturerOriginFilter = 'all'
export const LECTURER_PAGE_SIZE = 15

export const MAJOR_DEFAULT_OPTIONS = [
  { value: '', label: 'Tất cả ngành' },
] as const

/** @deprecated Sử dụng danh sách ngành tải từ Backend qua endpoint GET /major */
export const DEPARTMENT_OPTIONS = MAJOR_DEFAULT_OPTIONS

export const ORIGIN_OPTIONS: ReadonlyArray<{ value: LecturerOriginFilter; label: string }> = [
  { value: 'all', label: 'Tất cả đơn vị' },
  { value: 'internal', label: 'Trong trường' },
  { value: 'external', label: 'Ngoài trường' },
]

export interface SemesterAdvisorResponse {
  id?: string | number
  publicId?: string
  teacherCode?: string
  semesterAdvisorId?: string | number
  semesterId?: string
  maxStudents?: number
  currentStudents?: number
  assignedStudents?: number
  occupiedStudents?: number
  remainingSlots?: number
  teacherId?: number
  teacherPublicId?: string
  name?: string
  teacherName?: string
  email?: string
  teacherEmail?: string
  phone?: string
  academicTitle?: string
  academicTitleId?: number
  academicTitleName?: string
  fullNameWithTitle?: string
  displayName?: string
  majorName?: string
  major?: string
  organization?: string
  isInternal?: boolean
  status?: boolean
  room?: string
  field?: string
  bio?: string
}

export interface MajorOption {
  id: number
  name: string
  code?: string
  facultyId?: number
}

