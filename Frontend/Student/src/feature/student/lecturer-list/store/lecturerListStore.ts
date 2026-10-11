import { create } from 'zustand'
import type { LecturerInfo } from '../types'

interface LecturerListState {
  lecturers: LecturerInfo[]
  setLecturers: (lecturers: LecturerInfo[]) => void
}

export const useLecturerListStore = create<LecturerListState>((set) => ({
  lecturers: [],
  setLecturers: (lecturers) => set({ lecturers }),
}))
