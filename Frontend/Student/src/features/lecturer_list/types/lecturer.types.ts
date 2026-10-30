export type LecturerOrigin = 'internal' | 'external'

export type LecturerOriginFilter = 'all' | LecturerOrigin

export interface Lecturer {
  id: number
  name: string
  degree: string
  department: string
  origin: LecturerOrigin
  unit?: string
  email: string
  phone: string
  room: string
  quota: string
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

export const DEFAULT_DEPARTMENT = 'Kỹ thuật phần mềm'
export const DEFAULT_ORIGIN: LecturerOriginFilter = 'internal'
export const LECTURER_PAGE_SIZE = 15

export const DEPARTMENT_OPTIONS = [
  { value: '', label: 'Tất cả bộ môn' },
  { value: 'Kỹ thuật phần mềm', label: 'Kỹ thuật phần mềm' },
  { value: 'Hệ thống thông tin', label: 'Hệ thống thông tin' },
  { value: 'Khoa học máy tính', label: 'Khoa học máy tính' },
  { value: 'Mạng & Truyền thông', label: 'Mạng & Truyền thông' },
  { value: 'Trí tuệ nhân tạo', label: 'Trí tuệ nhân tạo' },
] as const

export const ORIGIN_OPTIONS: ReadonlyArray<{ value: LecturerOriginFilter; label: string }> = [
  { value: 'all', label: 'Tất cả đơn vị' },
  { value: 'internal', label: 'Trong trường' },
  { value: 'external', label: 'Ngoài trường' },
]

