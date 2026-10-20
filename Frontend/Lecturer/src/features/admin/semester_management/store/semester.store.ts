import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Semester, SemesterFormValues } from '../types/semester.types'

interface SemesterState {
  semesters: Semester[]
  addSemester: (values: SemesterFormValues) => Semester
  updateSemester: (id: number, values: SemesterFormValues) => void
  activateSemester: (id: number) => void
  resetToInitial: () => void
}

const initialSemesters: Semester[] = []

export const useSemesterStore = create<SemesterState>()(
  persist(
    (set, get) => ({
      semesters: initialSemesters,

      addSemester: (values) => {
        const current = get().semesters
        const nextId = current.length
          ? Math.max(...current.map((s) => s.id)) + 1
          : 1
        const newSemester: Semester = {
          id: nextId,
          name: values.name,
          startDate: values.startDate,
          endDate: values.endDate,
          status: 'upcoming',
        }
        set({ semesters: [...current, newSemester] })
        return newSemester
      },

      updateSemester: (id, values) => {
        set((state) => ({
          semesters: state.semesters.map((s) =>
            s.id === id
              ? {
                  ...s,
                  name: values.name,
                  startDate: values.startDate,
                  endDate: values.endDate,
                }
              : s,
          ),
        }))
      },

      activateSemester: (id) => {
        set((state) => ({
          semesters: state.semesters.map((s) => {
            if (s.id === id) {
              return { ...s, status: 'active' }
            }
            if (s.status === 'active') {
              return { ...s, status: 'ended' }
            }
            return s
          }),
        }))
      },

      resetToInitial: () => set({ semesters: initialSemesters }),
    }),
    {
      name: 'gpms_admin_semesters',
      version: 2,
      migrate: () => ({ semesters: [] }),
    },
  ),
)
