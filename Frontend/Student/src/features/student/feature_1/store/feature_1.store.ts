import { create } from 'zustand'
import type { Feature1Item } from '../types'

interface Feature1State {
  items: Feature1Item[]
  selectedItem: Feature1Item | null
  setItems: (items: Feature1Item[]) => void
  setSelectedItem: (item: Feature1Item | null) => void
}

export const useFeature1Store = create<Feature1State>((set) => ({
  items: [],
  selectedItem: null,
  setItems: (items) => set({ items }),
  setSelectedItem: (selectedItem) => set({ selectedItem }),
}))
