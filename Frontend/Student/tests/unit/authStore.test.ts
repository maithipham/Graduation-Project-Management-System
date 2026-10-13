import { describe, expect, it, beforeEach } from 'vitest'
import { useAuthStore } from '@/features/auth/store/authStore'


describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('sets active role correctly', () => {
    useAuthStore.getState().setActiveRole('student')
    expect(useAuthStore.getState().activeRole).toBe('student')
  })


  it('sets and clears token correctly', () => {
    useAuthStore.getState().setToken('mock-jwt-token')
    expect(useAuthStore.getState().token).toBe('mock-jwt-token')

    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().token).toBe(null)
    expect(useAuthStore.getState().activeRole).toBe(null)
  })
})
