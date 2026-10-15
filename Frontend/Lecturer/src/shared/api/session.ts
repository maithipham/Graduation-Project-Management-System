type UnauthorizedHandler = () => void

// Nhiều request cùng bị 401 chỉ xử lý 1 lần trong khoảng này
const DEDUPE_WINDOW_MS = 3000

let handler: UnauthorizedHandler | null = null
let lastNotifiedAt = Number.NEGATIVE_INFINITY

/**
 * Đăng ký việc cần làm khi phiên đăng nhập không còn hợp lệ (xóa trạng thái đăng nhập, chuyển về /login).
 * shared/ không biết tới auth/router nên tầng app đăng ký handler này. Trả về hàm hủy đăng ký.
 */
export function onUnauthorized(fn: UnauthorizedHandler): () => void {
  handler = fn
  return () => {
    if (handler === fn) handler = null
  }
}

/** Interceptor gọi khi gặp 401 mà refresh token cũng thất bại */
export function notifyUnauthorized(): void {
  const now = Date.now()
  if (now - lastNotifiedAt < DEDUPE_WINDOW_MS) return
  lastNotifiedAt = now
  handler?.()
}
