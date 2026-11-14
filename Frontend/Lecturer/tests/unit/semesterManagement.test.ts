import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { semesterService } from '@/features/admin/semester_management/services/semester.service'
import {
  semesterSchema,
  semesterConfigSchema,
} from '@/features/admin/semester_management/types/semester.types'
import { useSemesterStore } from '@/features/admin/semester_management/store/semester.store'
import { apiClient } from '@/shared/api'

let requests: InternalAxiosRequestConfig[] = []
let reply: unknown
const originalAdapter = apiClient.defaults.adapter

const fakeAdapter: AxiosAdapter = async (config) => {
  requests.push(config)
  return { data: reply, status: 200, statusText: '', headers: {}, config }
}

const sentUrl = (config: InternalAxiosRequestConfig) =>
  decodeURIComponent(apiClient.getUri({ ...config, baseURL: '' }))

beforeEach(() => {
  requests = []
  apiClient.defaults.adapter = fakeAdapter
})

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter
})

describe('semesterSchema validation', () => {
  it('hợp lệ khi startDate <= endDate và hỗ trợ applyToFutureSemesters', () => {
    const valid = semesterSchema.safeParse({
      name: 'Học kỳ 1 năm học 2026-2027',
      startDate: '2026-08-01',
      endDate: '2027-01-31',
      applyToFutureSemesters: true,
    })
    expect(valid.success).toBe(true)
    if (valid.success) {
      expect(valid.data.applyToFutureSemesters).toBe(true)
    }
  })

  it('lỗi khi thiếu ngày bắt đầu hoặc ngày kết thúc', () => {
    const missingStart = semesterSchema.safeParse({
      startDate: '',
      endDate: '2027-01-31',
    })
    expect(missingStart.success).toBe(false)

    const missingEnd = semesterSchema.safeParse({
      startDate: '2026-08-01',
      endDate: '',
    })
    expect(missingEnd.success).toBe(false)
  })

  it('lỗi khi ngày kết thúc đứng trước ngày bắt đầu', () => {
    const invalid = semesterSchema.safeParse({
      startDate: '2027-02-01',
      endDate: '2026-08-01',
    })
    expect(invalid.success).toBe(false)
    if (!invalid.success) {
      expect(invalid.error.issues[0].message).toContain(
        'Thời gian kết thúc phải sau hoặc bằng thời gian bắt đầu',
      )
    }
  })
})

describe('semesterConfigSchema validation', () => {
  it('hợp lệ với các giá trị tháng từ 1-12 và ngày 1-31', () => {
    const valid = semesterConfigSchema.safeParse({
      term1StartMonth: 9,
      term1StartDay: 1,
      term1EndMonth: 1,
      term1EndDay: 31,
      term2StartMonth: 2,
      term2StartDay: 1,
      term2EndMonth: 7,
      term2EndDay: 31,
    })
    expect(valid.success).toBe(true)
  })

  it('lỗi khi tháng ngoài khoảng 1-12', () => {
    const invalid = semesterConfigSchema.safeParse({
      term1StartMonth: 13,
      term1StartDay: 1,
      term1EndMonth: 1,
      term1EndDay: 31,
      term2StartMonth: 2,
      term2StartDay: 1,
      term2EndMonth: 7,
      term2EndDay: 31,
    })
    expect(invalid.success).toBe(false)
  })
})

describe('semesterService endpoints', () => {
  it('getAll: gửi GET /semesters', async () => {
    reply = {
      code: 1000,
      message: 'OK',
      data: { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 },
    }

    const data = await semesterService.getAll({ page: 0, size: 10 })
    expect(sentUrl(requests[0])).toBe('/semesters?page=0&size=10')
    expect(data?.content).toEqual([])
  })

  it('getCurrent: gửi GET /semesters/current', async () => {
    reply = {
      code: 1000,
      message: 'OK',
      data: {
        id: 'uuid-1',
        name: 'Học kỳ 1 năm học 2026-2027',
        startDate: '2026-08-01',
        endDate: '2027-01-31',
        status: 'Đang diễn ra',
        statusCode: 'ONGOING',
      },
    }

    const current = await semesterService.getCurrent()
    expect(sentUrl(requests[0])).toBe('/semesters/current')
    expect(current?.name).toBe('Học kỳ 1 năm học 2026-2027')
    expect(current?.statusCode).toBe('ONGOING')
  })

  it('sync: gửi POST /semesters/sync', async () => {
    reply = {
      code: 1000,
      message: 'OK',
      data: null,
    }

    await semesterService.sync()
    expect(sentUrl(requests[0])).toBe('/semesters/sync')
    expect(requests[0].method?.toLowerCase()).toBe('post')
  })

  it('update: gửi PUT /semesters/:id kèm cờ applyToFutureSemesters', async () => {
    reply = {
      code: 1000,
      message: 'OK',
      data: null,
    }

    await semesterService.update('sem-123', {
      startDate: '2026-09-01',
      endDate: '2027-01-31',
      applyToFutureSemesters: true,
    })
    expect(sentUrl(requests[0])).toBe('/semesters/sem-123')
    expect(requests[0].method?.toLowerCase()).toBe('put')
    expect(JSON.parse(requests[0].data)).toEqual({
      startDate: '2026-09-01',
      endDate: '2027-01-31',
      applyToFutureSemesters: true,
    })
  })

  it('getConfig: gửi GET /semesters/config', async () => {
    reply = {
      code: 1000,
      message: 'OK',
      data: {
        term1StartMonth: 9,
        term1StartDay: 1,
        term1EndMonth: 1,
        term1EndDay: 31,
        term2StartMonth: 2,
        term2StartDay: 1,
        term2EndMonth: 7,
        term2EndDay: 31,
      },
    }

    const config = await semesterService.getConfig()
    expect(sentUrl(requests[0])).toBe('/semesters/config')
    expect(config?.term1StartMonth).toBe(9)
  })

  it('updateConfig: gửi PUT /semesters/config', async () => {
    reply = {
      code: 1000,
      message: 'OK',
      data: null,
    }

    const newConfig = {
      term1StartMonth: 9,
      term1StartDay: 1,
      term1EndMonth: 1,
      term1EndDay: 31,
      term2StartMonth: 2,
      term2StartDay: 1,
      term2EndMonth: 7,
      term2EndDay: 31,
    }
    await semesterService.updateConfig(newConfig)
    expect(sentUrl(requests[0])).toBe('/semesters/config')
    expect(requests[0].method?.toLowerCase()).toBe('put')
    expect(JSON.parse(requests[0].data)).toEqual(newConfig)
  })

  it('không còn phương thức create và delete thủ công trong semesterService', () => {
    expect((semesterService as Record<string, unknown>).create).toBeUndefined()
    expect((semesterService as Record<string, unknown>).delete).toBeUndefined()
  })
})

describe('useSemesterStore state', () => {
  it('không còn hàm addSemester và activateSemester trong store', () => {
    const store = useSemesterStore.getState()
    expect((store as unknown as Record<string, unknown>).addSemester).toBeUndefined()
    expect((store as unknown as Record<string, unknown>).activateSemester).toBeUndefined()
  })
})
