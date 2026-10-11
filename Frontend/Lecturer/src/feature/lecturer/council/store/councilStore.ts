import { create } from 'zustand'
import type { CouncilDefenseStudent } from '../types'

interface CouncilState {
  students: CouncilDefenseStudent[]
  selectedStudent: CouncilDefenseStudent | null
  setStudents: (students: CouncilDefenseStudent[]) => void
  setSelectedStudent: (student: CouncilDefenseStudent | null) => void
}

export const useCouncilStore = create<CouncilState>((set) => ({
  students: [],
  selectedStudent: null,
  setStudents: (students) => set({ students }),
  setSelectedStudent: (student) => set({ selectedStudent: student }),
}))
