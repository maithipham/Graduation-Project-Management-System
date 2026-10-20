import { z } from 'zod'

export type SemesterStatusCode = 'UPCOMING' | 'ONGOING' | 'COMPLETED'
export type SemesterStatus = 'active' | 'upcoming' | 'ended'

export interface Semester {
  id: number
  name: string
  startDate: string
  endDate: string
  status: SemesterStatus
}

export const semesterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập tên học kỳ')
      .max(100, 'Tên học kỳ tối đa 100 ký tự'),
    startDate: z.string().min(1, 'Vui lòng chọn thời gian bắt đầu'),
    endDate: z.string().min(1, 'Vui lòng chọn thời gian kết thúc'),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    message: 'Thời gian kết thúc phải sau hoặc bằng thời gian bắt đầu',
    path: ['endDate'],
  })

export type SemesterFormValues = z.infer<typeof semesterSchema>

export interface PageResponseBE<T> {
  totalElements: number
  totalPages: number
  page: number
  size: number
  content: T[]
}

export interface SemesterResponseBE {
  id: string
  publicId?: string
  name: string
  startDate: string // format dd-MM-yyyy
  endDate: string // format dd-MM-yyyy
  status: string // ví dụ: "Đang diễn ra", "Chưa bắt đầu"
  statusCode: SemesterStatusCode // UPCOMING | ONGOING | COMPLETED
}

export interface SemesterRequestBE {
  name: string
  startDate: string // format yyyy-MM-dd
  endDate: string // format yyyy-MM-dd
  status?: SemesterStatusCode
}

