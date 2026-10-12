import { create } from 'zustand'
import type { UserRole } from '../types'

export interface UserSession {
  id: string
  name: string
  email: string
  role: UserRole
  code?: string
}

type AuthState = {
  activeRole: UserRole | null
  user: UserSession | null
  token: string | null
  setActiveRole: (role: UserRole) => void
  setUser: (user: UserSession | null) => void
  setToken: (token: string | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  activeRole: (localStorage.getItem('active_role') as UserRole) || 'student', // Mặc định role để demo
  user: null,
  token: localStorage.getItem('access_token') || null,
  setActiveRole: (activeRole) => {
    localStorage.setItem('active_role', activeRole)
    set({ activeRole })
  },
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) localStorage.setItem('access_token', token)
    else localStorage.removeItem('access_token')
    set({ token })
  },
  clearAuth: () => {
    localStorage.removeItem('active_role')
    localStorage.removeItem('access_token')
    set({ activeRole: null, user: null, token: null })
  },
}))
