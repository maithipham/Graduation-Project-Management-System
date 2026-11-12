import { create } from 'zustand'
import type { ReportTabStatus } from '../types/reportCheck.types'

interface ReportCheckUiState {
  searchQuery: string
  filterStatus: ReportTabStatus
  pageSize: number
  currentPage: number
  setSearchQuery: (query: string) => void
  setFilterStatus: (status: ReportTabStatus) => void
  setPageSize: (size: number) => void
  setCurrentPage: (page: number) => void
  resetFilters: () => void
}

export const useReportCheckStore = create<ReportCheckUiState>((set) => ({
  searchQuery: '',
  filterStatus: 'pending',
  pageSize: 15,
  currentPage: 1,

  setSearchQuery: (searchQuery) => set({ searchQuery, currentPage: 1 }),
  setFilterStatus: (filterStatus) => set({ filterStatus, currentPage: 1 }),
  setPageSize: (pageSize) => set({ pageSize, currentPage: 1 }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  resetFilters: () =>
    set({
      searchQuery: '',
      filterStatus: 'pending',
      pageSize: 15,
      currentPage: 1,
    }),
}))
