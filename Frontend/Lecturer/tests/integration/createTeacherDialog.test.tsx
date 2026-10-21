import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CreateTeacherDialog } from '@/features/department/lecturer_management/components/CreateTeacherDialog'
import { teacherService } from '@/features/department/lecturer_management/services/teacher.service'
import { useToastStore } from '@/shared/components/feedback/toast.store'
import { ApiError } from '@/shared/types'

const MAJORS = [{ publicId: 'm1', code: '7480103', name: 'Kỹ thuật phần mềm' }]

function renderDialog(onOpenChange = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <CreateTeacherDialog open onOpenChange={onOpenChange} majors={MAJORS} majorsLoading={false} />
    </QueryClientProvider>,
  )
  return onOpenChange
}

const field = (label: string) => screen.getByLabelText(new RegExp(`^${label}`))

async function fillValidForm(u: ReturnType<typeof userEvent.setup>) {
  await u.type(field('Họ và tên đệm'), 'Nguyễn Văn')
  await u.type(field('Tên'), 'An')
  await u.type(field('Email'), 'an.nv@tlu.edu.vn')
  await u.type(field('Số điện thoại'), '0987654321')
  await u.selectOptions(field('Ngành'), 'Kỹ thuật phần mềm')
}

const successToasts = () =>
  useToastStore
    .getState()
    .toasts.filter((t) => t.type === 'success')
    .map((t) => t.message)

beforeEach(() => {
  useToastStore.getState().clearAll()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CreateTeacherDialog', () => {
  it('bấm Lưu khi trống: hiện lỗi dưới từng ô, không gọi API', async () => {
    const create = vi.spyOn(teacherService, 'createTeacher')
    const u = userEvent.setup()
    renderDialog()

    await u.click(screen.getByRole('button', { name: 'Lưu' }))

    expect(await screen.findByText('Họ không được để trống')).toBeInTheDocument()
    expect(screen.getByText('Email không được để trống')).toBeInTheDocument()
    expect(screen.getByText('Đơn vị công tác không được để trống')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it('email @tlu.edu.vn tự điền Trường Đại học Thủy lợi + 20; gửi body toàn chuỗi rồi đóng popup', async () => {
    const create = vi
      .spyOn(teacherService, 'createTeacher')
      .mockResolvedValue({ code: 1000, message: 'Thêm giáo viên thành công' })
    const u = userEvent.setup()
    const onOpenChange = renderDialog()

    await fillValidForm(u)
    expect(field('Đơn vị công tác')).toHaveValue('Trường Đại học Thủy lợi')
    expect(field('Hạn mức sinh viên')).toHaveValue('20')
    expect(field('Ngành')).toBeEnabled()

    await u.click(screen.getByRole('button', { name: 'Lưu' }))

    expect(create).toHaveBeenCalledWith(
      {
        firstName: 'Nguyễn Văn',
        lastName: 'An',
        email: 'an.nv@tlu.edu.vn',
        phone: '0987654321',
        organization: 'Trường Đại học Thủy lợi',
        major: 'Kỹ thuật phần mềm',
        amount: '20',
      },
      expect.anything(),
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(successToasts()).toEqual(['Thêm giáo viên thành công'])
  })

  it('code 1000 nhưng BE không trả message: toast xanh dùng câu mặc định, không để trống', async () => {
    vi.spyOn(teacherService, 'createTeacher').mockResolvedValue({ code: 1000 })
    const u = userEvent.setup()
    const onOpenChange = renderDialog()

    await fillValidForm(u)
    await u.click(screen.getByRole('button', { name: 'Lưu' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(successToasts()).toEqual(['Thêm giáo viên thành công'])
  })

  it('code 1100 (giáo viên đang hoạt động sẵn): đóng popup, không hiện toast xanh', async () => {
    vi.spyOn(teacherService, 'createTeacher').mockResolvedValue({
      code: 1100,
      message: 'Giáo viên đã tồn tại và đang hoạt động',
    })
    const u = userEvent.setup()
    const onOpenChange = renderDialog()

    await fillValidForm(u)
    await u.click(screen.getByRole('button', { name: 'Lưu' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    // Toast vàng do interceptor hiện, popup không tự thêm toast xanh
    expect(successToasts()).toEqual([])
  })

  it('đang lưu: nút đổi chữ "Đang lưu...", khóa nút và không cho đóng popup', async () => {
    // Promise không bao giờ xong → giữ trạng thái đang lưu
    vi.spyOn(teacherService, 'createTeacher').mockReturnValue(new Promise(() => {}))
    const u = userEvent.setup()
    const onOpenChange = renderDialog()

    await fillValidForm(u)
    await u.click(screen.getByRole('button', { name: 'Lưu' }))

    expect(await screen.findByRole('button', { name: 'Đang lưu...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Hủy' })).toBeDisabled()

    await u.keyboard('{Escape}')
    await u.click(screen.getByRole('button', { name: 'Đóng' }))
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('đổi sang @gmail.com: xóa tên Thủy lợi tự điền, hạn mức 10, xóa và khóa ô Ngành, gửi major ""', async () => {
    const create = vi
      .spyOn(teacherService, 'createTeacher')
      .mockResolvedValue({ code: 1000, message: 'Thêm giáo viên thành công' })
    const u = userEvent.setup()
    renderDialog()

    await fillValidForm(u)
    await u.clear(field('Email'))
    await u.type(field('Email'), 'An.NV@Gmail.com')

    expect(field('Đơn vị công tác')).toHaveValue('')
    expect(field('Hạn mức sinh viên')).toHaveValue('10')
    expect(field('Ngành')).toHaveValue('')
    expect(field('Ngành')).toBeDisabled()

    // Chưa nhập tên trường → báo trống, không gọi API
    await u.click(screen.getByRole('button', { name: 'Lưu' }))
    expect(await screen.findByText('Đơn vị công tác không được để trống')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()

    await u.type(field('Đơn vị công tác'), 'Trường Đại học Bách khoa Hà Nội')
    await u.click(screen.getByRole('button', { name: 'Lưu' }))

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'an.nv@gmail.com',
        organization: 'Trường Đại học Bách khoa Hà Nội',
        major: '',
        amount: '10',
      }),
      expect.anything(),
    )
  })

  it('đơn vị và hạn mức người dùng tự sửa thì không bị email ghi đè', async () => {
    const u = userEvent.setup()
    renderDialog()

    await u.type(field('Email'), 'an@gmail.com')
    await u.type(field('Đơn vị công tác'), 'Trường Đại học Bách khoa Hà Nội')
    await u.clear(field('Hạn mức sinh viên'))
    await u.type(field('Hạn mức sinh viên'), '5')
    await u.clear(field('Email'))
    await u.type(field('Email'), 'an@tlu.edu.vn')

    expect(field('Đơn vị công tác')).toHaveValue('Trường Đại học Bách khoa Hà Nội')
    expect(field('Hạn mức sinh viên')).toHaveValue('5')
    // Quay về trong trường → mở khóa ô Ngành
    expect(field('Ngành')).toBeEnabled()
  })

  it('backend báo 3007: hiện lỗi chung trên form, giữ popup và dữ liệu', async () => {
    vi.spyOn(teacherService, 'createTeacher').mockRejectedValue(
      new ApiError('Thông tin không khớp với hồ sơ gốc trong hệ thống', 3007, undefined, 409),
    )
    const u = userEvent.setup()
    const onOpenChange = renderDialog()

    await fillValidForm(u)
    await u.click(screen.getByRole('button', { name: 'Lưu' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Thông tin không khớp với hồ sơ gốc trong hệ thống',
    )
    expect(field('Họ và tên đệm')).toHaveValue('Nguyễn Văn')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
