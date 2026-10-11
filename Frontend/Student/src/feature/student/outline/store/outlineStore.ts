import { create } from 'zustand'
import type { StudentOutline } from '../types'

interface OutlineState {
  outline: StudentOutline | null
  setOutline: (outline: StudentOutline | null) => void
}

export const useOutlineStore = create<OutlineState>((set) => ({
  outline: null,
  setOutline: (outline) => set({ outline }),
}))
