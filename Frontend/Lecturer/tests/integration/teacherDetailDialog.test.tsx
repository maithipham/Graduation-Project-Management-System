import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TeacherDetailDialog } from '@/features/department/lecturer_management/components/TeacherDetailDialog'
import { teacherService } from '@/features/department/lecturer_management/services/teacher.service'
import type { TeacherDetail } from '@/features/department/lecturer_management/types'
import { ApiError } from '@/shared/types'

const EXTERNAL_INACTIVE: TeacherDetail = {
  publicId: 'id-1',
  name: 'Trần Thị Bình',
  majorName: null,
  organization: 'Trường Đại học Bách khoa Hà Nội',
  phone: null,
  amount: null,
  status: false,
  email: 'binh.tt@gmail.com',
}

function renderDialog(publicId: string | undefined, onClose = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <TeacherDetailDialog publicId={publicId} onClose={onClose} />
    </QueryClientProvider>,
  )
  return onClose
}

/** Giá trị hiển thị dưới nhãn (cặp dt/dd) */
const valueOf = (label: string) => screen.getByText(label).nextElementSibling

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TeacherDetailDialog', () => {
  it('không có publicId: popup đóng và không gọi API', () => {
    const detail = vi.spyOn(teacherService, 'getTeacherDetail')
    renderDialog(undefined)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(detail).not.toHaveBeenCalled()
  })

  it('hiện đủ 6 trường; trống thì hiện "—", có nhãn trạng thái và link email', async () => {
    const detail = vi.spyOn(teacherService, 'getTeacherDetail').mockResolvedValue(EXTERNAL_INACTIVE)
    renderDialog('id-1')

    expect(await screen.findByText('Trần Thị Bình')).toBeInTheDocument()
    expect(detail).toHaveBeenCalledWith('id-1')
    expect(valueOf('Đơn vị công tác')).toHaveTextContent('Trường Đại học Bách khoa Hà Nội')
    expect(valueOf('Ngành')).toHaveTextContent('—')
    expect(valueOf('Hạn mức')).toHaveTextContent('—')
    expect(valueOf('Số điện thoại')).toHaveTextContent('—')
    expect(within(valueOf('Email') as HTMLElement).getByRole('link')).toHaveAttribute(
      'href',
      'mailto:binh.tt@gmail.com',
    )
    expect(screen.getByText('Đã tắt')).toBeInTheDocument()
  })

  it('hạn mức 0 vẫn hiện "0" (không coi là chưa thiết lập)', async () => {
    vi.spyOn(teacherService, 'getTeacherDetail').mockResolvedValue({
      ...EXTERNAL_INACTIVE,
      amount: 0,
      status: true,
    })
    renderDialog('id-1')

    await screen.findByText('Trần Thị Bình')
    expect(valueOf('Hạn mức')).toHaveTextContent(/^0$/)
    expect(screen.getByText('Đang hoạt động')).toBeInTheDocument()
  })

  it('BE báo lỗi (3009): hiện thông báo không tải được', async () => {
    vi.spyOn(teacherService, 'getTeacherDetail').mockRejectedValue(
      new ApiError('Giáo viên không tồn tại', 3009, undefined, 404),
    )
    renderDialog('id-x')

    expect(await screen.findByText('Không tải được thông tin giáo viên.')).toBeInTheDocument()
  })

  it('bấm "Đóng" ở chân popup → gọi onClose', async () => {
    vi.spyOn(teacherService, 'getTeacherDetail').mockResolvedValue(EXTERNAL_INACTIVE)
    const u = userEvent.setup()
    const onClose = renderDialog('id-1')
    await screen.findByText('Trần Thị Bình')

    // Có 2 nút "Đóng": dấu X góc trên và nút ở chân popup
    const [, footerClose] = screen.getAllByRole('button', { name: 'Đóng' })
    await u.click(footerClose)
    expect(onClose).toHaveBeenCalled()
  })
})
