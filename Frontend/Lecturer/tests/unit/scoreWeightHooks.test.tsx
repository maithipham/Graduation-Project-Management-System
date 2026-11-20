import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { ApiError } from '@/shared/types'
import type { ScoreWeightConfig } from '@/features/department/score_management/types'

const toastMock = vi.hoisted(() => ({ success: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() }))
vi.mock('@/shared/components/feedback', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  toast: toastMock,
}))

const serviceMock = vi.hoisted(() => ({
  getList: vi.fn(),
  getDetail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  getApplyPreview: vi.fn(),
  getCancelApplyPreview: vi.fn(),
  apply: vi.fn(),
  changeSemesterRange: vi.fn(),
  cancelApply: vi.fn(),
}))
vi.mock('@/features/department/score_management/services/scoreWeight.service', () => ({
  scoreWeightService: serviceMock,
}))

import {
  scoreWeightKeys,
  useCreateScoreWeight,
  useDeleteScoreWeight,
  useScoreWeightApplyPreview,
  useScoreWeightCancelPreview,
  useScoreWeightDetail,
  useScoreWeightList,
  useUpdateScoreWeight,
} from '@/features/department/score_management/hooks/useScoreWeights'

function config(overrides: Partial<ScoreWeightConfig> = {}): ScoreWeightConfig {
  return {
    publicId: 'w-1',
    name: 'Trọng số K66',
    advisorWeight: 40,
    examinerWeight: 30,
    councilWeight: 30,
    fromSemester: null,
    toSemester: null,
    displayStatus: 'DRAFT',
    displayStatusName: 'Nháp',
    version: 0,
    hasSubmittedSheets: false,
    canEdit: true,
    canApply: true,
    canChangeFromSemester: false,
    canChangeToSemester: false,
    canCancelApply: false,
    canDelete: true,
    createdByName: null,
    updatedByName: null,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  }
}

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
  return { queryClient, wrapper, invalidateSpy }
}

/** invalidateQueries đã được gọi cho danh sách W1 */
function invalidatedList(spy: ReturnType<typeof setup>['invalidateSpy']): boolean {
  return spy.mock.calls.some(([filters]) => JSON.stringify(filters?.queryKey) === JSON.stringify(scoreWeightKeys.list()))
}

describe('useScoreWeights', () => {
  beforeEach(() => vi.clearAllMocks())

  it('useScoreWeightList gọi W1', async () => {
    serviceMock.getList.mockResolvedValue([config()])
    const { wrapper } = setup()
    const { result } = renderHook(() => useScoreWeightList(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
  })

  it('useScoreWeightDetail không gọi W2 khi chưa có publicId', () => {
    const { wrapper } = setup()
    const { result } = renderHook(() => useScoreWeightDetail(undefined), { wrapper })
    expect(serviceMock.getDetail).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('useScoreWeightDetail gọi W2 và trả version mới nhất', async () => {
    serviceMock.getDetail.mockResolvedValue(config({ version: 5 }))
    const { wrapper } = setup()
    const { result } = renderHook(() => useScoreWeightDetail('w-1'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(serviceMock.getDetail).toHaveBeenCalledWith('w-1')
    expect(result.current.data?.version).toBe(5)
  })

  it('W2 lỗi 3129 (đã bị xóa) → tải lại danh sách', async () => {
    serviceMock.getDetail.mockRejectedValue(new ApiError('Không tìm thấy cấu hình', 3129, undefined, 404))
    const { wrapper, invalidateSpy } = setup()
    const { result } = renderHook(() => useScoreWeightDetail('w-1'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidatedList(invalidateSpy)).toBe(true)
  })

  it('W6 lỗi khoảng kỳ (3135) không tải lại danh sách', async () => {
    serviceMock.getApplyPreview.mockRejectedValue(new ApiError('Khoảng kỳ không hợp lệ', 3135, undefined, 400))
    const { wrapper, invalidateSpy } = setup()
    const { result } = renderHook(() => useScoreWeightApplyPreview('w-1', 's-1', null), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidatedList(invalidateSpy)).toBe(false)
  })

  it('W6 lỗi 3132 (không còn là Nháp) → tải lại danh sách', async () => {
    serviceMock.getApplyPreview.mockRejectedValue(new ApiError('Cấu hình không còn là bản nháp', 3132, undefined, 409))
    const { wrapper, invalidateSpy } = setup()
    const { result } = renderHook(() => useScoreWeightApplyPreview('w-1', 's-1', null), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidatedList(invalidateSpy)).toBe(true)
  })

  it('W6 chưa chọn "Từ kỳ" thì chưa gọi API', () => {
    const { wrapper } = setup()
    renderHook(() => useScoreWeightApplyPreview('w-1', null, null), { wrapper })
    expect(serviceMock.getApplyPreview).not.toHaveBeenCalled()
  })

  it('W6b lỗi 3138 → tải lại danh sách', async () => {
    serviceMock.getCancelApplyPreview.mockRejectedValue(new ApiError('Không ở trạng thái áp dụng', 3138, undefined, 409))
    const { wrapper, invalidateSpy } = setup()
    const { result } = renderHook(() => useScoreWeightCancelPreview('w-1'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidatedList(invalidateSpy)).toBe(true)
  })

  it('tạo thành công → toast + tải lại danh sách', async () => {
    serviceMock.create.mockResolvedValue('w-2')
    const { wrapper, invalidateSpy } = setup()
    const { result } = renderHook(() => useCreateScoreWeight(), { wrapper })
    await act(() =>
      result.current.mutateAsync({ name: 'K67', advisorWeight: 40, examinerWeight: 30, councilWeight: 30 }),
    )
    expect(toastMock.success).toHaveBeenCalledWith('Đã tạo cấu hình K67')
    expect(invalidatedList(invalidateSpy)).toBe(true)
  })

  it('sửa gửi kèm version', async () => {
    serviceMock.update.mockResolvedValue(undefined)
    const { wrapper } = setup()
    const { result } = renderHook(() => useUpdateScoreWeight(), { wrapper })
    const body = { name: 'K66', advisorWeight: 50, examinerWeight: 25, councilWeight: 25, version: 3 }
    await act(() => result.current.mutateAsync({ publicId: 'w-1', body }))
    expect(serviceMock.update).toHaveBeenCalledWith('w-1', body)
    expect(toastMock.success).toHaveBeenCalledWith('Đã cập nhật cấu hình K66')
  })

  it('sửa lỗi 3133 (người khác vừa sửa) → tải lại danh sách', async () => {
    serviceMock.update.mockRejectedValue(new ApiError('Dữ liệu đã được cập nhật', 3133, undefined, 409))
    const { wrapper, invalidateSpy } = setup()
    const { result } = renderHook(() => useUpdateScoreWeight(), { wrapper })
    const body = { name: 'K66', advisorWeight: 50, examinerWeight: 25, councilWeight: 25, version: 3 }
    await act(async () => {
      await result.current.mutateAsync({ publicId: 'w-1', body }).catch(() => undefined)
    })
    expect(invalidatedList(invalidateSpy)).toBe(true)
    expect(toastMock.success).not.toHaveBeenCalled()
  })

  it('xóa lỗi 3139 (không phải dữ liệu cũ) → không tải lại danh sách', async () => {
    serviceMock.remove.mockRejectedValue(new ApiError('Tổng trọng số không hợp lệ', 3139, undefined, 400))
    const { wrapper, invalidateSpy } = setup()
    const { result } = renderHook(() => useDeleteScoreWeight(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ publicId: 'w-1', name: 'K66' }).catch(() => undefined)
    })
    expect(invalidatedList(invalidateSpy)).toBe(false)
  })
})
