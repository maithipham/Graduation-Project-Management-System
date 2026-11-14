// NotificationResponse { Long id; boolean isRead; String message; LocalDateTime createdAt }
export interface Notification {
  id: number
  isRead: boolean
  message: string
  createdAt: string // LocalDateTime dạng ISO, ví dụ "2026-10-16T00:05:30"
}
