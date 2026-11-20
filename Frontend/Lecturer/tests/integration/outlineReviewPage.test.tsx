import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OutlineReviewPage from '@/features/lecturer/outline_review/pages/OutlineReviewPage'
import { useOutlineReviewStore } from '@/features/lecturer/outline_review/store/outlineReview.store'
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

const MOCK_OUTLINES = [
  {
    publicId: 'out-1',
    topicPublicId: 'top-1',
    topicName: 'Hệ thống Quản lý Đề tài TLU',
    studentPublicId: 'stu-1',
    studentCode: '2051060001',
    studentName: 'Nguyễn Văn An',
    currentStage: 'STAGE_2_TOPIC_CONFIRMED',
    topicStatus: 'IN_PROGRESS',
    outlineFile: 'https://demo.com/de-cuong.pdf',
    status: 'PENDING',
    statusDescription: 'Chờ duyệt',
    canReview: false,
    canWriteAdvisorFeedback: true,
    submittedAt: '2026-11-12T14:30:00',
    advisorFeedback: 'Đề cương tốt, cần bổ sung chương 3',
    lecturerName: 'TS. Nguyễn Văn Hướng Dẫn',
  },
]

const MOCK_DEADLINE = {
  giaoNhanDeadlines: [
    {
      code: 'SV_CHINH_SUA_NOP_LAI_DE_CUONG',
      name: 'Hạn nộp & duyệt đề cương',
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
        <OutlineReviewPage />
      </QueryClientProvider>,
    ),
    queryClient,
  }
}

describe('OutlineReviewPage Integration', () => {
  beforeEach(() => {
    requests = []
    apiClient.defaults.adapter = fakeAdapter
    useToastStore.setState({ toasts: [] })
    useOutlineReviewStore.setState({
      activeRole: 'guide',
      tabStatus: 'PENDING',
      searchQuery: '',
      selectedSemesterId: '',
      readOutlineIds: [],
    })

    handler = (config) => {
      const url = sentUrl(config)

      if (url.startsWith('/semester/current')) {
        return { data: { code: 1000, data: SEMESTERS[0] } }
      }
      if (url.startsWith('/semester')) {
        return { data: { code: 1000, data: { content: SEMESTERS, totalElements: 2 } } }
      }
      if (url.startsWith('/api/v1/deadlines')) {
        return { data: { code: 1000, data: MOCK_DEADLINE } }
      }
      if (url.startsWith('/outline/supervisor-list')) {
        return { data: { code: 1000, data: MOCK_OUTLINES } }
      }
      if (url.startsWith('/outline/review-list')) {
        return { data: { code: 1000, data: [] } }
      }
      if (url.startsWith('/outline/out-1')) {
        return { data: { code: 1000, data: MOCK_OUTLINES[0] } }
      }

      return { status: 404, data: { message: 'Not found' } }
    }
  })

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
  })

  it('hiển thị bộ lọc năm học và học kỳ đặt trước tab vai trò, và cho phép chuyển năm học', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
    })

    // Dropdown Năm học và Học kỳ
    const yearSelect = screen.getByRole('combobox', { name: 'Chọn năm học' })
    const semSelect = screen.getByRole('combobox', { name: 'Chọn học kỳ' })

    expect(yearSelect).toHaveValue('2026-2027')
    expect(semSelect).toHaveValue('sem-1')

    // Các tab vai trò vẫn hiển thị đầy đủ
    expect(screen.getByRole('button', { name: /Sinh viên đang hướng dẫn/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sinh viên được phân công nhận xét/i })).toBeInTheDocument()

    // Chuyển sang năm học 2025-2026 -> tự động chọn học kỳ thuộc năm đó (sem-2)
    await user.selectOptions(yearSelect, '2025-2026')
    expect(yearSelect).toHaveValue('2025-2026')
    expect(semSelect).toHaveValue('sem-2')

    await waitFor(() => {
      const supervisorReq = requests.find(
        (r) =>
          r.method?.toLowerCase() === 'get' &&
          sentUrl(r).includes('/outline/supervisor-list') &&
          sentUrl(r).includes('semesterId=sem-2'),
      )
      expect(supervisorReq).toBeDefined()
    })
  })

  it('hiển thị bảng đúng cấu trúc mới: không có trạng thái đề tài, gộp file & trạng thái, tách nhận xét GVNX và góp ý GVHD', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
    })

    // Header mới
    expect(screen.getByRole('columnheader', { name: /FILE ĐỀ CƯƠNG & TRẠNG THÁI/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /NHẬN XÉT CỦA GVNX/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /GÓP Ý CỦA GVHD/i })).toBeInTheDocument()

    // Cột Đề tài không còn hiển thị dòng trạng thái giai đoạn của đề tài
    expect(screen.queryByText('Đã chốt tên GĐ 2')).not.toBeInTheDocument()
    expect(screen.queryByText('Chưa chốt tên GĐ 2')).not.toBeInTheDocument()

    // Tên đề tài vẫn hiển thị bình thường
    expect(screen.getByText('Hệ thống Quản lý Đề tài TLU')).toBeInTheDocument()

    // File đề cương và trạng thái cùng hiển thị trong bảng
    expect(screen.getAllByText('Chờ duyệt').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('de-cuong.pdf')).toBeInTheDocument()
  })

  it('hiển thị cột góp ý của GVHD khi mở modal lịch sử nộp đề cương', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
    })

    const historyBtn = screen.getByRole('button', { name: /lịch sử/i })
    await user.click(historyBtn)

    // Modal lịch sử hiển thị
    await waitFor(() => {
      expect(screen.getByText(/Lịch sử các lần nộp đề cương/i)).toBeInTheDocument()
    })

    // Header bảng lịch sử có cột GÓP Ý CỦA GVHD (đồng thời có ở cả bảng chính và modal)
    expect(screen.getAllByRole('columnheader', { name: /GÓP Ý CỦA GVHD/i })).toHaveLength(2)
    expect(screen.getByRole('columnheader', { name: /Ý KIẾN ĐÁNH GIÁ \(GVNX\)/i })).toBeInTheDocument()

    // Nội dung góp ý của GVHD hiển thị trong bảng lịch sử
    const histTableBody = document.getElementById('histModalTableBody')
    expect(histTableBody).toBeInTheDocument()
    expect(within(histTableBody!).getByText('Đề cương tốt, cần bổ sung chương 3')).toBeInTheDocument()
    expect(within(histTableBody!).getByText('Bởi: TS. Nguyễn Văn Hướng Dẫn')).toBeInTheDocument()
  })

  it('mở modal xem trước đề cương hiển thị đúng file thật qua iframe và không hiển thị dữ liệu ảo', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
    })

    // Bấm vào xem trước file đề cương (de-cuong.pdf)
    const previewFileBtn = screen.getByRole('button', { name: /de-cuong\.pdf/i })
    await user.click(previewFileBtn)

    // Modal xem trước đề cương mở ra
    const modal = document.getElementById('outlineClassroomPreviewModal')
    expect(modal).toBeInTheDocument()

    // Hiển thị iframe nhúng file thật của sinh viên
    const iframe = modal?.querySelector('iframe')
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute('src', 'https://demo.com/de-cuong.pdf')
    expect(iframe).toHaveAttribute('title', 'de-cuong.pdf')

    // Thông tin metadata thật của đề tài & sinh viên
    expect(within(modal!).getByText('Hệ thống Quản lý Đề tài TLU')).toBeInTheDocument()
    expect(within(modal!).getByText('TS. Nguyễn Văn Hướng Dẫn')).toBeInTheDocument()

    // Không còn hiển thị dữ liệu ảo / mock pages
    expect(within(modal!).queryByText('Bìa & Đặt vấn đề')).not.toBeInTheDocument()
    expect(within(modal!).queryByText('Kiến trúc & Phương pháp')).not.toBeInTheDocument()
    expect(within(modal!).queryByText('Kế hoạch 15 tuần')).not.toBeInTheDocument()
  })

  it('cho phép tải đề cương xuống máy khi bấm nút tải xuống', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(new Blob(['pdf content'], { type: 'application/pdf' }), { status: 200 }),
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
    })

    const downloadBtn = screen.getByRole('button', { name: 'Tải xuống đề cương' })
    expect(downloadBtn).toBeInTheDocument()

    await user.click(downloadBtn)

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('https://demo.com/de-cuong.pdf')
    })

    fetchSpy.mockRestore()
  })
})
