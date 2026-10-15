import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setupInterceptors } from '@/shared/api/interceptors'
import { shouldRetryQuery } from '@/shared/api/queryClient'
import { API_ENDPOINTS } from '@/shared/api/endpoints'
import { onUnauthorized } from '@/shared/api/session'
import { useToastStore } from '@/shared/components/feedback/toast.store'
import { ApiError, NETWORK_ERROR_CODE } from '@/shared/types'

type FakeReply =
  | { status: number; data: unknown }
  | { networkError: 'ERR_NETWORK' | 'ECONNABORTED' }

// Tạo axios instance có interceptor thật, nhưng "server" là adapter giả.
// reply có thể là 1 hàm để trả kết quả khác nhau theo từng request.
function createClient(replyOrFn: FakeReply | ((config: InternalAxiosRequestConfig) => FakeReply)) {
  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    const reply = typeof replyOrFn === 'function' ? replyOrFn(config) : replyOrFn
    if ('networkError' in reply) {
      throw new AxiosError('fail', reply.networkError, config)
    }
    const response = { data: reply.data, status: reply.status, statusText: '', headers: {}, config }
    if (reply.status >= 400) {
      throw new AxiosError('fail', AxiosError.ERR_BAD_RESPONSE, config, null, response)
    }
    return response
  }
  const client = axios.create({ adapter })
  setupInterceptors(client)
  return client
}

function errorToasts() {
  return useToastStore.getState().toasts.filter((t) => t.type === 'error').map((t) => t.message)
}

describe('interceptors: chuẩn hóa lỗi thành ApiError', () => {
  beforeEach(() => {
    useToastStore.getState().clearAll()
  })

  it('HTTP 200 + code 1000 → trả response bình thường', async () => {
    const client = createClient({ status: 200, data: { code: 1000, message: 'OK', data: 1 } })
    const res = await client.get('/x')
    expect(res.data.data).toBe(1)
    expect(errorToasts()).toEqual([])
  })

  it('HTTP 200 + code khác 1000 → ApiError mang code nghiệp vụ, có toast', async () => {
    const client = createClient({ status: 200, data: { code: 1005, message: 'Đề tài đã bị khóa', data: null } })
    const error = await client.get('/x').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 1005, status: 200, message: 'Đề tài đã bị khóa' })
    expect(errorToasts()).toEqual(['Đề tài đã bị khóa'])
  })

  it('HTTP 400 có body APIResponse → ApiError lấy code + message của BE', async () => {
    const client = createClient({ status: 400, data: { code: 1003, message: 'Tên đã tồn tại', data: null } })
    const error = await client.get('/x').catch((e: unknown) => e)
    expect(error).toMatchObject({ code: 1003, status: 400, message: 'Tên đã tồn tại' })
  })

  it('HTTP 500 không có body → ApiError với code = HTTP status', async () => {
    const client = createClient({ status: 500, data: '' })
    const error = await client.get('/x').catch((e: unknown) => e)
    expect(error).toMatchObject({ code: 500, status: 500 })
    expect(errorToasts()).toHaveLength(1)
  })

  it('mất mạng / timeout → ApiError NETWORK_ERROR_CODE, không có status', async () => {
    const offline = await createClient({ networkError: 'ERR_NETWORK' }).get('/x').catch((e: unknown) => e)
    expect(offline).toMatchObject({ code: NETWORK_ERROR_CODE, status: undefined })

    const timeout = await createClient({ networkError: 'ECONNABORTED' }).get('/x').catch((e: unknown) => e)
    expect(timeout).toMatchObject({ message: 'Máy chủ phản hồi quá lâu. Vui lòng thử lại.' })
  })

  it('skipErrorToast: vẫn reject ApiError nhưng không hiện toast', async () => {
    const client = createClient({ status: 400, data: { code: 1003, message: 'Lỗi', data: null } })
    const error = await client.get('/x', { skipErrorToast: true }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(errorToasts()).toEqual([])
  })

  it('request bị hủy → không toast, không đổi thành ApiError', async () => {
    const client = createClient({ status: 200, data: { code: 1000, message: 'OK', data: 1 } })
    const controller = new AbortController()
    controller.abort()
    const error = await client.get('/x', { signal: controller.signal }).catch((e: unknown) => e)
    expect(axios.isCancel(error)).toBe(true)
    expect(errorToasts()).toEqual([])
  })
})

describe('interceptors: 401 → refresh token → gửi lại / về trang đăng nhập', () => {
  const unauthorized: FakeReply = { status: 401, data: { code: 2000, message: 'Phiên đăng nhập của bạn đã hết hạn' } }
  const ok: FakeReply = { status: 200, data: { code: 1000, message: 'OK', data: 'dữ liệu' } }
  let unsubscribe: (() => void) | undefined
  let fakeNow = Date.now()

  /**
   * "Server" giả: phiên ban đầu hết hạn; gọi refresh-token trả refreshReply,
   * nếu refresh thành công thì các request sau được 200.
   */
  function createServer(refreshReply: FakeReply, opts: { stillUnauthorizedAfterRefresh?: boolean } = {}) {
    const calls: string[] = []
    let sessionValid = false
    const client = createClient((config) => {
      calls.push(config.url ?? '')
      if (config.url === API_ENDPOINTS.auth.refreshToken) {
        if ('status' in refreshReply && refreshReply.status === 200 && !opts.stillUnauthorizedAfterRefresh) {
          sessionValid = true
        }
        return refreshReply
      }
      return sessionValid ? ok : unauthorized
    })
    return { client, calls }
  }

  beforeEach(() => {
    useToastStore.getState().clearAll()
    // Mỗi test cách nhau xa hơn khoảng chống trùng 3 giây
    fakeNow += 60_000
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(fakeNow)
  })

  afterEach(() => {
    unsubscribe?.()
    unsubscribe = undefined
    vi.useRealTimers()
  })

  it('refresh thành công → tự gửi lại request, người dùng không thấy lỗi', async () => {
    const handler = vi.fn()
    unsubscribe = onUnauthorized(handler)
    const { client, calls } = createServer(ok)

    const res = await client.get('/x')
    expect(res.data.data).toBe('dữ liệu')
    expect(calls).toEqual(['/x', API_ENDPOINTS.auth.refreshToken, '/x'])
    expect(handler).not.toHaveBeenCalled()
    expect(errorToasts()).toEqual([])
  })

  it('refresh trả 401 → về trang đăng nhập, không hiện thông báo, không gửi lại', async () => {
    const handler = vi.fn()
    unsubscribe = onUnauthorized(handler)
    const { client, calls } = createServer(unauthorized)

    const error = await client.get('/x').catch((e: unknown) => e)
    expect(error).toMatchObject({ status: 401 })
    expect(calls).toEqual(['/x', API_ENDPOINTS.auth.refreshToken])
    expect(handler).toHaveBeenCalledTimes(1)
    expect(errorToasts()).toEqual([])
  })

  it('refresh trả HTTP 200 nhưng code khác 1000 → coi như thất bại', async () => {
    const handler = vi.fn()
    unsubscribe = onUnauthorized(handler)
    const { client } = createServer({ status: 200, data: { code: 2001, message: 'Refresh token không hợp lệ' } })

    await client.get('/x').catch(() => undefined)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(errorToasts()).toEqual([])
  })

  it('refresh thành công nhưng gửi lại vẫn 401 → về trang đăng nhập, chỉ refresh 1 lần', async () => {
    const handler = vi.fn()
    unsubscribe = onUnauthorized(handler)
    const { client, calls } = createServer(ok, { stillUnauthorizedAfterRefresh: true })

    await client.get('/x').catch(() => undefined)
    expect(calls).toEqual(['/x', API_ENDPOINTS.auth.refreshToken, '/x'])
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('nhiều request cùng bị 401 → chỉ gọi refresh 1 lần, tất cả được gửi lại', async () => {
    const { client, calls } = createServer(ok)

    const results = await Promise.all([client.get('/a'), client.get('/b'), client.get('/c')])
    expect(results.map((r) => r.data.data)).toEqual(['dữ liệu', 'dữ liệu', 'dữ liệu'])
    expect(calls.filter((url) => url === API_ENDPOINTS.auth.refreshToken)).toHaveLength(1)
  })

  it('nhiều request cùng thất bại → chỉ chuyển trang 1 lần', async () => {
    const handler = vi.fn()
    unsubscribe = onUnauthorized(handler)
    const { client } = createServer(unauthorized)

    await Promise.all([client.get('/a'), client.get('/b'), client.get('/c')].map((p) => p.catch(() => undefined)))
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('shouldRetryQuery', () => {
  it('thử lại 1 lần với lỗi mạng và lỗi 5xx', () => {
    expect(shouldRetryQuery(0, new ApiError('x', NETWORK_ERROR_CODE))).toBe(true)
    expect(shouldRetryQuery(0, new ApiError('x', 500, undefined, 503))).toBe(true)
    expect(shouldRetryQuery(1, new ApiError('x', 500, undefined, 503))).toBe(false)
  })

  it('không thử lại lỗi 4xx, lỗi nghiệp vụ và lỗi lạ', () => {
    expect(shouldRetryQuery(0, new ApiError('x', 404, undefined, 404))).toBe(false)
    expect(shouldRetryQuery(0, new ApiError('x', 2000, undefined, 200))).toBe(false)
    expect(shouldRetryQuery(0, new Error('x'))).toBe(false)
  })
})
