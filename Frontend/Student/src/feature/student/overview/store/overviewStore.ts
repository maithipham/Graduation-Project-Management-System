import { create } from 'zustand'
import type { OverviewProgress } from '../types'

interface OverviewState {
  progress: OverviewProgress | null
  setProgress: (p: OverviewProgress) => void
}

export const useOverviewStore = create<OverviewState>((set) => ({
  progress: null,
  setProgress: (progress) => set({ progress }),
}))
