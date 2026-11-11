import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SupervisorRequestsPage from '@/features/lecturer/supervisor_registration/pages/SupervisorRequestsPage'
import { apiClient } from '@/shared/api'
import { useToastStore } from '@/shared/components/feedback/toast.store'

type ApiHandler = (
  config: InternalAxiosRequestConfig,
) => Promise<{ status?: number; data: unknown }> | { status?: number; data: unknown }

let requests: InternalAxiosRequestConfig[] = []
let handler: ApiHandler
const originalAdapter = apiClient.defaults.adapter

const sentUrl = (config: InternalAxiosRequestConfig) =>
  decodeURIComponent(apiClient.getUri({ ...config, baseURL: '' }))

const fakeAdapter: AxiosAdapter = async (config) => {
  requests.push(config)
  const result = await handler(config)
  const status = result.status ?? 200
  if (status >= 400) {
    throw Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      config,
      response: {
        status,
        statusText: 'Error',
        headers: {},
        config,
        data: result.data,
      },
    })
  }
  return {
    data: result.data,
    status,
    statusText: 'OK',
    headers: {},
    config,
  }
}

const SEMESTERS = [
  {
    id: '1',
    publicId: 'sem-1',
    name: 'Học kỳ 1 năm học 2026-2027',
    academicYear: '2026-2027',
    term: 'HK1',
    startDate: '2026-09-01',
    endDate: '2027-01-15',
    status: 'Đang diễn ra',
    statusCode: 'ONGOING',
  },
  {
    id: '3',
    publicId: 'sem-1b',
    name: 'Học kỳ 2 năm học 2026-2027',
    academicYear: '2026-2027',
    term: 'HK2',
    startDate: '2027-01-20',
    endDate: '2027-06-30',
    status: 'Sắp diễn ra',
    statusCode: 'UPCOMING',
  },
  {
    id: '2',
    publicId: 'sem-2',
    name: 'Học kỳ 2 năm học 2025-2026',
    academicYear: '2025-2026',
    term: 'HK2',
    startDate: '2026-01-20',
    endDate: '2026-06-30',
    status: 'Đã kết thúc',
    statusCode: 'COMPLETED',
  },
]

const SAMPLE_LIST = [
  {
    registrationPublicId: 'reg-1',
    studentPublicId: 'stu-1',
    semesterPublicId: 'sem-1',
    teacherPublicId: 'tea-1',
    studentCode: '2151170555',
    studentName: 'Nguyễn Văn An',
    majorName: 'Kỹ thuật phần mềm',
    teacherCode: 'GV001',
    teacherName: 'TS. Trần Mai Anh',
    topicName: 'Xây dựng hệ thống quản lý đồ án tốt nghiệp TLU',
    status: 'PENDING',
    statusDescription: 'Chờ giảng viên xác nhận',
    submittedAt: '2026-03-03T08:30:00',
    processedAt: null,
  },
  {
    registrationPublicId: 'reg-2',
    studentPublicId: 'stu-2',
    semesterPublicId: 'sem-1',
    teacherPublicId: 'tea-1',
    studentCode: '2151170666',
    studentName: 'Lê Thu Trang',
    majorName: 'Hệ thống thông tin',
    teacherCode: 'GV001',
    teacherName: 'TS. Trần Mai Anh',
    topicName: 'Cổng nghiên cứu khoa học',
    status: 'PENDING',
    statusDescription: 'Chờ giảng viên xác nhận',
    submittedAt: '2026-03-02T09:00:00',
    processedAt: null,
  },
]

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <SupervisorRequestsPage />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  requests = []
  apiClient.defaults.adapter = fakeAdapter
  useToastStore.getState().clearAll()

  handler = (config) => {
    const url = sentUrl(config)
    if (url.startsWith('/semester/current')) {
      return { data: { code: 1000, data: SEMESTERS[0] } }
    }
    if (url.startsWith('/semester?')) {
      return {
        data: {
          code: 1000,
          data: { content: SEMESTERS, totalElements: 2, totalPages: 1, page: 0, size: 100 },
        },
      }
    }
    if (url.startsWith('/api/teacher/advisor-registrations/deadline')) {
      return {
        data: {
          code: 1000,
          data: {
            semesterPublicId: 'sem-1',
            name: 'Đăng ký giảng viên hướng dẫn',
            startDate: '2026-01-01T00:00:00',
            endDate: '2099-03-15T23:59:59',
            isActive: true,
            status: 'OPEN',
          },
        },
      }
    }
    if (url.startsWith('/api/teacher/advisor-registrations?')) {
      return {
        data: {
          code: 1000,
          data: {
            registrations: SAMPLE_LIST,
            pendingCount: 2,
            approvedCount: 1,
            rejectedCount: 0,
            totalCount: 3,
          },
        },
      }
    }
    if (url === '/api/teacher/advisor-registrations/reg-1') {
      return { data: { code: 1000, data: SAMPLE_LIST[0] } }
    }
    return { data: { code: 1000, data: null } }
  }
})

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter
})

describe('SupervisorRequestsPage', () => {
  it('hiển thị danh sách đơn, bộ đếm 4 tab và deadline thật từ BE', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
      expect(screen.getByText('2151170555')).toBeInTheDocument()
      expect(screen.getByText('Lê Thu Trang')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Chưa duyệt/ })).toHaveTextContent('2')
    expect(screen.getByRole('button', { name: /Đã duyệt/ })).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: /Đã từ chối/ })).toHaveTextContent('0')
    expect(screen.getByRole('button', { name: /Tất cả/ })).toHaveTextContent('3')
    expect(screen.getByText(/Hạn: 15\/03\/2099/)).toBeInTheDocument()
  })

  it('fallback chọn học kỳ đầu tiên khi /semester/current báo lỗi mà không hiện toast lỗi', async () => {
    handler = (config) => {
      const url = sentUrl(config)
      if (url.startsWith('/semester/current')) {
        return {
          status: 404,
          data: { code: 4041, message: 'Chưa có học kỳ hiện tại', data: null },
        }
      }
      if (url.startsWith('/semester?')) {
        return {
          data: {
            code: 1000,
            data: { content: SEMESTERS, totalElements: 2, totalPages: 1, page: 0, size: 100 },
          },
        }
      }
      if (url.startsWith('/api/teacher/advisor-registrations/deadline')) {
        return {
          data: {
            code: 1000,
            data: {
              semesterPublicId: 'sem-1',
              name: 'Đăng ký GVHD',
              startDate: '2026-01-01T00:00:00',
              endDate: '2099-03-15T23:59:59',
              isActive: true,
              status: 'OPEN',
            },
          },
        }
      }
      if (url.startsWith('/api/teacher/advisor-registrations?')) {
        return {
          data: {
            code: 1000,
            data: {
              registrations: [SAMPLE_LIST[0]],
              pendingCount: 1,
              approvedCount: 0,
              rejectedCount: 0,
              totalCount: 1,
            },
          },
        }
      }
      return { data: { code: 1000, data: null } }
    }

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
    })

    expect(useToastStore.getState().toasts).toHaveLength(0)
    expect(screen.getByRole('combobox', { name: 'Chọn năm học' })).toHaveValue('2026-2027')
    expect(screen.getByRole('combobox', { name: 'Chọn học kỳ' })).toHaveValue('sem-1')
  })

  it('tách lọc năm học và học kỳ: đổi năm học tự chọn kỳ của năm đó, đổi học kỳ gọi lại API theo semesterPublicId', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
    })

    const yearSelect = screen.getByRole('combobox', { name: 'Chọn năm học' })
    const termSelect = screen.getByRole('combobox', { name: 'Chọn học kỳ' })

    expect(yearSelect).toHaveValue('2026-2027')
    expect(termSelect).toHaveValue('sem-1')
    expect(termSelect.querySelectorAll('option')).toHaveLength(2)

    await user.selectOptions(termSelect, 'sem-1b')
    await waitFor(() => {
      expect(
        requests.some((r) => sentUrl(r).includes('semesterPublicId=sem-1b')),
      ).toBe(true)
    })

    await user.selectOptions(yearSelect, '2025-2026')
    await waitFor(() => {
      expect(termSelect).toHaveValue('sem-2')
      expect(termSelect.querySelectorAll('option')).toHaveLength(1)
      expect(
        requests.some((r) => sentUrl(r).includes('semesterPublicId=sem-2')),
      ).toBe(true)
    })
  })

  it('chuyển tab và tìm kiếm gửi đúng tham số status và keyword lên BE', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Đã duyệt/ }))
    await waitFor(() => {
      expect(
        requests.some((r) =>
          sentUrl(r).includes('status=TEACHER_APPROVED'),
        ),
      ).toBe(true)
    })

    await user.click(screen.getByRole('button', { name: /Tất cả/ }))
    await waitFor(() => {
      const listCalls = requests
        .map(sentUrl)
        .filter((u) => u.startsWith('/api/teacher/advisor-registrations?'))
      expect(listCalls[listCalls.length - 1]).toBe(
        '/api/teacher/advisor-registrations?semesterPublicId=sem-1',
      )
    })

    const searchInput = screen.getByRole('textbox', { name: 'Tìm kiếm sinh viên' })
    await user.type(searchInput, '2151170555')

    await waitFor(() => {
      expect(
        requests.some((r) => sentUrl(r).includes('keyword=2151170555')),
      ).toBe(true)
    })
  })

  it('duyệt đơn gọi PATCH .../approve, hiện 1 toast thành công, đóng modal và tải lại danh sách', async () => {
    let approved = false
    handler = (config) => {
      const url = sentUrl(config)
      if (url.startsWith('/semester/current')) {
        return { data: { code: 1000, data: SEMESTERS[0] } }
      }
      if (url.startsWith('/semester?')) {
        return {
          data: {
            code: 1000,
            data: { content: SEMESTERS, totalElements: 2, totalPages: 1, page: 0, size: 100 },
          },
        }
      }
      if (url.startsWith('/api/teacher/advisor-registrations/deadline')) {
        return {
          data: {
            code: 1000,
            data: {
              semesterPublicId: 'sem-1',
              name: 'Đăng ký GVHD',
              startDate: '2026-01-01T00:00:00',
              endDate: '2099-03-15T23:59:59',
              isActive: true,
              status: 'OPEN',
            },
          },
        }
      }
      if (url === '/api/teacher/advisor-registrations/reg-1/approve') {
        approved = true
        return {
          data: {
            code: 1000,
            message: 'Duyệt đơn đăng ký giảng viên hướng dẫn thành công',
            data: {
              ...SAMPLE_LIST[0],
              status: 'TEACHER_APPROVED',
              processedAt: '2026-03-04T14:20:00',
            },
          },
        }
      }
      if (url.startsWith('/api/teacher/advisor-registrations?')) {
        // Mô phỏng sau khi duyệt đủ quota, đơn còn lại tự động bị REJECTED
        return {
          data: {
            code: 1000,
            data: approved
              ? {
                  registrations: [],
                  pendingCount: 0,
                  approvedCount: 2,
                  rejectedCount: 1,
                  totalCount: 3,
                }
              : {
                  registrations: SAMPLE_LIST,
                  pendingCount: 2,
                  approvedCount: 1,
                  rejectedCount: 0,
                  totalCount: 3,
                },
          },
        }
      }
      return { data: { code: 1000, data: null } }
    }

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
    })

    const approveButtons = screen.getAllByRole('button', { name: 'Duyệt' })
    await user.click(approveButtons[0])

    expect(
      screen.getByText('Xác nhận phê duyệt đơn đăng ký'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Xác nhận' }))

    await waitFor(() => {
      expect(
        screen.queryByText('Xác nhận phê duyệt đơn đăng ký'),
      ).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Chưa duyệt/ })).toHaveTextContent('0')
    })

    expect(
      useToastStore
        .getState()
        .toasts.filter((t) => t.type === 'success'),
    ).toHaveLength(1)
  })

  it('từ chối thất bại do hết hạn 403: chỉ hiện 1 toast lỗi từ interceptor, đóng modal và tải lại danh sách', async () => {
    handler = (config) => {
      const url = sentUrl(config)
      if (url.startsWith('/semester/current')) {
        return { data: { code: 1000, data: SEMESTERS[0] } }
      }
      if (url.startsWith('/semester?')) {
        return {
          data: {
            code: 1000,
            data: { content: SEMESTERS, totalElements: 2, totalPages: 1, page: 0, size: 100 },
          },
        }
      }
      if (url.startsWith('/api/teacher/advisor-registrations/deadline')) {
        return {
          data: {
            code: 1000,
            data: {
              semesterPublicId: 'sem-1',
              name: 'Đăng ký GVHD',
              startDate: '2026-01-01T00:00:00',
              endDate: '2099-03-15T23:59:59',
              isActive: true,
              status: 'OPEN',
            },
          },
        }
      }
      if (url === '/api/teacher/advisor-registrations/reg-1/reject') {
        return {
          status: 403,
          data: {
            code: 2001,
            message: 'Đã hết thời hạn xử lý đơn đăng ký GVHD',
            data: null,
          },
        }
      }
      if (url.startsWith('/api/teacher/advisor-registrations?')) {
        return {
          data: {
            code: 1000,
            data: {
              registrations: SAMPLE_LIST,
              pendingCount: 2,
              approvedCount: 1,
              rejectedCount: 0,
              totalCount: 3,
            },
          },
        }
      }
      return { data: { code: 1000, data: null } }
    }

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
    })

    const rejectButtons = screen.getAllByRole('button', { name: 'Từ chối' })
    await user.click(rejectButtons[0])
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }))

    await waitFor(() => {
      expect(
        screen.queryByText('Xác nhận từ chối đơn đăng ký'),
      ).not.toBeInTheDocument()
    })

    expect(useToastStore.getState().toasts).toHaveLength(1)
    expect(useToastStore.getState().toasts[0]).toMatchObject({
      type: 'error',
      message: 'Đã hết thời hạn xử lý đơn đăng ký GVHD',
    })
  })

  it('xem chi tiết gọi GET .../advisor-registrations/{publicId} và hiển thị modal chi tiết', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
    })

    await user.click(
      screen.getByRole('button', { name: 'Xem chi tiết đơn của Nguyễn Văn An' }),
    )

    await waitFor(() => {
      expect(
        screen.getByText('Chi tiết đơn đăng ký giảng viên hướng dẫn'),
      ).toBeInTheDocument()
      expect(screen.getByText('Chờ giảng viên xác nhận')).toBeInTheDocument()
    })
  })

  it('khi deadline là CLOSED thì hiển thị trạng thái hết hạn và khóa nút Duyệt / Từ chối', async () => {
    handler = (config) => {
      const url = sentUrl(config)
      if (url.startsWith('/semester/current')) {
        return { data: { code: 1000, data: SEMESTERS[0] } }
      }
      if (url.startsWith('/semester?')) {
        return {
          data: {
            code: 1000,
            data: { content: SEMESTERS, totalElements: 2, totalPages: 1, page: 0, size: 100 },
          },
        }
      }
      if (url.startsWith('/api/teacher/advisor-registrations/deadline')) {
        return {
          data: {
            code: 1000,
            data: {
              semesterPublicId: 'sem-1',
              name: 'Đăng ký GVHD',
              startDate: '2026-01-01T00:00:00',
              endDate: '2026-02-01T23:59:59',
              isActive: true,
              status: 'CLOSED',
            },
          },
        }
      }
      if (url.startsWith('/api/teacher/advisor-registrations?')) {
        return {
          data: {
            code: 1000,
            data: {
              registrations: [SAMPLE_LIST[0]],
              pendingCount: 1,
              approvedCount: 0,
              rejectedCount: 0,
              totalCount: 1,
            },
          },
        }
      }
      return { data: { code: 1000, data: null } }
    }

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
      expect(screen.getByText('Đã hết hạn xử lý đơn')).toBeInTheDocument()
      expect(
        screen.getByText(/Hiện chỉ xem danh sách, không thể duyệt hoặc từ chối đơn đăng ký/),
      ).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'Duyệt' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Từ chối' })).toBeDisabled()
  })
})
