import { z } from 'zod'
import { parseDate } from '@/shared/utils/formatDate'

export type SemesterStatusCode = 'UPCOMING' | 'ONGOING' | 'COMPLETED'
export type SemesterStatus = 'active' | 'upcoming' | 'ended'

export interface Semester {
  id: number
  backendId?: string
  name: string
  startDate: string
  endDate: string
  status: SemesterStatus
}

export const semesterSchema = z
  .object({
    name: z.string().trim().optional(),
    startDate: z.string().min(1, 'Vui lòng chọn thời gian bắt đầu'),
    endDate: z.string().min(1, 'Vui lòng chọn thời gian kết thúc'),
    applyToFutureSemesters: z.boolean().optional(),
  })
  .refine(
    (v) => {
      if (!v.startDate || !v.endDate) return true
      const start = parseDate(v.startDate)
      const end = parseDate(v.endDate)
      if (start && end) {
        return end.getTime() >= start.getTime()
      }
      return v.endDate >= v.startDate
    },
    {
      message: 'Thời gian kết thúc phải sau hoặc bằng thời gian bắt đầu',
      path: ['endDate'],
    },
  )

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
  name?: string
  startDate: string // format yyyy-MM-dd
  endDate: string // format yyyy-MM-dd
  applyToFutureSemesters?: boolean
}

/** Cấu hình khung thời gian chuẩn của hệ thống (kế thừa tự động cho mọi năm sau) */
export interface SemesterConfigBE {
  term1StartMonth: number
  term1StartDay: number
  term1EndMonth: number
  term1EndDay: number
  term2StartMonth: number
  term2StartDay: number
  term2EndMonth: number
  term2EndDay: number
}

export const semesterConfigSchema = z.object({
  term1StartMonth: z.number().int().min(1).max(12),
  term1StartDay: z.number().int().min(1).max(31),
  term1EndMonth: z.number().int().min(1).max(12),
  term1EndDay: z.number().int().min(1).max(31),
  term2StartMonth: z.number().int().min(1).max(12),
  term2StartDay: z.number().int().min(1).max(31),
  term2EndMonth: z.number().int().min(1).max(12),
  term2EndDay: z.number().int().min(1).max(31),
})

export type SemesterConfigFormValues = z.infer<typeof semesterConfigSchema>

