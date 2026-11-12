import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ReportCheckPage from '@/features/lecturer/report_check/pages/ReportCheckPage'
import {
  useReportCheckStore,
  type ThesisFinalReportResponse,
} from '@/features/lecturer/report_check'
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

const SAMPLE_REPORTS: ThesisFinalReportResponse[] = [
  {
    publicId: 'rep-1',
    topicPublicId: 'top-1',
    topicName: 'Hệ thống quản lý đồ án TLU',
    currentStage: 'STAGE_3_OUTLINE_APPROVED',
    topicStatus: 'IN_PROGRESS',
    disqualificationReason: null,
    studentPublicId: 'stu-1',
    studentCode: '2051060001',
    studentName: 'Nguyễn Văn An',
    lecturerPublicId: 'lec-1',
    lecturerName: 'Trần Văn Bình',
    coLecturerPublicId: null,
    coLecturerName: null,
    finalReportFile: 'https://res.cloudinary.com/demo/raw/upload/bao_cao_an.pdf',
    plagiarismRate: null,
    plagiarismFile: null,
    supervisorFeedback: null,
    status: 'PENDING',
    statusDescription: 'Đã nộp, chờ nhận xét',
    submittedAt: '2026-11-12T15:30:00',
    reviewedAt: null,
    progressReport: {
      publicId: 'prog-1',
      topicPublicId: 'top-1',
      supervisorPublicId: 'lec-1',
      supervisorName: 'Trần Văn Bình',
      progressFile: 'https://res.cloudinary.com/demo/raw/upload/phieu_an.pdf',
      supervisorNote: 'Đạt tiến độ',
      submittedAt: '2026-11-11T09:00:00',
    },
    canSubmitProgressReport: true,
    canReview: true,
    deadlineName: 'Hạn nộp báo cáo ĐATN & Phiếu theo dõi tiến độ',
    deadlineStartDate: '2026-11-01T00:00:00',
    deadlineEndDate: '2026-11-25T23:59:59',
    deadlineActive: true,
    deadlineStatus: 'OPEN',
    histories: null,
  },
  {
    publicId: 'rep-2',
    topicPublicId: 'top-2',
    topicName: 'Nhận diện văn bản bằng AI',
    currentStage: 'STAGE_3_OUTLINE_APPROVED',
    topicStatus: 'IN_PROGRESS',
    disqualificationReason: null,
    studentPublicId: 'stu-2',
    studentCode: '2051060002',
    studentName: 'Phạm Thị Dung',
    lecturerPublicId: 'lec-2',
    lecturerName: 'Hoàng Văn Em',
    coLecturerPublicId: 'lec-1',
    coLecturerName: 'Trần Văn Bình',
    finalReportFile: 'https://res.cloudinary.com/demo/raw/upload/bao_cao_dung.pdf',
    plagiarismRate: null,
    plagiarismFile: null,
    supervisorFeedback: null,
    status: 'PENDING',
    statusDescription: 'Đã nộp, chờ nhận xét',
    submittedAt: '2026-11-12T16:00:00',
    reviewedAt: null,
    progressReport: null,
    canSubmitProgressReport: false,
    canReview: false,
    deadlineName: 'Hạn nộp báo cáo ĐATN & Phiếu theo dõi tiến độ',
    deadlineStartDate: '2026-11-01T00:00:00',
    deadlineEndDate: '2026-11-25T23:59:59',
    deadlineActive: true,
    deadlineStatus: 'OPEN',
    histories: null,
  },
]

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ReportCheckPage />
    </QueryClientProvider>,
  )
}

describe('ReportCheckPage integration', () => {
  beforeEach(() => {
    requests = []
    apiClient.defaults.adapter = fakeAdapter
    useToastStore.setState({ toasts: [] })
    useReportCheckStore.getState().resetFilters()
  })

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
  })

  it('loads supervisor reports from BE, shows co-supervisor read-only state, opens history detail, and submits review', async () => {
    let listData = [...SAMPLE_REPORTS]
    handler = (config) => {
      const url = sentUrl(config)
      if (url === '/semester/current') {
        return { data: { code: 1000, data: SEMESTERS[0] } }
      }
      if (url.startsWith('/semester')) {
        return {
          data: {
            code: 1000,
            data: { content: SEMESTERS, totalElements: 2, totalPages: 1, page: 0, size: 100 },
          },
        }
      }
      if (url.startsWith('/report/supervisor-list')) {
        return { data: { code: 1000, data: listData } }
      }
      if (url === '/report/rep-1' && config.method === 'get') {
        return {
          data: {
            code: 1000,
            data: {
              ...SAMPLE_REPORTS[0],
              histories: [
                {
                  publicId: 'hist-1',
                  finalHistoryFile: 'https://res.cloudinary.com/demo/raw/upload/bao_cao_an_v1.pdf',
                  plagiarismRate: 18.2,
                  plagiarismHistoryFile: 'https://res.cloudinary.com/demo/raw/upload/turnitin_v1.pdf',
                  status: 'REQUEST_CHANGES',
                  statusDescription: 'Yêu cầu chỉnh sửa',
                  supervisorFeedback: 'Cần sửa chương 2',
                  submittedAt: '2026-11-10T09:00:00',
                  reviewedAt: '2026-11-11T10:00:00',
                },
              ],
            },
          },
        }
      }
      if (url === '/report/rep-1/review' && config.method === 'put') {
        listData = listData.map((r) =>
          r.publicId === 'rep-1'
            ? {
                ...r,
                status: 'APPROVED',
                statusDescription: 'Đã duyệt đạt',
                plagiarismRate: 11.5,
                plagiarismFile: 'https://res.cloudinary.com/demo/raw/upload/turnitin.pdf',
              }
            : r,
        )
        return {
          data: { code: 1000, message: 'Thẩm định báo cáo Final thành công', data: null },
        }
      }
      return { status: 404, data: { code: 404, message: 'Not found' } }
    }

    const user = userEvent.setup()
    renderPage()

    // Hiển thị danh sách thật từ BE
    expect(await screen.findByText('Nguyễn Văn An')).toBeInTheDocument()
    expect(screen.getByText('Phạm Thị Dung')).toBeInTheDocument()
    expect(screen.getByText('Đồng hướng dẫn (Chỉ xem)')).toBeInTheDocument()
    expect(screen.getByText('Đang mở')).toBeInTheDocument()

    // Mở lịch sử nộp -> gọi GET /report/rep-1
    const historyButtons = screen.getAllByRole('button', { name: /Lịch sử/i })
    await user.click(historyButtons[0])
    expect(await screen.findByText('Cần sửa chương 2')).toBeInTheDocument()
    const closeButtons = screen.getAllByRole('button', { name: 'Đóng' })
    await user.click(closeButtons[closeButtons.length - 1])

    // Mở modal Thẩm định cho Nguyễn Văn An (GVHD chính, đã nộp phiếu tiến độ, OPEN)
    const reviewBtn = screen.getByRole('button', { name: /Thẩm định/i })
    await user.click(reviewBtn)

    // Khi deadlineStatus === OPEN chỉ hiện APPROVED và REQUEST_CHANGES (không có REJECTED)
    expect(screen.getByText('Duyệt đạt (APPROVED)')).toBeInTheDocument()
    expect(screen.getByText('Yêu cầu chỉnh sửa (REQUEST_CHANGES)')).toBeInTheDocument()
    expect(screen.queryByText('Không đạt (REJECTED)')).not.toBeInTheDocument()

    // Bấm gửi khi thiếu dữ liệu -> hiện lỗi validate zod dưới FormField
    await user.click(screen.getByRole('button', { name: 'Xác nhận thẩm định' }))
    expect(await screen.findByText('Vui lòng nhập tỷ lệ đạo văn')).toBeInTheDocument()
    expect(screen.getByText('File tải lên không được để trống.')).toBeInTheDocument()

    // Nhập tỷ lệ + chọn file hợp lệ rồi gửi
    const rateInput = screen.getByLabelText(/Tỷ lệ đạo văn/i)
    await user.type(rateInput, '11.5')

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['report'], 'turnitin.pdf', { type: 'application/pdf' })
    await user.upload(fileInput, file)

    await user.click(screen.getByRole('button', { name: 'Xác nhận thẩm định' }))

    await waitFor(() => {
      expect(requests.some((r) => sentUrl(r) === '/report/rep-1/review')).toBe(true)
    })
  })

  it('calls fallback /api/v1/deadlines when supervisor-list returns empty array', async () => {
    handler = (config) => {
      const url = sentUrl(config)
      if (url === '/semester/current') {
        return { data: { code: 1000, data: SEMESTERS[0] } }
      }
      if (url.startsWith('/semester')) {
        return {
          data: {
            code: 1000,
            data: { content: SEMESTERS, totalElements: 2, totalPages: 1, page: 0, size: 100 },
          },
        }
      }
      if (url.startsWith('/report/supervisor-list')) {
        return { data: { code: 1000, data: [] } }
      }
      if (url.startsWith('/api/v1/deadlines')) {
        return {
          data: {
            code: 1000,
            data: { thucHienDeadlines: [] },
          },
        }
      }
      return { status: 404, data: { code: 404, message: 'Not found' } }
    }

    renderPage()

    expect(
      await screen.findByText(
        'Chưa có sinh viên hướng dẫn ở giai đoạn báo cáo trong học kỳ này',
      ),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(requests.some((r) => sentUrl(r).startsWith('/api/v1/deadlines'))).toBe(true)
    })
    expect(screen.getByText('Chưa có')).toBeInTheDocument()
  })
})
