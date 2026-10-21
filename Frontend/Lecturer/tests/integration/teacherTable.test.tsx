import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TeacherTable } from '@/features/department/lecturer_management/components/TeacherTable'
import type { TeacherListItem, TeacherSort } from '@/features/department/lecturer_management/types'
import { teacherService } from '@/features/department/lecturer_management/services/teacher.service'
import { useToastStore } from '@/shared/components/feedback/toast.store'
import { ApiError } from '@/shared/types'
import { toSpringPage } from '@/shared/utils'

const teachers: TeacherListItem[] = [
  {
    publicId: 'id-active',
    name: 'Nguyễn Văn An',
    majorName: 'Công nghệ thông tin',
    organization: 'Trường Đại học Thủy lợi',
    phone: '0912345678',
    amount: 20,
    status: true,
  },
  {
    publicId: 'id-inactive',
    name: 'Trần Thị Bình',
    majorName: null,
    organization: 'Trường Đại học Bách khoa Hà Nội',
    phone: null,
    amount: null,
    status: false,
  },
]

function renderTable(
  options: { rows?: TeacherListItem[]; sort?: TeacherSort; hasFilters?: boolean } = {},
) {
  const { rows = teachers, sort, hasFilters = false } = options
  const onRowClick = vi.fn()
  const onSortChange = vi.fn()
  // Dạng PagedModel mà BE Spring Data 3.3+ trả về, đã qua service
  const data = toSpringPage({
    content: rows,
    page: { number: 1, size: 10, totalElements: 12, totalPages: 2 },
  })
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <TeacherTable
        data={data}
        isPending={false}
        isError={false}
        isPlaceholderData={false}
        pageSize={10}
        sort={sort}
        onSortChange={onSortChange}
        onPageChange={() => {}}
        onRowClick={onRowClick}
        hasFilters={hasFilters}
        onCreate={() => {}}
      />
    </QueryClientProvider>,
  )
  return { onRowClick, onSortChange }
}

const amountInput = () => screen.getByRole('spinbutton', { name: 'Hạn mức của Nguyễn Văn An' })
const confirmSheet = () => screen.queryByRole('alertdialog')

/** Giống bấm mũi tên ▲▼ của ô number lần lượt tới từng giá trị (mỗi lần đổi 1 đơn vị) */
function stepTo(...values: number[]) {
  for (const value of values) fireEvent.change(amountInput(), { target: { value: String(value) } })
}

/** Ngừng bấm đủ lâu (STEP_CONFIRM_DELAY_MS = 1 giây) để popup hiện */
function waitStepDelay(ms = 1000) {
  act(() => vi.advanceTimersByTime(ms))
}

beforeEach(() => {
  useToastStore.getState().clearAll()
  // Đồng hồ giả để tua thời gian chờ ngừng bấm; shouldAdvanceTime để userEvent / waitFor vẫn chạy
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('TeacherTable — danh sách giáo viên hướng dẫn', () => {
  it('hiện đúng cột, STT nối tiếp theo trang và "—" khi thiếu dữ liệu', () => {
    renderTable()
    const [active, inactive] = screen.getAllByRole('row', { name: /Xem chi tiết giáo viên/ })

    const activeCells = within(active).getAllByRole('cell')
    expect(activeCells[0]).toHaveTextContent('11')
    expect(activeCells[1]).toHaveTextContent('Nguyễn Văn An')
    expect(activeCells[2]).toHaveTextContent('Trường Đại học Thủy lợi')
    expect(activeCells[3]).toHaveTextContent('Công nghệ thông tin')
    // Đang hoạt động → ô nhập số
    expect(within(activeCells[4]).getByRole('spinbutton')).toHaveValue(20)

    // Đã tắt → chỉ hiện chữ, không có ô nhập
    const inactiveCells = within(inactive).getAllByRole('cell')
    expect(inactiveCells[1]).toHaveTextContent('Đã tắt')
    expect(inactiveCells[3]).toHaveTextContent('—')
    expect(inactiveCells[4]).toHaveTextContent('—')
    expect(within(inactiveCells[4]).queryByRole('spinbutton')).not.toBeInTheDocument()
    expect(screen.getByText('11–12')).toBeInTheDocument()
  })

  it('bấm vào dòng mở chi tiết; bấm ô hạn mức / nút bút chì không mở chi tiết mà đưa con trỏ vào ô', async () => {
    const user = userEvent.setup()
    const { onRowClick } = renderTable()
    const [active] = screen.getAllByRole('row', { name: /Xem chi tiết giáo viên/ })

    await user.click(amountInput())
    await user.click(within(active).getByRole('button', { name: /Thiết lập hạn mức/ }))
    expect(amountInput()).toHaveFocus()
    expect(onRowClick).not.toHaveBeenCalled()

    await user.click(within(active).getByText('Nguyễn Văn An'))
    expect(onRowClick).toHaveBeenCalledWith(teachers[0])
  })

  it('giáo viên đã tắt thì khóa nút "Thiết lập hạn mức" (BE trả 3012)', () => {
    renderTable()
    const [, inactive] = screen.getAllByRole('row', { name: /Xem chi tiết giáo viên/ })
    expect(within(inactive).getByRole('button', { name: /Thiết lập hạn mức/ })).toBeDisabled()
  })

  it('bấm tăng nhiều lần liên tiếp không bị hỏi; ngừng 1 giây mới hỏi 1 lần với số cuối, "Cập nhật" gửi PATCH', async () => {
    const update = vi
      .spyOn(teacherService, 'updateTeacherAmount')
      .mockResolvedValue('Cập nhật số lượng hướng dẫn thành công')
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { onRowClick } = renderTable()

    // Bấm ▲ 3 lần, mỗi lần cách nhau chưa tới 1 giây: 20 → 21 → 22 → 23
    stepTo(21)
    waitStepDelay(600)
    stepTo(22, 23)
    waitStepDelay(600)
    expect(confirmSheet()).not.toBeInTheDocument()
    expect(amountInput()).toHaveValue(23)

    waitStepDelay(400)
    expect(confirmSheet()).toHaveTextContent('Bạn có muốn cập nhật số lượng giảng viên không?')
    expect(confirmSheet()).toHaveTextContent('20 → 23')
    await user.click(screen.getByRole('button', { name: 'Cập nhật' }))

    expect(update).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledWith(
      { publicId: 'id-active', amount: '23' },
      expect.anything(),
    )
    await waitFor(() => expect(confirmSheet()).not.toBeInTheDocument())
    expect(useToastStore.getState().toasts.map((t) => t.message)).toContain(
      'Cập nhật số lượng hướng dẫn thành công',
    )
    // Click trong popup (portal) không được lan lên dòng → không mở chi tiết
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('bắt buộc trả lời: Escape / bấm nền không đóng; chọn "Không" thì trả về số cũ, không gọi API', async () => {
    const update = vi.spyOn(teacherService, 'updateTeacherAmount')
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderTable()

    stepTo(19)
    waitStepDelay()
    await user.keyboard('{Escape}')
    expect(confirmSheet()).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Không' }))
    expect(confirmSheet()).not.toBeInTheDocument()
    expect(amountInput()).toHaveValue(20)
    expect(update).not.toHaveBeenCalled()
  })

  it('gõ số → chỉ hỏi khi Enter; xóa trống rồi rời ô thì giữ số cũ', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.tripleClick(amountInput())
    await user.keyboard('35')
    expect(confirmSheet()).not.toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(confirmSheet()).toHaveTextContent('20 → 35')
    await user.click(screen.getByRole('button', { name: 'Không' }))

    await user.clear(amountInput())
    await user.tab()
    expect(confirmSheet()).not.toBeInTheDocument()
    expect(amountInput()).toHaveValue(20)
  })

  it('bấm tăng rồi Enter → hỏi ngay, không đợi; popup không bị hỏi lại lần 2 khi hết 1 giây', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderTable()

    stepTo(21, 22)
    await user.click(amountInput())
    await user.keyboard('{Enter}')
    expect(confirmSheet()).toHaveTextContent('20 → 22')

    await user.click(screen.getByRole('button', { name: 'Không' }))
    waitStepDelay()
    expect(confirmSheet()).not.toBeInTheDocument()
    expect(amountInput()).toHaveValue(20)
  })

  it('lưu lỗi (BE trả 3012) → đóng popup, trả về số cũ', async () => {
    vi.spyOn(teacherService, 'updateTeacherAmount').mockRejectedValue(
      new ApiError('Giáo viên không hoạt động trong kì này', 3012, undefined, 409),
    )
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderTable()

    stepTo(21)
    waitStepDelay()
    await user.click(screen.getByRole('button', { name: 'Cập nhật' }))

    await waitFor(() => expect(confirmSheet()).not.toBeInTheDocument())
    expect(amountInput()).toHaveValue(20)
  })

  it('bấm tiêu đề cột để sắp xếp theo đúng key BE cho phép; STT và Thao tác không sắp xếp được', async () => {
    const user = userEvent.setup()
    const { onSortChange } = renderTable({ sort: 'amount,asc' })

    await user.click(screen.getByRole('button', { name: 'Họ và tên' }))
    expect(onSortChange).toHaveBeenLastCalledWith('name,asc')

    // Cột đang tăng dần → bấm lần nữa thành giảm dần
    await user.click(screen.getByRole('button', { name: 'Hạn mức' }))
    expect(onSortChange).toHaveBeenLastCalledWith('amount,desc')
    expect(screen.getByRole('columnheader', { name: 'Hạn mức' })).toHaveAttribute('aria-sort', 'ascending')

    expect(screen.queryByRole('button', { name: 'STT' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Thao tác' })).not.toBeInTheDocument()
  })

  it('đang lọc mà không có kết quả thì báo "không tìm thấy" thay vì "chưa có"', () => {
    renderTable({ rows: [], hasFilters: true })
    expect(screen.getByText('Không tìm thấy giáo viên phù hợp')).toBeInTheDocument()
    expect(screen.queryByText('Chưa có giáo viên nào')).not.toBeInTheDocument()
  })
})
