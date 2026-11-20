import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { ApiError } from '@/shared/types'

const toastMock = vi.hoisted(() => ({ success: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() }))
vi.mock('@/shared/components/feedback', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  toast: toastMock,
}))

const serviceMock = vi.hoisted(() => ({
  getTopics: vi.fn(),
  openSheet: vi.fn(),
  getSheet: vi.fn(),
  saveDraft: vi.fn(),
  submit: vi.fn(),
}))
vi.mock('@/features/lecturer/guiding_evaluation/services/advisorGrade.service', () => ({
  advisorGradeService: serviceMock,
}))

import {
  advisorGradeKeys,
  useAdvisorGradeSheet,
  useAdvisorGradeTopics,
  useSaveAdvisorGradeDraft,
  useSubmitAdvisorGradeSheet,
} from '@/features/lecturer/guiding_evaluation/hooks/useAdvisorGrade'

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, invalidateSpy, wrapper }
}

const invalidatedKeys = (spy: ReturnType<typeof setup>['invalidateSpy']) =>
  spy.mock.calls.map(([filters]) => filters?.queryKey)

const body = { generalComment: 'Tốt', details: [{ criteriaId: 'c1', score: 8 }] }

describe('useAdvisorGrade', () => {
  beforeEach(() => vi.clearAllMocks())

  it('C1: gọi theo học kỳ; chưa bật thì chưa gọi', async () => {
    serviceMock.getTopics.mockResolvedValue({ semesterId: 's1', summary: {}, items: [] })
    const { wrapper } = setup()

    const { rerender, result } = renderHook(
      ({ enabled }: { enabled: boolean }) => useAdvisorGradeTopics('s1', { enabled }),
      { wrapper, initialProps: { enabled: false } },
    )
    expect(serviceMock.getTopics).not.toHaveBeenCalled()

    rerender({ enabled: true })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(serviceMock.getTopics).toHaveBeenCalledWith('s1')
  })

  it('mở phiếu: đã có sheetPublicId → C3, không gọi C2', async () => {
    serviceMock.getSheet.mockResolvedValue({ sheetPublicId: 'sh1' })
    const { wrapper } = setup()
    const { result } = renderHook(() => useAdvisorGradeSheet({ topicPublicId: 't1', sheetPublicId: 'sh1' }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(serviceMock.getSheet).toHaveBeenCalledWith('sh1')
    expect(serviceMock.openSheet).not.toHaveBeenCalled()
  })

  it('mở phiếu: chưa có phiếu → C2 rồi tải lại C1', async () => {
    serviceMock.openSheet.mockResolvedValue({ sheetPublicId: 'new' })
    const { wrapper, invalidateSpy } = setup()
    const { result } = renderHook(() => useAdvisorGradeSheet({ topicPublicId: 't1', sheetPublicId: null }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.data).toEqual({ sheetPublicId: 'new' }))
    expect(serviceMock.openSheet).toHaveBeenCalledWith('t1')
    expect(invalidatedKeys(invalidateSpy)).toContainEqual(advisorGradeKeys.topicLists())
  })

  it('popup đóng (target null) → không gọi API', () => {
    const { wrapper } = setup()
    renderHook(() => useAdvisorGradeSheet(null), { wrapper })
    expect(serviceMock.getSheet).not.toHaveBeenCalled()
    expect(serviceMock.openSheet).not.toHaveBeenCalled()
  })

  it('C4 thành công: toast + tải lại phiếu và danh sách', async () => {
    serviceMock.saveDraft.mockResolvedValue(undefined)
    const { wrapper, invalidateSpy } = setup()
    const { result } = renderHook(() => useSaveAdvisorGradeDraft(), { wrapper })

    await act(() => result.current.mutateAsync({ topicPublicId: 't1', sheetPublicId: 'sh1', body }))
    expect(serviceMock.saveDraft).toHaveBeenCalledWith('sh1', body)
    expect(toastMock.success).toHaveBeenCalledWith('Đã lưu nháp phiếu chấm')
    expect(invalidatedKeys(invalidateSpy)).toEqual(
      expect.arrayContaining([advisorGradeKeys.sheet('t1'), advisorGradeKeys.topicLists()]),
    )
  })

  it.each([
    [3168, 'Đã khóa chấm'],
    [3118, 'Phiếu đã nộp'],
  ])('C4 lỗi %i → tải lại phiếu + danh sách, không toast', async (code, message) => {
    serviceMock.saveDraft.mockRejectedValue(new ApiError(message, code))
    const { wrapper, invalidateSpy } = setup()
    const { result } = renderHook(() => useSaveAdvisorGradeDraft(), { wrapper })

    await act(async () => {
      await expect(
        result.current.mutateAsync({ topicPublicId: 't1', sheetPublicId: 'sh1', body }),
      ).rejects.toBeInstanceOf(ApiError)
    })
    expect(invalidatedKeys(invalidateSpy)).toEqual(
      expect.arrayContaining([advisorGradeKeys.sheet('t1'), advisorGradeKeys.topicLists()]),
    )
    expect(toastMock.success).not.toHaveBeenCalled()
    expect(toastMock.error).not.toHaveBeenCalled()
  })

  it('C5 lỗi thiếu điểm (3119) → không tải lại gì', async () => {
    serviceMock.submit.mockRejectedValue(new ApiError('Chưa chấm đủ', 3119))
    const { wrapper, invalidateSpy } = setup()
    const { result } = renderHook(() => useSubmitAdvisorGradeSheet(), { wrapper })

    await act(async () => {
      await expect(
        result.current.mutateAsync({ topicPublicId: 't1', sheetPublicId: 'sh1', body }),
      ).rejects.toBeInstanceOf(ApiError)
    })
    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  it('C5 thành công: dùng phiếu BE trả về cho cache, toast, tải lại C1', async () => {
    const locked = { sheetPublicId: 'sh1', status: 'SUBMITTED', advisorScore: 8 }
    serviceMock.submit.mockResolvedValue(locked)
    const { wrapper, queryClient, invalidateSpy } = setup()
    const { result } = renderHook(() => useSubmitAdvisorGradeSheet(), { wrapper })

    await act(() => result.current.mutateAsync({ topicPublicId: 't1', sheetPublicId: 'sh1', body }))
    expect(queryClient.getQueryData(advisorGradeKeys.sheet('t1'))).toEqual(locked)
    expect(toastMock.success).toHaveBeenCalledWith('Đã nộp phiếu chấm')
    expect(invalidatedKeys(invalidateSpy)).toEqual([advisorGradeKeys.topicLists()])
    expect(serviceMock.getSheet).not.toHaveBeenCalled()
  })

  it('C5 nộp lại phiếu đã nộp → toast "Đã cập nhật điểm hướng dẫn"', async () => {
    const resubmitted = { sheetPublicId: 'sh1', status: 'SUBMITTED', advisorScore: 9 }
    serviceMock.submit.mockResolvedValue(resubmitted)
    const { wrapper, queryClient } = setup()
    queryClient.setQueryData(advisorGradeKeys.sheet('t1'), { sheetPublicId: 'sh1', status: 'SUBMITTED', advisorScore: 8 })
    const { result } = renderHook(() => useSubmitAdvisorGradeSheet(), { wrapper })

    await act(() => result.current.mutateAsync({ topicPublicId: 't1', sheetPublicId: 'sh1', body }))
    expect(queryClient.getQueryData(advisorGradeKeys.sheet('t1'))).toEqual(resubmitted)
    expect(toastMock.success).toHaveBeenCalledWith('Đã cập nhật điểm hướng dẫn')
  })
})
