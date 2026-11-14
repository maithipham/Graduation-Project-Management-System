import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Semester, SemesterFormValues } from '../types/semester.types'

interface SemesterState {
  semesters: Semester[]
  updateSemester: (id: number, values: SemesterFormValues) => void
  resetToInitial: () => void
}

const initialSemesters: Semester[] = []

export const useSemesterStore = create<SemesterState>()(
  persist(
    (set) => ({
      semesters: initialSemesters,

      updateSemester: (id, values) => {
        set((state) => ({
          semesters: state.semesters.map((s) =>
            s.id === id
              ? {
                  ...s,
                  name: values.name || s.name,
                  startDate: values.startDate,
                  endDate: values.endDate,
                }
              : s,
          ),
        }))
      },

      resetToInitial: () => set({ semesters: initialSemesters }),
    }),
    {
      name: 'gpms_admin_semesters',
      version: 3,
      migrate: () => ({ semesters: [] }),
    },
  ),
)
