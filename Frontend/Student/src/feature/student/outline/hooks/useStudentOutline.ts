import { useState, useEffect } from 'react'
import { studentOutlineService } from '../services'
import type { StudentOutline } from '../types'

export function useStudentOutline() {
  const [outline, setOutline] = useState<StudentOutline | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    studentOutlineService.getOutline().then((res) => {
      if (mounted) {
        setOutline(res)
        setIsLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const submit = async (formData: FormData, signal?: AbortSignal) => {
    const res = await studentOutlineService.submitOutline(formData, signal)
    setOutline(res)
    return res
  }

  return { outline, isLoading, submit }
}
