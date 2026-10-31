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

// Kênh tin nhắn giữa các tab cùng domain: một tab đăng xuất thì các tab còn lại cũng về /login ngay.
// Tab gửi tin không tự nhận lại tin của chính nó
const SIGNED_OUT_MESSAGE = 'signed-out'
const authChannel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('gpms-auth')

authChannel?.addEventListener('message', (event: MessageEvent) => {
  if (event.data === SIGNED_OUT_MESSAGE) notifyUnauthorized()
})

/** Gọi sau khi đăng xuất để báo cho các tab khác */
export function broadcastSignedOut(): void {
  authChannel?.postMessage(SIGNED_OUT_MESSAGE)
}
