import { useState, useRef, useCallback } from 'react'

/**
 * Hook theo dõi tiến trình upload file và hủy yêu cầu bằng AbortController (Kỹ thuật #7)
 */
export function useFileUpload() {
  const [progress, setProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsUploading(false)
      setProgress(0)
    }
  }, [])

  return {
    progress,
    setProgress,
    isUploading,
    setIsUploading,
    error,
    setError,
    cancelUpload,
    abortControllerRef,
  }
}
