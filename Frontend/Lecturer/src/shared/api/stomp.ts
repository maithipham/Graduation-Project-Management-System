import { Client } from '@stomp/stompjs'
import { API_BASE_URL } from './client'

/**
 * Địa chỉ WebSocket STOMP của backend (endpoint /ws).
 * http(s)://host:port → ws(s)://host:port/ws. Base URL tương đối (proxy '/api') → dùng host hiện tại.
 */
export function getStompUrl(): string {
  if (/^https?:\/\//.test(API_BASE_URL)) {
    return `${API_BASE_URL.replace(/^http/, 'ws').replace(/\/$/, '')}/ws`
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}${API_BASE_URL.replace(/\/$/, '')}/ws`
}

/**
 * Tạo client STOMP (chưa kết nối, gọi activate() để kết nối).
 * Xác thực: trình duyệt tự gửi cookie access_token lúc handshake, BE kiểm tra ở frame CONNECT
 * → frontend không đọc / gửi token. Mất kết nối thì tự kết nối lại sau 5 giây.
 */
export function createStompClient(): Client {
  return new Client({
    brokerURL: getStompUrl(),
    reconnectDelay: 5000,
    heartbeatIncoming: 20000,
    heartbeatOutgoing: 20000,
  })
}
