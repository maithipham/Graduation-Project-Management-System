import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { ApiError } from '@/shared/types'

const toastMock = vi.hoisted(() => ({ success: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() }))
vi.mock('@/shared/components/feedback', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  toast: toastMock,
}))

const serviceMock = vi.hoisted(() => ({
  getList: vi.fn(),
  getDetail: vi.fn(),
  save: vi.fn(),
  getApplyPreview: vi.fn(),
  apply: vi.fn(),
  changeSemesterRange: vi.fn(),
  cancelApply: vi.fn(),
  getCancelApplyPreview: vi.fn(),
}))
vi.mock('@/features/department/score_management/services/rubric.service', () => ({ rubricService: serviceMock }))

import {
  rubricKeys,
  useApplyPreview,
  useApplyRubric,
  useCancelApplyPreview,
  useCancelApplyRubric,
  useChangeSemesterRange,
  useRubricList,
  useSaveRubric,
} from '@/features/department/score_management/hooks/useRubrics'

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

describe('useRubrics', () => {
  beforeEach(() => vi.clearAllMocks())

  it('useRubricList gọi A1 theo loại phiếu và đổi sang model giao diện', async () => {
    serviceMock.getList.mockResolvedValue([
      {
        publicId: 't-1',
        name: 'Rubric PB',
        type: 'EXAMINER',
        fromSemester: { publicId: 's-1', name: 'HK1 2025-2026' },
        toSemester: null,
        displayStatus: 'SCHEDULED',
        displayStatusName: 'Sắp áp dụng',
        totalWeight: 100,
        criteriaCount: 4,
        isValid: true,
        semesterCount: 2,
        sheetCount: 37,
        canDelete: false,
        updatedByName: null,
        updatedAt: null,
      },
    ])
    const { wrapper, queryClient } = setup()
    const { result } = renderHook(() => useRubricList('reviewer'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(serviceMock.getList).toHaveBeenCalledWith('EXAMINER')
    expect(result.current.data?.[0]).toMatchObject({
      role: 'reviewer',
      status: 'upcoming',
      fromSemester: { publicId: 's-1', name: 'HK1 2025-2026' },
      toSemester: null,
    })
    expect(queryClient.getQueryData(rubricKeys.list('EXAMINER'))).toBeDefined()
  })

  it('useApplyPreview chỉ gọi khi đã chọn "Từ kỳ"', async () => {
    serviceMock.getApplyPreview.mockResolvedValue({ assignedSemesters: [], releasedSemesters: [] })
    const { wrapper } = setup()
    const { result, rerender } = renderHook(({ from, to }) => useApplyPreview('t-1', from, to), {
      wrapper,
      initialProps: { from: null as string | null, to: null as string | null },
    })
    expect(serviceMock.getApplyPreview).not.toHaveBeenCalled()

    rerender({ from: 's-1', to: null })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(serviceMock.getApplyPreview).toHaveBeenCalledWith('t-1', 's-1', null)
  })

  it('useCancelApplyPreview chưa mở hộp xác nhận thì không gọi A7b', async () => {
    serviceMock.getCancelApplyPreview.mockResolvedValue({ releasedSemesters: [] })
    const { wrapper } = setup()
    const { result, rerender } = renderHook(({ id }) => useCancelApplyPreview(id), {
      wrapper,
      initialProps: { id: undefined as string | undefined },
    })
    expect(serviceMock.getCancelApplyPreview).not.toHaveBeenCalled()

    rerender({ id: 't-1' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(serviceMock.getCancelApplyPreview).toHaveBeenCalledWith('t-1')
  })

  it('useSaveRubric gửi body A5 rồi tải lại danh sách và chi tiết', async () => {
    serviceMock.save.mockResolvedValue(undefined)
    const { wrapper, queryClient } = setup()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useSaveRubric(), { wrapper })

    await result.current.mutateAsync({
      publicId: 't-1',
      name: ' Rubric ',
      version: 5,
      groups: [
        {
          key: 'g',
          publicId: null,
          code: '1',
          name: 'Nhóm',
          criteria: [{ key: 'c', publicId: null, code: '1.1', name: 'TC', weight: 100, maxScore: null }],
        },
      ],
    })

    expect(serviceMock.save).toHaveBeenCalledWith('t-1', {
      name: 'Rubric',
      version: 5,
      groups: [{ publicId: null, name: 'Nhóm', criteria: [{ publicId: null, name: 'TC', weight: 100 }] }],
    })
    expect(toastMock.success).toHaveBeenCalledWith('Đã lưu các thay đổi của rubric')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: rubricKeys.lists() })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: rubricKeys.detail('t-1') })
  })

  it('useSaveRubric gặp 3101 thì bỏ cache chi tiết và tải lại danh sách, không tự toast', async () => {
    serviceMock.save.mockRejectedValue(new ApiError('Không tìm thấy rubric', 3101, undefined, 404))
    const { wrapper, queryClient } = setup()
    queryClient.setQueryData(rubricKeys.detail('t-1'), { publicId: 't-1' })
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useSaveRubric(), { wrapper })

    await expect(
      result.current.mutateAsync({ publicId: 't-1', name: 'R', version: 1, groups: [] }),
    ).rejects.toBeInstanceOf(ApiError)
    expect(queryClient.getQueryData(rubricKeys.detail('t-1'))).toBeUndefined()
    expect(invalidate).toHaveBeenCalledWith({ queryKey: rubricKeys.lists() })
    expect(toastMock.success).not.toHaveBeenCalled()
    expect(toastMock.error).not.toHaveBeenCalled()
  })

  it('useApplyRubric gửi khoảng kỳ, tải lại rubric + rubric của học kỳ, xóa kết quả xem trước', async () => {
    serviceMock.apply.mockResolvedValue(undefined)
    const { wrapper, queryClient } = setup()
    queryClient.setQueryData(rubricKeys.preview('t-1', 's-1', null), { assignedSemesters: [] })
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useApplyRubric(), { wrapper })
    const body = { fromSemesterId: 's-1', toSemesterId: null }

    await result.current.mutateAsync({ publicId: 't-1', body, name: 'Rubric HĐ' })

    expect(serviceMock.apply).toHaveBeenCalledWith('t-1', body)
    expect(toastMock.success).toHaveBeenCalledWith('Đã áp dụng Rubric HĐ')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: rubricKeys.lists() })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: rubricKeys.detail('t-1') })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: rubricKeys.semesters() })
    expect(queryClient.getQueryData(rubricKeys.preview('t-1', 's-1', null))).toBeUndefined()
  })

  it('useApplyRubric lỗi khoảng kỳ (3125) không tự tải lại; 3107 thì tải lại rubric', async () => {
    serviceMock.apply.mockRejectedValueOnce(new ApiError('Trùng khoảng kỳ', 3125, undefined, 409))
    const { wrapper, queryClient } = setup()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useApplyRubric(), { wrapper })
    const variables = { publicId: 't-1', body: { fromSemesterId: 's-1', toSemesterId: 's-2' }, name: 'R' }

    await expect(result.current.mutateAsync(variables)).rejects.toBeInstanceOf(ApiError)
    expect(invalidate).not.toHaveBeenCalled()

    serviceMock.apply.mockRejectedValueOnce(new ApiError('Rubric không còn là Nháp', 3107, undefined, 409))
    await expect(result.current.mutateAsync(variables)).rejects.toBeInstanceOf(ApiError)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: rubricKeys.detail('t-1') })
    expect(toastMock.success).not.toHaveBeenCalled()
  })

  it('useChangeSemesterRange gọi A9 và báo đã cập nhật kỳ', async () => {
    serviceMock.changeSemesterRange.mockResolvedValue(undefined)
    const { wrapper } = setup()
    const { result } = renderHook(() => useChangeSemesterRange(), { wrapper })
    const body = { fromSemesterId: 's-1', toSemesterId: 's-3' }

    await result.current.mutateAsync({ publicId: 't-1', body, name: 'Rubric HD' })

    expect(serviceMock.changeSemesterRange).toHaveBeenCalledWith('t-1', body)
    expect(toastMock.success).toHaveBeenCalledWith('Đã cập nhật kỳ áp dụng của Rubric HD')
  })

  it('useCancelApplyRubric gọi A10, rubric trở về Nháp', async () => {
    serviceMock.cancelApply.mockResolvedValue(undefined)
    const { wrapper, queryClient } = setup()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCancelApplyRubric(), { wrapper })

    await result.current.mutateAsync({ publicId: 't-1', name: 'Rubric PB' })

    expect(serviceMock.cancelApply).toHaveBeenCalledWith('t-1')
    expect(toastMock.success).toHaveBeenCalledWith('Đã hủy áp dụng Rubric PB, rubric trở về bản nháp')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: rubricKeys.semesters() })
  })
})
