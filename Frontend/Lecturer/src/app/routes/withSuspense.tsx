import { Suspense, type ReactNode } from 'react'
import { LoadingFallback } from '@/shared/components/feedback/LoadingFallback'

/**
 * Bọc page nạp bằng lazy() trong Suspense để hiện LoadingFallback khi đang tải chunk.
 * Dùng: element: withSuspense(<XxxPage />)
 */
export function withSuspense(page: ReactNode) {
  return <Suspense fallback={<LoadingFallback />}>{page}</Suspense>
}
