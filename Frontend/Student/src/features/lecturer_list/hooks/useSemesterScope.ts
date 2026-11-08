import { useState, useMemo } from 'react'
import {
  useSemesters,
  useCurrentSemester,
} from '@/features/registration_management/hooks'
import type { Semester } from '@/features/registration_management/types/semester.types'

export interface UseSemesterScopeOptions {
  /** Nếu true, khi khởi tạo sẽ chọn học kỳ hiện tại (default true) */
  defaultToCurrent?: boolean
  /** Cho phép chọn 'all' năm học / học kỳ (default true) */
  allowAll?: boolean
}

export function useSemesterScope(options: UseSemesterScopeOptions = {}) {
  const { defaultToCurrent = true, allowAll = true } = options
  const { data: semesterList, isPending: semestersLoading } = useSemesters()
  const { data: currentSemester, isPending: currentLoading } = useCurrentSemester()

  // Gộp học kỳ hiện tại nếu chưa có trong list
  const semesters: Semester[] = useMemo(() => {
    const list = semesterList ?? []
    const cur = currentSemester
    return cur && !list.some((s) => s.publicId === cur.publicId)
      ? [cur, ...list]
      : list
  }, [semesterList, currentSemester])

  const [userYear, setUserYear] = useState<string | null>(null)
  const [userSemesterId, setUserSemesterId] = useState<string | null>(null)

  const selectedYear =
    userYear ??
    (defaultToCurrent && currentSemester?.academicYear
      ? currentSemester.academicYear
      : allowAll
        ? 'all'
        : '')

  const selectedSemesterId =
    userSemesterId ??
    (defaultToCurrent && currentSemester?.publicId
      ? currentSemester.publicId
      : allowAll
        ? 'all'
        : '')

  const academicYears = useMemo(() => {
    return Array.from(new Set(semesters.map((s) => s.academicYear).filter(Boolean)))
  }, [semesters])

  const termsOfYear = useMemo(() => {
    if (selectedYear === 'all') {
      return semesters
    }
    return semesters.filter((s) => s.academicYear === selectedYear)
  }, [semesters, selectedYear])

  const handleYearChange = (year: string) => {
    setUserYear(year)
    if (year === 'all') {
      setUserSemesterId('all')
    } else {
      const matchTerms = semesters.filter((s) => s.academicYear === year)
      const keepCurrent = matchTerms.find((s) => s.publicId === selectedSemesterId)
      if (keepCurrent) {
        // Giữ nguyên học kỳ nếu thuộc năm mới
      } else if (matchTerms.length > 0) {
        setUserSemesterId(matchTerms[0].publicId)
      } else {
        setUserSemesterId('all')
      }
    }
  }

  const handleSemesterChange = (semesterId: string) => {
    setUserSemesterId(semesterId)
    if (semesterId !== 'all') {
      const match = semesters.find((s) => s.publicId === semesterId)
      if (match?.academicYear) {
        setUserYear(match.academicYear)
      }
    }
  }

  const activeSemesterId: string | undefined =
    selectedSemesterId !== 'all' && selectedSemesterId !== ''
      ? selectedSemesterId
      : currentSemester?.publicId

  const activeSemester: Semester | undefined =
    semesters.find((s) => s.publicId === activeSemesterId) ?? currentSemester ?? undefined

  const effectiveSemesterId = useMemo(() => {
    if (selectedSemesterId && selectedSemesterId !== 'all') {
      return selectedSemesterId
    }
    if (activeSemesterId && activeSemesterId !== 'all') {
      return activeSemesterId
    }
    const matchedInYear = termsOfYear.find(
      (t) =>
        t.publicId &&
        t.publicId !== 'all' &&
        (selectedYear === 'all' || t.academicYear === selectedYear),
    )
    if (matchedInYear?.publicId) {
      return matchedInYear.publicId
    }
    return activeSemester?.publicId || currentSemester?.publicId || ''
  }, [selectedSemesterId, activeSemesterId, termsOfYear, selectedYear, activeSemester, currentSemester])

  return {
    semesters,
    academicYears,
    termsOfYear,
    selectedYear,
    selectedSemesterId,
    activeSemesterId,
    activeSemester,
    effectiveSemesterId,
    isLoading: semestersLoading || currentLoading,
    onYearChange: handleYearChange,
    onSemesterChange: handleSemesterChange,
  }
}

