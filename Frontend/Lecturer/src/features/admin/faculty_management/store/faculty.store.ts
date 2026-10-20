import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Faculty,
  FacultyFormValues,
  Major,
  MajorFormValues,
} from '../types/faculty.types'

interface FacultyState {
  faculties: Faculty[]
  addFaculty: (values: FacultyFormValues) => Faculty
  updateFaculty: (id: number, values: FacultyFormValues) => void
  addMajor: (facultyId: number, values: MajorFormValues) => Major
  updateMajor: (facultyId: number, majorId: number, values: MajorFormValues) => void
  resetToInitial: () => void
}

const initialFaculties: Faculty[] = []

export const useFacultyStore = create<FacultyState>()(
  persist(
    (set, get) => ({
      faculties: initialFaculties,

      addFaculty: (values) => {
        const current = get().faculties
        const nextId = current.length
          ? Math.max(...current.map((f) => f.id)) + 1
          : 1
        const newFaculty: Faculty = {
          id: nextId,
          code: values.code.toUpperCase().trim(),
          name: values.name,
          dean: values.dean || 'Chưa phân công',
          description: values.description || '',
          status: values.status,
          majors: [],
        }
        set({ faculties: [...current, newFaculty] })
        return newFaculty
      },

      updateFaculty: (id, values) => {
        set((state) => ({
          faculties: state.faculties.map((f) =>
            f.id === id
              ? {
                  ...f,
                  code: values.code.toUpperCase().trim(),
                  name: values.name,
                  dean: values.dean ?? f.dean,
                  description: values.description ?? f.description,
                  status: values.status,
                }
              : f,
          ),
        }))
      },

      addMajor: (facultyId, values) => {
        let createdMajor: Major | null = null
        set((state) => ({
          faculties: state.faculties.map((f) => {
            if (f.id !== facultyId) return f
            const nextMajorId = f.majors.length
              ? Math.max(...f.majors.map((m) => m.id)) + 1
              : 1
            const newMajor: Major = {
              id: nextMajorId,
              name: values.name,
              description: values.description || '',
              status: values.status,
            }
            createdMajor = newMajor
            return {
              ...f,
              majors: [...f.majors, newMajor],
            }
          }),
        }))
        return createdMajor!
      },

      updateMajor: (facultyId, majorId, values) => {
        set((state) => ({
          faculties: state.faculties.map((f) => {
            if (f.id !== facultyId) return f
            return {
              ...f,
              majors: f.majors.map((m) =>
                m.id === majorId
                  ? {
                      ...m,
                      name: values.name,
                      description: values.description ?? m.description,
                      status: values.status,
                    }
                  : m,
              ),
            }
          }),
        }))
      },

      resetToInitial: () => set({ faculties: initialFaculties }),
    }),
    {
      name: 'gpms_admin_faculties',
      version: 2,
      migrate: () => ({ faculties: [] }),
    },
  ),
)
