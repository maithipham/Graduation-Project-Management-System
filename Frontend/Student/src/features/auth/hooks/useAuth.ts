import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.activeRole)
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = Boolean(useAuthStore((state) => state.token || state.activeRole))
  const setActiveRole = useAuthStore((state) => state.setActiveRole)
  const setUser = useAuthStore((state) => state.setUser)
  const setToken = useAuthStore((state) => state.setToken)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  return {
    user,
    role,
    token,
    isAuthenticated,
    setActiveRole,
    setUser,
    setToken,
    clearAuth,
  }
}
