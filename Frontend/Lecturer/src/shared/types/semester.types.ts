export interface SemesterResponse {
  id: string
  publicId: string
  name: string
  academicYear: string
  term: string
  startDate: string
  endDate: string
  status: string
  statusCode: 'UPCOMING' | 'ONGOING' | 'COMPLETED'
}

export interface ApiResponse<T> {
  code: number
  data: T
}

export interface PageResponse<T> {
  totalElements: number
  totalPages: number
  page: number
  size: number
  content: T[]
}