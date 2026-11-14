/// <reference types="vite/client" />

// Khai báo kiểu cho biến môi trường (xem .env.example) — gõ sai tên biến sẽ báo lỗi khi kiểm tra kiểu
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_GOOGLE_REDIRECT_URI: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
