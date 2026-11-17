import { create } from 'zustand'
import type { GuidingEvaluationTabStatus } from '../types/guidingEvaluation.types'

interface GuidingEvaluationUiState {
  filterStatus: GuidingEvaluationTabStatus
  searchQuery: string
  pageSize: number
  currentPage: number
  setFilterStatus: (status: GuidingEvaluationTabStatus) => void
  setSearchQuery: (query: string) => void
  setPageSize: (size: number) => void
  setCurrentPage: (page: number) => void
  resetFilters: () => void
}

export const useGuidingEvaluationStore = create<GuidingEvaluationUiState>(
  (set) => ({
    filterStatus: 'all',
    searchQuery: '',
    pageSize: 15,
    currentPage: 1,

    setFilterStatus: (filterStatus) => set({ filterStatus, currentPage: 1 }),
    setSearchQuery: (searchQuery) => set({ searchQuery, currentPage: 1 }),
    setPageSize: (pageSize) => set({ pageSize, currentPage: 1 }),
    setCurrentPage: (currentPage) => set({ currentPage }),
    resetFilters: () =>
      set({
        filterStatus: 'all',
        searchQuery: '',
        pageSize: 15,
        currentPage: 1,
      }),
  }),
)
