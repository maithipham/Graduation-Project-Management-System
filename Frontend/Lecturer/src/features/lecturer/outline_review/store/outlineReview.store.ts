import { create } from 'zustand'
import type { OutlineRole, OutlineTabStatus } from '../types/outlineReview.types'

interface OutlineReviewUiState {
  activeRole: OutlineRole
  tabStatus: OutlineTabStatus
  searchQuery: string
  selectedSemesterId: string
  readOutlineIds: string[]
  setActiveRole: (role: OutlineRole) => void
  setTabStatus: (status: OutlineTabStatus) => void
  setSearchQuery: (query: string) => void
  setSelectedSemesterId: (id: string) => void
  markOutlineAsRead: (id: string) => void
}

export const useOutlineReviewStore = create<OutlineReviewUiState>((set) => ({
  activeRole: 'guide',
  tabStatus: 'PENDING',
  searchQuery: '',
  selectedSemesterId: '',
  readOutlineIds: [],

  setActiveRole: (role) => set({ activeRole: role }),
  setTabStatus: (status) => set({ tabStatus: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedSemesterId: (id) => set({ selectedSemesterId: id }),
  markOutlineAsRead: (id) =>
    set((state) =>
      state.readOutlineIds.includes(id)
        ? state
        : { readOutlineIds: [...state.readOutlineIds, id] },
    ),
}))
