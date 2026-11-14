import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { myInfoQueryOptions } from '@/features/auth'
import { isApiError } from '@/shared/types'
import { notificationService } from '../services/notification.service'
import type { Notification } from '../types'
import { addNotificationToCache, notificationKeys } from './useNotifications'

const FIRST_RETRY_DELAY_MS = 1000
const MAX_RETRY_DELAY_MS = 30 * 1000

/** data của event "notification" là JSON NotificationResponse */
export function parseNotification(data: string): Notification | null {
  try {
    const value: unknown = JSON.parse(data)
    if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'number') {
      return value as Notification
    }
  } catch {
    // Dữ liệu không phải JSON: bỏ qua event này
  }
  return null
}

/**
 * Mở kết nối SSE GET /connection để nhận thông báo mới theo thời gian thực. Tự đóng khi component bị gỡ.
 *
 * Kết nối bị ngắt (BE hết 30 phút, token hết hạn, mất mạng): EventSource gặp 401 sẽ dừng hẳn, không tự thử lại.
 * Vì vậy tự xử lý: đóng → chờ (1s, 2s, 4s… tối đa 30s) → gọi GET /my-info qua apiClient
 * (401 thì interceptor tự refresh cookie; refresh hỏng thì tự về /login) → mở lại kết nối.
 */
export function useNotificationStream() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let source: EventSource | null = null
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let retryDelay = FIRST_RETRY_DELAY_MS
    let hasConnectedBefore = false
    let stopped = false

    const handleNotification = (event: MessageEvent<string>) => {
      const notification = parseNotification(event.data)
      if (notification) addNotificationToCache(queryClient, notification)
    }

    const scheduleReconnect = () => {
      if (stopped) return
      const delay = retryDelay
      retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS)

      retryTimer = setTimeout(async () => {
        try {
          await queryClient.fetchQuery({ ...myInfoQueryOptions, staleTime: 0 })
        } catch (error) {
          // 401: phiên đã hết hẳn, interceptor đang chuyển về /login → không mở lại
          if (!(isApiError(error) && error.status === 401)) scheduleReconnect()
          return
        }
        connect()
      }, delay)
    }

    const connect = () => {
      if (stopped) return
      const eventSource = notificationService.openStream()
      source = eventSource

      eventSource.addEventListener('open', () => {
        retryDelay = FIRST_RETRY_DELAY_MS
        // Mở lại sau khi bị ngắt: có thể đã lỡ thông báo trong lúc mất kết nối → tải lại danh sách
        if (hasConnectedBefore) {
          void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
        }
        hasConnectedBefore = true
      })
      eventSource.addEventListener('notification', handleNotification)
      eventSource.addEventListener('error', () => {
        eventSource.close()
        scheduleReconnect()
      })
    }

    connect()

    return () => {
      stopped = true
      clearTimeout(retryTimer)
      source?.close()
    }
  }, [queryClient])
}
