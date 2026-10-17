import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { notificationService } from '../services/notification.service'
import type { Notification } from '../types'

export const notificationKeys = {
  all: ['notifications'] as const,
}

// Mới nhất lên đầu (không phụ thuộc thứ tự BE trả về)
function sortNewestFirst(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: notificationService.getAll,
    select: sortNewestFirst,
  })
}

/** Thông báo mới nhận qua SSE → chèn vào cache, số trên chuông tự tăng (không gọi lại API) */
export function addNotificationToCache(queryClient: QueryClient, notification: Notification) {
  queryClient.setQueryData<Notification[]>(notificationKeys.all, (old) =>
    // Chưa tải danh sách lần nào thì bỏ qua: lần tải đầu tiên sẽ có luôn thông báo này
    old ? [notification, ...old.filter((item) => item.id !== notification.id)] : old,
  )
}

/**
 * Đánh dấu tất cả là đã đọc. Cập nhật giao diện ngay (optimistic) rồi mới gọi API;
 * API lỗi thì trả lại trạng thái cũ (interceptor đã tự hiện toast lỗi).
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationService.markAllRead,
    onMutate: async () => {
      // Hủy lần tải danh sách đang chạy để nó không ghi đè dữ liệu vừa sửa
      await queryClient.cancelQueries({ queryKey: notificationKeys.all })
      const previous = queryClient.getQueryData<Notification[]>(notificationKeys.all)
      queryClient.setQueryData<Notification[]>(notificationKeys.all, (old) =>
        old?.map((item) => ({ ...item, isRead: true })),
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(notificationKeys.all, context?.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}
