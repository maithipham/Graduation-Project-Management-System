import { create } from 'zustand'
import type { TemplateDocumentItem } from '../types/template.types'
import { templateService } from '../services/template.service'

interface TemplateState {
  documents: TemplateDocumentItem[]
  selectedIds: number[]
  setSelectedIds: (
    ids: number[] | ((prev: number[]) => number[]),
  ) => void
}

export const useTemplateStore = create<TemplateState>((set) => ({
  documents: templateService.getDocuments(),
  selectedIds: [],
  setSelectedIds: (selectedIds) =>
    set((state) => ({
      selectedIds:
        typeof selectedIds === 'function'
          ? selectedIds(state.selectedIds)
          : selectedIds,
    })),
}))
