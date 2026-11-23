import React, { useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText, FileUp, UploadCloud, X } from 'lucide-react'
import { isApiError } from '@/shared/types'
import { Button, FormField, Textarea } from '@/shared/components/ui'
import { cn, formatBytes } from '@/shared/utils'
import { validateRevisionFile } from '../services/defenseRevision.service'

const NOTE_MAX_LENGTH = 2000

const fileSchema = z.custom<File | null>((val) => val === null || val instanceof File)

const submitRevisionSchema = z.object({
  // Báo cáo đã chỉnh sửa: bắt buộc
  revisedReportFile: fileSchema.superRefine((file, ctx) => {
    const error = validateRevisionFile(file)
    if (error) ctx.addIssue({ code: 'custom', message: error })
  }),
  // Bản giải trình: tùy chọn, có chọn thì phải đúng định dạng
  explanationFile: fileSchema.superRefine((file, ctx) => {
    if (!file) return
    const error = validateRevisionFile(file)
    if (error) ctx.addIssue({ code: 'custom', message: error })
  }),
  studentNote: z
    .string()
    .max(NOTE_MAX_LENGTH, `Ghi chú tối đa ${NOTE_MAX_LENGTH} ký tự.`),
})

type SubmitRevisionFormValues = z.infer<typeof submitRevisionSchema>

export interface SubmitRevisionValues {
  revisedReportFile: File
  explanationFile: File | null
  studentNote: string | null
}

interface SubmitDefenseRevisionModalProps {
  open: boolean
  isSubmitting?: boolean
  isResubmit?: boolean
  onClose: () => void
  onSubmitRevision: (values: SubmitRevisionValues) => Promise<void>
}

interface FilePickerProps {
  id: string
  file: File | null
  disabled: boolean
  hasError: boolean
  hint: string
  onSelect: (file: File | null) => void
}

const FilePicker: React.FC<FilePickerProps> = ({ id, file, disabled, hasError, hint, onSelect }) => {
  const inputRef = useRef<HTMLInputElement | null>(null)

  if (file) {
    return (
      <div
        id={`${id}SelectedBox`}
        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-800 truncate">{file.name}</div>
            <div className="text-[10.5px] text-slate-400 mt-0.5">{formatBytes(file.size, 1)}</div>
          </div>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onSelect(null)
            if (inputRef.current) inputRef.current.value = ''
          }}
          className="text-xs text-rose-600 hover:text-rose-800 disabled:opacity-40 font-semibold cursor-pointer shrink-0 ml-2"
        >
          Gỡ bỏ
        </button>
      </div>
    )
  }

  return (
    <>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept=".doc,.docx,.pdf"
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const picked = e.target.files?.[0] ?? null
          if (picked) onSelect(picked)
        }}
      />
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) inputRef.current?.click()
        }}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (disabled) return
          const dropped = e.dataTransfer?.files?.[0] ?? null
          if (dropped) onSelect(dropped)
        }}
        className={cn(
          'border-2 border-dashed rounded-xl px-4 py-3.5 flex items-center gap-3 transition cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          hasError
            ? 'border-[#DC2626] bg-rose-50/40'
            : 'border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30',
        )}
      >
        <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1565C0] flex items-center justify-center shrink-0">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold text-slate-800">
            Kéo thả tệp vào đây, hoặc{' '}
            <span className="text-blue-600 hover:underline">duyệt từ thiết bị</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>
        </div>
      </div>
    </>
  )
}

const SubmitDefenseRevisionModalContent: React.FC<
  Omit<SubmitDefenseRevisionModalProps, 'open'>
> = ({ isSubmitting = false, isResubmit = false, onClose, onSubmitRevision }) => {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SubmitRevisionFormValues>({
    resolver: zodResolver(submitRevisionSchema),
    defaultValues: { revisedReportFile: null, explanationFile: null, studentNote: '' },
  })

  const revisedReportFile = useWatch({ control, name: 'revisedReportFile' })
  const explanationFile = useWatch({ control, name: 'explanationFile' })

  const selectFile = (name: 'revisedReportFile' | 'explanationFile', file: File | null) => {
    clearErrors('root.server')
    setValue(name, file, { shouldValidate: true })
  }

  const onSubmit = async (values: SubmitRevisionFormValues) => {
    if (!values.revisedReportFile) return
    clearErrors('root.server')
    try {
      await onSubmitRevision({
        revisedReportFile: values.revisedReportFile,
        explanationFile: values.explanationFile,
        studentNote: values.studentNote.trim() || null,
      })
    } catch (error) {
      setError('root.server', {
        message: isApiError(error)
          ? error.message
          : 'Không thể nộp báo cáo sau bảo vệ. Vui lòng thử lại.',
      })
    }
  }

  return (
    <div
      id="submitDefenseRevisionModal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-[#1565C0]" />
            <h3 className="text-base font-bold text-slate-900">
              {isResubmit ? 'Nộp lại báo cáo sau bảo vệ' : 'Nộp báo cáo sau bảo vệ'}
            </h3>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed p-1 rounded-md cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col min-h-0">
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="text-xs text-slate-500 space-y-1 bg-blue-50/60 p-3.5 rounded-xl border border-blue-100">
              <p className="font-semibold text-slate-800">Hồ sơ cần nộp:</p>
              <p>• Báo cáo cuối cùng đã chỉnh sửa theo góp ý của Hội đồng (bắt buộc).</p>
              <p>• Bản giải trình các điểm đã chỉnh sửa (khuyến khích nộp kèm).</p>
              <p>
                • Định dạng <strong className="text-slate-700">.doc, .docx, .pdf</strong>, dung lượng{' '}
                <strong className="text-slate-700">nhỏ hơn 10 MB</strong>.
              </p>
            </div>

            <FormField
              label="Báo cáo đã chỉnh sửa"
              required
              error={errors.revisedReportFile?.message}
            >
              <FilePicker
                id="revisedReportFileInput"
                file={revisedReportFile}
                disabled={isSubmitting}
                hasError={Boolean(errors.revisedReportFile)}
                hint="Hỗ trợ .doc, .docx, .pdf (nhỏ hơn 10 MB)"
                onSelect={(file) => selectFile('revisedReportFile', file)}
              />
            </FormField>

            <FormField label="Bản giải trình chỉnh sửa" error={errors.explanationFile?.message}>
              <FilePicker
                id="explanationFileInput"
                file={explanationFile}
                disabled={isSubmitting}
                hasError={Boolean(errors.explanationFile)}
                hint="Tùy chọn · .doc, .docx, .pdf (nhỏ hơn 10 MB)"
                onSelect={(file) => selectFile('explanationFile', file)}
              />
            </FormField>

            <FormField label="Ghi chú gửi Hội đồng" error={errors.studentNote?.message}>
              <Textarea
                id="revisionStudentNote"
                rows={3}
                disabled={isSubmitting}
                placeholder="Tóm tắt các nội dung đã chỉnh sửa (không bắt buộc)"
                aria-invalid={Boolean(errors.studentNote)}
                className="text-xs"
                {...register('studentNote')}
              />
            </FormField>

            {errors.root?.server && (
              <p role="alert" className="text-sm font-semibold text-[#DC2626]">
                {errors.root.server.message}
              </p>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5 shrink-0">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>
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

export const SubmitDefenseRevisionModal: React.FC<SubmitDefenseRevisionModalProps> = ({
  open,
  ...props
}) => {
  if (!open) return null
  return <SubmitDefenseRevisionModalContent {...props} />
}
