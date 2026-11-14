import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id'>) => string
  removeToast: (id: string) => void
  clearAll: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: ({ type, message, duration = 3000 }) => {
    const id = Math.random().toString(36).substring(2, 9)

    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }],
    }))

    // Mặc định tự động đóng sau 3 giây (3000ms)
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, duration)
    }

    return id
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearAll: () => set({ toasts: [] }),
}))

/**
 * Tiện ích gọi Toast thông báo (mặc định hiển thị trong 3s)
 * Có thể gọi trực tiếp trong React Component hoặc trong Axios Interceptor / Service
 */
export const toast = {
  success: (message: string, duration = 3000) =>
    useToastStore.getState().addToast({ type: 'success', message, duration }),
  error: (message: string, duration = 3000) =>
    useToastStore.getState().addToast({ type: 'error', message, duration }),
  warning: (message: string, duration = 3000) =>
    useToastStore.getState().addToast({ type: 'warning', message, duration }),
  info: (message: string, duration = 3000) =>
    useToastStore.getState().addToast({ type: 'info', message, duration }),
}
