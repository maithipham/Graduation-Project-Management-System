/** location.state của trang /login */
export type LoginLocationState = {
  /** Lỗi đăng nhập hiện dưới nút (do trang /authenticate chuyển sang) */
  error?: string
  /** Vừa đăng xuất / hết phiên: trang /login sẽ xóa cache sau khi đã hiện */
  signedOut?: boolean
} | null

/**
 * Dùng khi đăng xuất hoặc hết phiên: navigate('/login', { replace: true, state: SIGNED_OUT_STATE }).
 *
 * Không gọi queryClient.clear() ngay lúc chuyển trang: LoginPage nạp lazy nên layout cũ còn hiển thị thêm một lúc,
 * cache trống làm layout gọi lại /my-info, /notification và mở lại SSE /connection. LoginPage tự xóa cache khi đã hiện.
 */
export const SIGNED_OUT_STATE: LoginLocationState = { signedOut: true }
