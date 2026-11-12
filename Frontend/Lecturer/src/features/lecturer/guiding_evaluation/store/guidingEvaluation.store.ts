import { create } from 'zustand'
import type {
  GuidingEvaluationTabStatus,
  RubricScores,
} from '../types/guidingEvaluation.types'

interface LocalRubricEntry {
  score: number | null
  rubricScores: RubricScores
}

interface GuidingEvaluationUiState {
  filterStatus: GuidingEvaluationTabStatus
  searchQuery: string
  pageSize: number
  currentPage: number
  localRubrics: Record<string, LocalRubricEntry>
  setFilterStatus: (status: GuidingEvaluationTabStatus) => void
  setSearchQuery: (query: string) => void
  setPageSize: (size: number) => void
  setCurrentPage: (page: number) => void
  saveLocalRubric: (
    topicPublicId: string,
    score: number,
    rubricScores: RubricScores,
    isDraft: boolean,
  ) => void
  resetFilters: () => void
}

export const useGuidingEvaluationStore = create<GuidingEvaluationUiState>(
  (set) => ({
    filterStatus: 'all',
    searchQuery: '',
    pageSize: 15,
    currentPage: 1,
    localRubrics: {},

    setFilterStatus: (filterStatus) => set({ filterStatus, currentPage: 1 }),
    setSearchQuery: (searchQuery) => set({ searchQuery, currentPage: 1 }),
    setPageSize: (pageSize) => set({ pageSize, currentPage: 1 }),
    setCurrentPage: (currentPage) => set({ currentPage }),
    saveLocalRubric: (topicPublicId, score, rubricScores, isDraft) =>
      set((state) => {
        const existing = state.localRubrics[topicPublicId]
        return {
          localRubrics: {
            ...state.localRubrics,
            [topicPublicId]: {
              score: isDraft ? (existing?.score ?? null) : score,
              rubricScores,
            },
          },
        }
      }),
    resetFilters: () =>
      set({
        filterStatus: 'all',
        searchQuery: '',
        pageSize: 15,
        currentPage: 1,
        localRubrics: {},
      }),
  }),
)
