import { create } from 'zustand'
import type { Feature2Item } from '../types'

interface Feature2State {
  items: Feature2Item[]
  selectedId: string | null
  setItems: (items: Feature2Item[]) => void
  setSelectedId: (id: string | null) => void
}

export const useFeature2Store = create<Feature2State>((set) => ({
  items: [],
  selectedId: null,
  setItems: (items) => set({ items }),
  setSelectedId: (selectedId) => set({ selectedId }),
}))
