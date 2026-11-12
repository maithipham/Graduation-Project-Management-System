import React, { useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText, FileUp, UploadCloud, X } from 'lucide-react'
import { isApiError } from '@/shared/types'
import { Button, FormField, Input } from '@/shared/components/ui'
import { cn, formatBytes } from '@/shared/utils'
import { validateReportFile } from '../services/reports.service'

const submitReportSchema = z.object({
  file: z
    .custom<File | null>((val) => val === null || val instanceof File)
    .superRefine((file, ctx) => {
      const error = validateReportFile(file)
      if (error) {
        ctx.addIssue({
          code: 'custom',
          message: error,
        })
      }
    }),
})

type SubmitReportFormValues = z.infer<typeof submitReportSchema>

interface SubmitReportModalProps {
  open: boolean
  isSubmitting?: boolean
  isResubmit?: boolean
  onClose: () => void
  onSubmitReport: (file: File) => Promise<void>
}

const SubmitReportModalContent: React.FC<Omit<SubmitReportModalProps, 'open'>> = ({
  isSubmitting = false,
  isResubmit = false,
  onClose,
  onSubmitReport,
}) => {
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SubmitReportFormValues>({
    resolver: zodResolver(submitReportSchema),
    defaultValues: { file: null },
  })

  const selectedFile = useWatch({ control, name: 'file' })

  const handleSelectFile = (file: File | null) => {
    clearErrors('root.server')
    setValue('file', file, { shouldValidate: true })
  }

  const onSubmit = async (values: SubmitReportFormValues) => {
    if (!values.file) return
    clearErrors('root.server')
    try {
      await onSubmitReport(values.file)
    } catch (error) {
      setError('root.server', {
        message: isApiError(error)
          ? error.message
          : 'Không thể nộp báo cáo Final. Vui lòng thử lại.',
      })
    }
  }

  return (
    <div
      id="submitReportModal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-[#1565C0]" />
            <h3 className="text-base font-bold text-slate-900">
              {isResubmit ? 'Nộp lại báo cáo Final' : 'Nộp báo cáo Final'}
            </h3>
          </div>
          <button
            id="closeReportModalBtn"
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed p-1 rounded-md cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4">
            <div className="text-xs text-slate-500 space-y-1 bg-blue-50/60 p-3.5 rounded-xl border border-blue-100">
              <p className="font-semibold text-slate-800">Quy định nộp báo cáo Final:</p>
              <p>
                • Định dạng được hỗ trợ:{' '}
                <strong className="text-slate-700">.doc, .docx, .pdf</strong>
              </p>
              <p>
                • Dung lượng cho phép:{' '}
                <strong className="text-slate-700">nhỏ hơn 10 MB</strong>
              </p>
              <p>
                • Cú pháp đặt tên gợi ý:{' '}
                <em className="text-slate-600">Bao_cao_DATN_MSSV_HoTen.pdf</em>
              </p>
            </div>

            <FormField label="Tệp báo cáo Final" required error={errors.file?.message}>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".doc,.docx,.pdf"
                disabled={isSubmitting}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  if (file) handleSelectFile(file)
                }}
                className="sr-only"
              />
            </FormField>

            <div
              id="dropArea"
              role="button"
              tabIndex={isSubmitting ? -1 : 0}
              onClick={() => {
                if (!isSubmitting) fileInputRef.current?.click()
              }}
              onKeyDown={(e) => {
                if (!isSubmitting && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                if (!isSubmitting) setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                if (isSubmitting) return
                const file = e.dataTransfer?.files?.[0] ?? null
                if (file) handleSelectFile(file)
              }}
              className={cn(
                'border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer',
                isSubmitting && 'opacity-50 cursor-not-allowed',
                errors.file
                  ? 'border-[#DC2626] bg-rose-50/40'
                  : dragging
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30',
              )}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1565C0] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-slate-800">
                Kéo thả tệp báo cáo vào đây, hoặc{' '}
                <span className="text-blue-600 hover:underline">duyệt từ thiết bị</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Hỗ trợ .doc, .docx, .pdf (nhỏ hơn 10 MB)
              </p>
            </div>

            {selectedFile && (
              <div
                id="selectedReportFileBox"
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div
                      id="selectedReportFileName"
                      className="text-xs font-bold text-slate-800 truncate"
                    >
                      {selectedFile.name}
                    </div>
                    <div
                      id="selectedReportFileSize"
                      className="text-[10.5px] text-slate-400 mt-0.5"
                    >
                      {formatBytes(selectedFile.size, 1)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  id="removeReportFileBtn"
                  disabled={isSubmitting}
                  onClick={() => {
                    handleSelectFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 disabled:opacity-40 font-semibold cursor-pointer shrink-0 ml-2"
                >
                  Gỡ bỏ
                </button>
              </div>
            )}

            {errors.root?.server && (
              <p role="alert" className="text-sm font-semibold text-[#DC2626]">
                {errors.root.server.message}
              </p>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1565C0] hover:bg-[#0D47A1] text-white"
            >
              {isSubmitting ? 'Đang nộp...' : 'Xác nhận nộp'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export const SubmitReportModal: React.FC<SubmitReportModalProps> = ({ open, ...props }) => {
  if (!open) return null
  return <SubmitReportModalContent {...props} />
}
