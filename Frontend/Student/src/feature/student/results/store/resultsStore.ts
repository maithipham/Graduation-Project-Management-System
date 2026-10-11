import { create } from 'zustand'
import type { EvaluationScore } from '../types'

interface ResultsState {
  scores: EvaluationScore | null
  setScores: (scores: EvaluationScore) => void
}

export const useResultsStore = create<ResultsState>((set) => ({
  scores: null,
  setScores: (scores) => set({ scores }),
}))
