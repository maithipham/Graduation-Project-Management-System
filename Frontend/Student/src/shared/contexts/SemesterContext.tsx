import React, { useState } from 'react'
import {
  ACADEMIC_SEMESTERS,
  ACADEMIC_YEARS,
  DEFAULT_SEMESTERS,
  loadSavedTerm,
  saveTermToStorage,
  type SemesterCode,
  type StudentTerm,
} from './semester.constants'
import { SemesterContext } from './semesterContextInstance'

export const SemesterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [term, setTermState] = useState<StudentTerm>(() => loadSavedTerm())

  const setTerm = (nextTerm: StudentTerm) => {
    setTermState(nextTerm)
    saveTermToStorage(nextTerm)
  }

  const setYear = (nextYear: string) => {
    setTerm({ year: nextYear, semester: term.semester })
  }

  const setSemester = (nextSemester: SemesterCode) => {
    setTerm({ year: term.year, semester: nextSemester })
  }

  const setSelectedSemester = (combined: string) => {
    const [rawYear, rawSem] = combined.split('|')
    if (rawYear && (rawSem === 'HK1' || rawSem === 'HK2')) {
      setTerm({ year: rawYear, semester: rawSem })
    }
  }

  return (
    <SemesterContext.Provider
      value={{
        term,
        year: term.year,
        semester: term.semester,
        years: ACADEMIC_YEARS,
        semesters: ACADEMIC_SEMESTERS,
        setYear,
        setSemester,
        setTerm,
        selectedSemester: `${term.year}|${term.semester}`,
        setSelectedSemester,
        semesterOptions: DEFAULT_SEMESTERS,
      }}
    >
      {children}
    </SemesterContext.Provider>
  )
}
