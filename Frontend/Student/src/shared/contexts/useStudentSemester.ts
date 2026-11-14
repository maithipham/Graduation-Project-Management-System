import { useContext } from 'react'
import {
  ACADEMIC_SEMESTERS,
  ACADEMIC_YEARS,
  DEFAULT_SEMESTERS,
  DEFAULT_TERM,
} from './semester.constants'
import { SemesterContext, type SemesterContextType } from './semesterContextInstance'

const FALLBACK_SEMESTER_CONTEXT: SemesterContextType = {
  term: DEFAULT_TERM,
  year: DEFAULT_TERM.year,
  semester: DEFAULT_TERM.semester,
  years: ACADEMIC_YEARS,
  semesters: ACADEMIC_SEMESTERS,
  setYear: () => {},
  setSemester: () => {},
  setTerm: () => {},
  selectedSemester: `${DEFAULT_TERM.year}|${DEFAULT_TERM.semester}`,
  setSelectedSemester: () => {},
  semesterOptions: DEFAULT_SEMESTERS,
}

export const useStudentSemester = (): SemesterContextType => {
  const context = useContext(SemesterContext)
  return context ?? FALLBACK_SEMESTER_CONTEXT
}

