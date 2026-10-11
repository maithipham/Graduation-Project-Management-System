import { useState, useEffect } from 'react'
import { studentDocumentService } from '../services'
import type { GraduationDocument } from '../types'

export function useStudentDocuments() {
  const [documents, setDocuments] = useState<GraduationDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    studentDocumentService.getDocuments().then((res) => {
      if (mounted) {
        setDocuments(res)
        setIsLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const download = async (id: string) => {
    return studentDocumentService.downloadDocumentBlob(id)
  }

  return { documents, isLoading, download }
}
