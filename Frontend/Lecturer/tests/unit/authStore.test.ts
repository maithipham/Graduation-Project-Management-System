import { describe, expect, it, beforeEach } from 'vitest'
import { useAuthStore } from '@/feature/auth/store/authStore'


describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('sets active role correctly', () => {
    useAuthStore.getState().setActiveRole('lecturer')
    expect(useAuthStore.getState().activeRole).toBe('lecturer')

    useAuthStore.getState().setActiveRole('department-head')
    expect(useAuthStore.getState().activeRole).toBe('department-head')

    useAuthStore.getState().setActiveRole('admin')
    expect(useAuthStore.getState().activeRole).toBe('admin')
  })


  it('sets and clears token correctly', () => {
    useAuthStore.getState().setToken('mock-jwt-token')
    expect(useAuthStore.getState().token).toBe('mock-jwt-token')

    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().token).toBe(null)
    expect(useAuthStore.getState().activeRole).toBe(null)
  })
})
