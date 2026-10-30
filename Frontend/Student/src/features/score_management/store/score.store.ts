import { create } from 'zustand'
import type { StudentSemesterScoreCard } from '../types/score.types'
import { scoreService } from '../services/score.service'

interface ScoreState {
  results: StudentSemesterScoreCard[]
  setResults: (results: StudentSemesterScoreCard[]) => void
}

export const useScoreStore = create<ScoreState>((set) => ({
  results: scoreService.getResults(),
  setResults: (results) => set({ results }),
}))
