import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import GuidingEvaluationPage from '@/features/lecturer/guiding_evaluation/pages/GuidingEvaluationPage'
import {
  useGuidingEvaluationStore,
  type GuidingFinalReportDto,
} from '@/features/lecturer/guiding_evaluation'
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

const SAMPLE_LIST: GuidingFinalReportDto[] = [
  {
    publicId: null,
    topicPublicId: 'top-1',
    topicName: 'Hệ thống quản lý đồ án TLU',
    currentStage: 'STAGE_4_REPORT_APPROVED',
    topicStatus: 'IN_PROGRESS',
    disqualificationReason: null,
    studentPublicId: 'stu-1',
    studentCode: '2051060001',
    studentName: 'Nguyễn Văn An',
    lecturerPublicId: 'lec-1',
    lecturerName: 'Trần Văn Bình',
    coLecturerPublicId: null,
    coLecturerName: null,
    finalReportFile: null,
    plagiarismRate: null,
    plagiarismFile: null,
    supervisorFeedback: null,
    status: null,
    statusDescription: null,
    submittedAt: null,
    reviewedAt: null,
    progressReport: null,
    canSubmitProgressReport: true,
    canReview: true,
    deadlineName: 'Hạn nộp báo cáo ĐATN & Phiếu theo dõi tiến độ',
    deadlineStartDate: '2026-11-01T00:00:00',
    deadlineEndDate: '2026-11-25T23:59:59',
    deadlineActive: true,
    deadlineStatus: 'EXTENDED',
    histories: null,
  },
  {
    publicId: 'rep-2',
    topicPublicId: 'top-2',
    topicName: 'Ứng dụng AI hỗ trợ phân loại văn bản',
    currentStage: 'STAGE_4_REPORT_APPROVED',
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
    submittedAt: '2026-11-12T15:30:00',
    reviewedAt: null,
    progressReport: {
      publicId: 'prog-2',
      topicPublicId: 'top-2',
      supervisorPublicId: 'lec-2',
      supervisorName: 'Hoàng Văn Em',
      progressFile: 'https://res.cloudinary.com/demo/raw/upload/phieu_dung.pdf',
      supervisorNote: 'Đạt tiến độ tốt',
      submittedAt: '2026-11-11T09:00:00',
    },
    canSubmitProgressReport: false,
    canReview: false,
    deadlineName: 'Hạn nộp báo cáo ĐATN & Phiếu theo dõi tiến độ',
    deadlineStartDate: '2026-11-01T00:00:00',
    deadlineEndDate: '2026-11-25T23:59:59',
    deadlineActive: true,
    deadlineStatus: 'EXTENDED',
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
      <GuidingEvaluationPage />
    </QueryClientProvider>,
  )
}

describe('GuidingEvaluationPage integration', () => {
  beforeEach(() => {
    requests = []
    apiClient.defaults.adapter = fakeAdapter
    useToastStore.setState({ toasts: [] })
    useGuidingEvaluationStore.getState().resetFilters()
  })

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
  })

  it('loads supervisor students from BE, supports co-supervisor read-only & final report detail, and submits progress report', async () => {
    let listData = [...SAMPLE_LIST]
    handler = (config) => {
      const url = sentUrl(config)
      if (url === '/semester/current') {
        return { data: { code: 1000, data: SEMESTERS[0] } }
      }
      if (url.startsWith('/semester')) {
        return {
          data: {
            code: 1000,
            data: { content: SEMESTERS, totalElements: 1, totalPages: 1, page: 0, size: 100 },
          },
        }
      }
      if (url.startsWith('/report/supervisor-list')) {
        return { data: { code: 1000, data: listData } }
      }
      if (url === '/report/rep-2' && config.method === 'get') {
        return {
          data: {
            code: 1000,
            data: {
              ...SAMPLE_LIST[1],
              histories: [
                {
                  publicId: 'hist-1',
                  finalHistoryFile: 'https://res.cloudinary.com/demo/raw/upload/bao_cao_dung_v1.pdf',
                  plagiarismRate: null,
                  plagiarismHistoryFile: null,
                  status: 'PENDING',
                  statusDescription: 'Đã nộp, chờ nhận xét',
                  supervisorFeedback: null,
                  submittedAt: '2026-11-12T15:30:00',
                  reviewedAt: null,
                },
              ],
            },
          },
        }
      }
      if (url === '/report/progress-report' && config.method === 'post') {
        listData = listData.map((item) =>
          item.topicPublicId === 'top-1'
            ? {
                ...item,
                progressReport: {
                  publicId: 'prog-new',
                  topicPublicId: 'top-1',
                  supervisorPublicId: 'lec-1',
                  supervisorName: 'Trần Văn Bình',
                  progressFile: 'https://res.cloudinary.com/demo/raw/upload/phieu_an.pdf',
                  supervisorNote: 'Đủ điều kiện bảo vệ',
                  submittedAt: '2026-11-12T18:00:00',
                },
              }
            : item,
        )
        return {
          data: { code: 1000, message: 'Nộp phiếu theo dõi tiến độ thành công', data: null },
        }
      }
      return { status: 404, data: { code: 404, message: 'Not found' } }
    }

    const user = userEvent.setup()
    renderPage()

    // Hiển thị danh sách thật từ BE (cả SV chưa nộp báo cáo Final và SV đồng hướng dẫn)
    expect(await screen.findByText('Nguyễn Văn An')).toBeInTheDocument()
    expect(screen.getByText('Sinh viên chưa nộp báo cáo Final')).toBeInTheDocument()
    expect(screen.getByText('Phạm Thị Dung')).toBeInTheDocument()
    expect(screen.getByText('Đồng hướng dẫn (Chỉ xem)')).toBeInTheDocument()
    expect(screen.getByText('Gia hạn chấm')).toBeInTheDocument()

    // Xem chi tiết Báo cáo Final của Phạm Thị Dung -> gọi GET /report/rep-2
    await user.click(screen.getByRole('button', { name: 'Đã nộp, chờ nhận xét' }))
    expect(
      await screen.findByText(/Lịch sử các lần nộp Báo cáo Final \(1\)/i),
    ).toBeInTheDocument()
    const closeButtons = screen.getAllByRole('button', { name: 'Đóng' })
    await user.click(closeButtons[closeButtons.length - 1])

    // Mở modal nộp phiếu cho Nguyễn Văn An (khi deadline EXTENDED vẫn cho phép GVHD chính nộp)
    await user.click(screen.getByRole('button', { name: 'Nộp phiếu' }))

    // Bấm nộp khi chưa chọn file -> hiện lỗi validate zod dưới FormField
    await user.click(screen.getByRole('button', { name: 'Xác nhận nộp file' }))
    expect(
      await screen.findByText('File tải lên không được để trống.'),
    ).toBeInTheDocument()

    // Chọn file hợp lệ + nhập ghi chú rồi nộp
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['progress'], 'phieu_an.pdf', { type: 'application/pdf' })
    await user.upload(fileInput, file)
    await user.type(
      screen.getByLabelText(/Nhận xét tổng kết tiến độ/i),
      'Đủ điều kiện bảo vệ',
    )

    await user.click(screen.getByRole('button', { name: 'Xác nhận nộp file' }))

    await waitFor(() => {
      expect(
        requests.some((r) => sentUrl(r) === '/report/progress-report' && r.method === 'post'),
      ).toBe(true)
    })

    // Sau khi invalidate query, tên file phiếu tiến độ mới hiển thị lên bảng
    expect(await screen.findByText('phieu_an.pdf')).toBeInTheDocument()
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
            data: { content: SEMESTERS, totalElements: 1, totalPages: 1, page: 0, size: 100 },
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
            data: { stage2: [] },
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

