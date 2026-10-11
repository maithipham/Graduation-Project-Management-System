import { useState, useEffect } from 'react'
import { studentLecturerListService } from '../services'
import type { LecturerInfo } from '../types'

export function useLecturerList() {
  const [lecturers, setLecturers] = useState<LecturerInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    studentLecturerListService.getLecturers().then((data) => {
      if (mounted) {
        setLecturers(data)
        setIsLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  return { lecturers, isLoading }
}
