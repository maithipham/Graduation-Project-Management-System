import { create } from 'zustand'
import type { LecturerDashboardStats } from '../types'

interface DashboardState {
  stats: LecturerDashboardStats | null
  setStats: (stats: LecturerDashboardStats) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  setStats: (stats) => set({ stats }),
}))
