import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotificationBell, parseNotification, type Notification } from '@/features/notification'
import { notificationService } from '@/features/notification/services/notification.service'
import { ApiError } from '@/shared/types'

// jsdom không có EventSource → dùng bản giả để tự bắn event
class FakeEventSource extends EventTarget {
  static instances: FakeEventSource[] = []
  closed = false
  constructor() {
    super()
    FakeEventSource.instances.push(this)
  }
  close() {
    this.closed = true
  }
  emitNotification(notification: Notification) {
    this.dispatchEvent(new MessageEvent('notification', { data: JSON.stringify(notification) }))
  }
}

const unread: Notification = { id: 1, isRead: false, message: 'Đề tài A đã được duyệt', createdAt: '2026-10-15T08:00:00' }
const read: Notification = { id: 2, isRead: true, message: 'Lịch bảo vệ đã cập nhật', createdAt: '2026-10-14T08:00:00' }

function renderBell() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <NotificationBell />
    </QueryClientProvider>,
  )
  return queryClient
}

beforeEach(() => {
  FakeEventSource.instances = []
  vi.spyOn(notificationService, 'openStream').mockImplementation(
    () => new FakeEventSource() as unknown as EventSource,
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('NotificationBell', () => {
  it('hiện số chưa đọc; mở chuông → đánh dấu tất cả đã đọc, số biến mất', async () => {
    // "Server" giả: sau PATCH thì mọi thông báo đều đã đọc
    let serverData = [read, unread]
    vi.spyOn(notificationService, 'getAll').mockImplementation(async () => serverData)
    const markAllRead = vi.spyOn(notificationService, 'markAllRead').mockImplementation(async () => {
      serverData = serverData.map((item) => ({ ...item, isRead: true }))
    })
    renderBell()

    const bell = await screen.findByRole('button', { name: 'Thông báo (1 chưa đọc)' })
    await userEvent.click(bell)

    expect(markAllRead).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Thông báo' })).toBeInTheDocument()
    // Mới nhất lên đầu
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Đề tài A đã được duyệt')
    expect(items[1]).toHaveTextContent('Lịch bảo vệ đã cập nhật')
  })

  it('không có thông báo chưa đọc → mở chuông không gọi PATCH', async () => {
    vi.spyOn(notificationService, 'getAll').mockResolvedValue([read])
    const markAllRead = vi.spyOn(notificationService, 'markAllRead')
    renderBell()

    await userEvent.click(await screen.findByRole('button', { name: 'Thông báo' }))
    expect(await screen.findByText('Lịch bảo vệ đã cập nhật')).toBeInTheDocument()
    expect(markAllRead).not.toHaveBeenCalled()
  })

  it('PATCH lỗi → trả lại số chưa đọc như cũ', async () => {
    // Lần tải lại sau PATCH không bao giờ xong → số hiển thị chắc chắn đến từ việc khôi phục cache
    vi.spyOn(notificationService, 'getAll')
      .mockResolvedValueOnce([unread])
      .mockImplementation(() => new Promise<Notification[]>(() => {}))
    vi.spyOn(notificationService, 'markAllRead').mockRejectedValue(new ApiError('Lỗi máy chủ', 500, undefined, 500))
    renderBell()

    await userEvent.click(await screen.findByRole('button', { name: 'Thông báo (1 chưa đọc)' }))
    expect(await screen.findByRole('button', { name: 'Thông báo (1 chưa đọc)' })).toBeInTheDocument()
  })

  it('nhận thông báo mới qua SSE → số trên chuông tăng, không trùng khi nhận lại', async () => {
    vi.spyOn(notificationService, 'getAll').mockResolvedValue([read])
    renderBell()
    await screen.findByRole('button', { name: 'Thông báo' })

    const stream = FakeEventSource.instances[0]
    act(() => {
      stream.emitNotification(unread)
      stream.emitNotification(unread)
    })

    expect(await screen.findByRole('button', { name: 'Thông báo (1 chưa đọc)' })).toBeInTheDocument()
  })

  it('gỡ chuông (rời layout / đăng xuất) → đóng kết nối SSE', async () => {
    vi.spyOn(notificationService, 'getAll').mockResolvedValue([])
    renderBell()
    await screen.findByRole('button', { name: 'Thông báo' })

    const { cleanup } = await import('@testing-library/react')
    cleanup()
    await waitFor(() => expect(FakeEventSource.instances[0].closed).toBe(true))
  })
})

describe('parseNotification', () => {
  it('đọc JSON hợp lệ, bỏ qua dữ liệu hỏng', () => {
    expect(parseNotification(JSON.stringify(unread))).toEqual(unread)
    expect(parseNotification('không phải json')).toBeNull()
    expect(parseNotification('{"message":"thiếu id"}')).toBeNull()
  })
})
