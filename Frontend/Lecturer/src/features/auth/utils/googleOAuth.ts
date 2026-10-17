const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

// Chuỗi ngẫu nhiên gửi sang Google và nhận lại ở /authenticate để chắc chắn callback do chính mình khởi tạo (chống CSRF)
const OAUTH_STATE_KEY = 'google_oauth_state'

function createOAuthState(): string {
  const state = crypto.randomUUID()
  sessionStorage.setItem(OAUTH_STATE_KEY, state)
  return state
}

/** Đọc state đã lưu rồi xóa luôn (mỗi state chỉ dùng 1 lần) */
export function consumeOAuthState(): string | null {
  const state = sessionStorage.getItem(OAUTH_STATE_KEY)
  sessionStorage.removeItem(OAUTH_STATE_KEY)
  return state
}

/** URL trang chọn tài khoản Google. Google xong sẽ quay về VITE_GOOGLE_REDIRECT_URI kèm ?code&state */
export function buildGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state: createOAuthState(),
    // Luôn hiện màn chọn tài khoản (máy có nhiều tài khoản Google)
    prompt: 'select_account',
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}
