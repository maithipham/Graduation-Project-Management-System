import type { FallbackProps } from 'react-error-boundary'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'

export function ErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  return (
    <div className="flex min-h-[300px] items-center justify-center p-6" role="alert">
      <Card className="w-full max-w-md border-red-200 bg-red-50/30 text-center shadow-sm">
        <CardContent className="pt-6 pb-6 space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">
              Có lỗi xảy ra khi tải nội dung
            </h3>
            <p className="text-sm text-slate-600 font-mono bg-red-100/50 p-2 rounded-md break-all">
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
          <Button
            variant="default"
            onClick={resetErrorBoundary}
            className="bg-red-600 hover:bg-red-700 text-white gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Thử tải lại
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
