import { API_BASE_URL, API_ENDPOINTS, apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { Notification } from '../types'

export const notificationService = {
  // GET /notification → tất cả thông báo (cả đã đọc và chưa đọc)
  async getAll(): Promise<Notification[]> {
    const res = await apiClient.get<ApiResponse<Notification[]>>(API_ENDPOINTS.notification.base)
    return res.data.data
  },

  // PATCH /notification (không có body) → đánh dấu tất cả là đã đọc
  async markAllRead(): Promise<void> {
    await apiClient.patch(API_ENDPOINTS.notification.base)
  },

  // GET /connection (SSE). EventSource không đi qua axios nên tự ghép địa chỉ backend; cookie gửi kèm nhờ withCredentials
  openStream(): EventSource {
    return new EventSource(`${API_BASE_URL}${API_ENDPOINTS.notification.stream}`, {
      withCredentials: true,
    })
  },
}
