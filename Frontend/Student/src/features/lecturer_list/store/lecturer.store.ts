import { create } from 'zustand'
import type { Lecturer } from '../types/lecturer.types'
import { LECTURERS_MOCK } from '../services/lecturer.service'

interface LecturerState {
  lecturers: Lecturer[]
  selectedLecturer: Lecturer | null
  setSelectedLecturer: (lecturer: Lecturer | null) => void
}

export const useLecturerStore = create<LecturerState>((set) => ({
  lecturers: LECTURERS_MOCK,
  selectedLecturer: null,
  setSelectedLecturer: (selectedLecturer) => set({ selectedLecturer }),
}))
