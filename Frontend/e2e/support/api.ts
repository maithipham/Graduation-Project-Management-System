import type { APIRequestContext } from '@playwright/test';

export function getApiBaseUrl(): string {
  return (process.env.E2E_API_URL || 'http://localhost:8080/gpms').replace(/\/+$/, '');
}

export async function loginByEmail(request: APIRequestContext, email: string): Promise<string> {
  const res = await request.post(`${getApiBaseUrl()}/login-postman`, {
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    data: email.trim(),
  });
  if (!res.ok()) {
    throw new Error(`Không thể đăng nhập qua /login-postman (HTTP ${res.status()})`);
  }
  const body = await res.json();
  const token = body?.data?.token;
  if (!token) {
    throw new Error('Phản hồi /login-postman không chứa token');
  }
  return token;
}

export async function apiCall<T = any>(
  request: APIRequestContext,
  token: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  options?: {
    params?: Record<string, string | number | boolean | undefined>;
    data?: unknown;
  },
): Promise<{ status: number; body: T }> {
  const url = `${getApiBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {
    Cookie: `access_token=${token}`,
  };
  if (options?.data !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await request.fetch(url, {
    method,
    headers,
    params: options?.params as Record<string, string | number | boolean> | undefined,
    data: options?.data,
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }
  return { status: res.status(), body };
}
