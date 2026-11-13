import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TopicProposalsPage from '@/features/lecturer/topic_proposal/pages/TopicProposalsPage'
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
]

const MOCK_REQUESTS = [
  {
    publicId: 'req-uuid-1',
    topicPublicId: 'top-uuid-1',
    studentPublicId: 'stu-uuid-1',
    studentCode: '2051060001',
    studentName: 'Nguyễn Văn An',
    oldName: null,
    newName: 'Hệ thống Quản lý Đồ án TLU GPMS',
    status: 'PENDING',
    statusDescription: 'Chờ giảng viên hướng dẫn xác nhận',
    requestedAt: '2026-11-12T14:30:00',
    reviewedAt: null,
    reviewerPublicId: null,
    reviewerName: null,
    canReview: true,
  },
  {
    publicId: 'req-uuid-2',
    topicPublicId: 'top-uuid-2',
    studentPublicId: 'stu-uuid-2',
    studentCode: '2051060002',
    studentName: 'Trần Thị Mai',
    oldName: 'Ứng dụng AI cũ',
    newName: 'Ứng dụng AI mới trong chấm bài',
    status: 'APPROVED',
    statusDescription: 'Đã được phê duyệt',
    requestedAt: '2026-11-10T09:15:00',
    reviewedAt: '2026-11-11T10:00:00',
    reviewerPublicId: 'rev-1',
    reviewerName: 'TS. Phạm Thái An',
    canReview: true,
  },
]

const MOCK_DEADLINE = {
  giaoNhanDeadlines: [
    {
      code: 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
      name: 'Hạn sinh viên chỉnh sửa & nộp lại đề cương',
      startDate: '2026-11-01T00:00:00',
      endDate: '2026-11-30T23:59:59',
      status: 'IN_PROGRESS',
    },
  ],
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <TopicProposalsPage />
      </QueryClientProvider>,
    ),
    queryClient,
  }
}

describe('TopicProposalsPage Integration', () => {
  beforeEach(() => {
    requests = []
    apiClient.defaults.adapter = fakeAdapter
    useToastStore.setState({ toasts: [] })

    handler = (config) => {
      const url = sentUrl(config)
      const method = config.method?.toLowerCase()

      if (url.startsWith('/semester/current')) {
        return { data: { code: 1000, data: SEMESTERS[0] } }
      }
      if (url.startsWith('/semester')) {
        return { data: { code: 1000, data: { content: SEMESTERS, totalElements: 1 } } }
      }
      if (url.startsWith('/api/v1/deadlines')) {
        return { data: { code: 1000, data: MOCK_DEADLINE } }
      }
      if (url.startsWith('/topic/title-request') && method === 'get') {
        return { data: { code: 1000, data: MOCK_REQUESTS } }
      }
      if (url.includes('/review') && method === 'put') {
        return { data: { code: 1000, message: 'Xử lý thành công', data: null } }
      }
      if (url.includes('/title-history') && method === 'get') {
        return { data: { code: 1000, data: MOCK_REQUESTS } }
      }

      return { status: 404, data: { message: 'Not found' } }
    }
  })

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
  })

  it('hiển thị danh sách đề xuất đề tài từ BE và thời hạn lấy động', async () => {
    renderPage()

    // Chờ danh sách tải xong
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
    })

    // Phân loại "Chốt tên lần đầu"
    expect(screen.getByText('Chốt tên lần đầu')).toBeInTheDocument()
    expect(screen.getByText('Hệ thống Quản lý Đồ án TLU GPMS')).toBeInTheDocument()

    // Kiểm tra không có dữ liệu hardcode "15/11/2026 23:59"
    expect(screen.queryByText(/15\/11\/2026 23:59/)).not.toBeInTheDocument()
    // Thời hạn động từ BE hiển thị
    expect(screen.getByText(/Thời hạn:/)).toBeInTheDocument()
    expect(screen.getByText(/(Đang mở)/)).toBeInTheDocument()
  })

  it('bấm Duyệt đề tài mở modal và gọi API review với decision APPROVED', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
    })

    // Nút Duyệt của đơn PENDING
    const approveBtn = screen.getByRole('button', { name: 'Duyệt' })
    await user.click(approveBtn)

    // Modal xuất hiện
    expect(
      screen.getByText('Xác nhận chốt tên đề tài lần đầu'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/STAGE_2_TOPIC_CONFIRMED/),
    ).toBeInTheDocument()

    // Bấm Xác nhận duyệt
    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận duyệt' })
    await user.click(confirmBtn)

    await waitFor(() => {
      const putReq = requests.find(
        (r) =>
          r.method?.toLowerCase() === 'put' &&
          r.url?.includes('/topic/title-request/req-uuid-1/review'),
      )
      expect(putReq).toBeDefined()
      expect(JSON.parse(putReq?.data)).toEqual({ decision: 'APPROVED' })
    })
  })

  it('bấm Từ chối mở modal và gọi API review với decision REJECTED', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
    })

    const rejectBtn = screen.getByRole('button', { name: 'Từ chối' })
    await user.click(rejectBtn)

    expect(
      screen.getByText('Xác nhận từ chối yêu cầu tên đề tài'),
    ).toBeInTheDocument()

    const confirmRejectBtn = screen.getByRole('button', { name: 'Xác nhận từ chối' })
    await user.click(confirmRejectBtn)

    await waitFor(() => {
      const putReq = requests.find(
        (r) =>
          r.method?.toLowerCase() === 'put' &&
          r.url?.includes('/topic/title-request/req-uuid-1/review'),
      )
      expect(putReq).toBeDefined()
      expect(JSON.parse(putReq?.data)).toEqual({ decision: 'REJECTED' })
    })
  })

  it('bấm Lịch sử mở modal timeline lịch sử thay đổi tên của đề tài', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
    })

    const historyBtns = screen.getAllByRole('button', { name: /Lịch sử/ })
    await user.click(historyBtns[0])

    await waitFor(() => {
      expect(
        screen.getByText('Lịch sử thay đổi tên đề tài'),
      ).toBeInTheDocument()
    })

    const historyReq = requests.find(
      (r) =>
        r.method?.toLowerCase() === 'get' &&
        sentUrl(r).includes('/topic/top-uuid-1/title-history'),
    )
    expect(historyReq).toBeDefined()
  })
})

