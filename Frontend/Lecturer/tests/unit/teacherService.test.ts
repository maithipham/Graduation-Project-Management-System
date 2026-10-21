import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { teacherService } from '@/features/department/lecturer_management/services/teacher.service'
import { apiClient } from '@/shared/api'
import { useToastStore } from '@/shared/components/feedback/toast.store'

// Thay "server" của apiClient thật bằng adapter giả: interceptor và cách ghép query vẫn là thật
let requests: InternalAxiosRequestConfig[] = []
let reply: unknown
const originalAdapter = apiClient.defaults.adapter

const fakeAdapter: AxiosAdapter = async (config) => {
  requests.push(config)
  return { data: reply, status: 200, statusText: '', headers: {}, config }
}

/** URL đúng như trình duyệt sẽ gửi (đã ghép query bằng paramsSerializer của request) */
const sentUrl = (config: InternalAxiosRequestConfig) =>
  decodeURIComponent(apiClient.getUri({ ...config, baseURL: '' }))

beforeEach(() => {
  requests = []
  apiClient.defaults.adapter = fakeAdapter
  useToastStore.getState().clearAll()
})

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter
})

describe('teacherService.getTeachers', () => {
  it('bỏ tham số rỗng, gửi sort dạng Spring (sort=amount,desc) và đọc Page phẳng', async () => {
    reply = {
      code: 1000,
      message: 'OK',
      data: { content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 },
    }

    const page = await teacherService.getTeachers({
      name: 'An',
      organization: undefined,
      organizationType: 'external',
      majorName: '',
      page: 0,
      size: 10,
      sort: 'amount,desc',
    })

    expect(sentUrl(requests[0])).toBe(
      '/teacher?name=An&organizationType=external&page=0&size=10&sort=amount,desc',
    )
    expect(page).toMatchObject({ content: [], number: 0, size: 10, totalElements: 0, empty: true })
  })

  it('không chọn cột sắp xếp → không gửi sort (BE tự xếp)', async () => {
    reply = { code: 1000, message: 'OK', data: { content: [], page: { number: 1, size: 10, totalElements: 12, totalPages: 2 } } }

    const page = await teacherService.getTeachers({ page: 1, size: 10 })

    expect(sentUrl(requests[0])).toBe('/teacher?page=1&size=10')
    // PagedModel ({ content, page }) cũng đọc được
    expect(page).toMatchObject({ number: 1, totalElements: 12, totalPages: 2, last: true })
  })
})

describe('teacherService.createTeacher', () => {
  it('trả code + message của BE, lỗi không hiện toast (để form tự hiện)', async () => {
    reply = { code: 1000, message: 'Thêm giáo viên thành công', data: null }

    const result = await teacherService.createTeacher({
      firstName: 'Nguyễn Văn',
      lastName: 'An',
      email: 'an.nv@tlu.edu.vn',
      phone: '0987654321',
      organization: 'Trường Đại học Thủy lợi',
      major: 'Kỹ thuật phần mềm',
      amount: '20',
    })

    expect(result).toEqual({ code: 1000, message: 'Thêm giáo viên thành công' })
    expect(requests[0]).toMatchObject({ method: 'post', url: '/teacher', skipErrorToast: true })
  })

  it('code 1100: không reject, interceptor hiện toast vàng', async () => {
    reply = { code: 1100, message: 'Giáo viên đã tồn tại và đang hoạt động', data: null }

    const result = await teacherService.createTeacher({
      firstName: 'Nguyễn Văn',
      lastName: 'An',
      email: 'an.nv@tlu.edu.vn',
      phone: '0987654321',
      organization: 'Trường Đại học Thủy lợi',
      major: 'Kỹ thuật phần mềm',
      amount: null,
    })

    expect(result.code).toBe(1100)
    expect(useToastStore.getState().toasts.map((t) => [t.type, t.message])).toEqual([
      ['warning', 'Giáo viên đã tồn tại và đang hoạt động'],
    ])
  })
})

describe('teacherService.importTeachers', () => {
  it('gửi multipart part "file" tới /teacher/import và bóc data', async () => {
    const data = { totalRows: 1, successCount: 1, warningCount: 0, errorCount: 0, rowResults: [] }
    reply = { code: 1000, message: 'OK', data }
    const file = new File(['x'], 'giao_vien.xlsx')

    const result = await teacherService.importTeachers(file)

    expect(result).toEqual(data)
    expect(requests[0]).toMatchObject({ method: 'post', url: '/teacher/import', skipErrorToast: true })
    expect(requests[0].data).toBeInstanceOf(FormData)
    expect((requests[0].data as FormData).get('file')).toBe(file)
  })

  it('lỗi cả file: reject ApiError, không hiện toast (dialog tự hiện dưới ô file)', async () => {
    reply = { code: 4000, message: 'File import không đúng mẫu', data: null }

    await expect(teacherService.importTeachers(new File(['x'], 'sai.xlsx'))).rejects.toMatchObject({
      code: 4000,
      message: 'File import không đúng mẫu',
    })
    expect(useToastStore.getState().toasts).toEqual([])
  })
})

describe('teacherService.updateTeacherAmount', () => {
  it('PATCH /teacher/{publicId}/amount với amount dạng chuỗi, trả message của BE', async () => {
    reply = { code: 1000, message: 'Cập nhật số lượng hướng dẫn thành công' }

    const message = await teacherService.updateTeacherAmount({ publicId: 'id-1', amount: '15' })

    expect(requests[0]).toMatchObject({ method: 'patch', url: '/teacher/id-1/amount' })
    expect(JSON.parse(requests[0].data as string)).toEqual({ amount: '15' })
    expect(message).toBe('Cập nhật số lượng hướng dẫn thành công')
  })
})
