import { createContext } from 'react'
import type {
  SemesterCode,
  SemesterOption,
  SemesterSelectItem,
  StudentTerm,
} from './semester.constants'

export interface SemesterContextType {
  term: StudentTerm
  year: string
  semester: SemesterCode
  years: readonly string[]
  semesters: readonly SemesterSelectItem[]
  setYear: (year: string) => void
  setSemester: (semester: SemesterCode) => void
  setTerm: (term: StudentTerm) => void
  selectedSemester: string
  setSelectedSemester: (sem: string) => void
  semesterOptions: SemesterOption[]
}

export const SemesterContext = createContext<SemesterContextType | undefined>(undefined)

