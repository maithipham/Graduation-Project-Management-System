import { create } from 'zustand'
import type { OutlineEditorData, OutlineSubmissionItem } from '../types/outline.types'
import { outlineService } from '../services/outline.service'

interface OutlineState {
  outlineData: OutlineEditorData
  history: OutlineSubmissionItem[]
  setOutlineData: (data: OutlineEditorData) => void
  setHistory: (
    history:
      | OutlineSubmissionItem[]
      | ((prev: OutlineSubmissionItem[]) => OutlineSubmissionItem[]),
  ) => void
}

export const useOutlineStore = create<OutlineState>((set) => ({
  outlineData: outlineService.loadDraft(''),
  history: outlineService.getInitialSubmissions(),
  setOutlineData: (outlineData) => set({ outlineData }),
  setHistory: (history) =>
    set((state) => ({
      history: typeof history === 'function' ? history(state.history) : history,
    })),
}))
