import { useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, PencilLine } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  FileDropZone,
  FormField,
  Input,
  Select,
} from '@/shared/components/ui'
import { isApiError } from '@/shared/types'
import { TEMPLATE_FILE_NOT_FOUND_CODE, useUpdateTemplateFile } from '../hooks/useTemplateFiles'
import type { TemplateFile } from '../types'
import { FILE_TYPE_OPTIONS } from '../utils/templateCategory'
import {
  getTemplateErrorField,
  TEMPLATE_FILE_ACCEPT,
  TEMPLATE_FILE_HINT,
  updateTemplateFileSchema,
  type UpdateTemplateFileFormInput,
  type UpdateTemplateFileFormValues,
} from '../utils/templateDocumentSchema'

// Ô nhập trong popup sửa theo bản thiết kế: cao 40px, bo 12px, chữ 13px, focus viền xanh + quầng blue-100
const FIELD_CLASS =
  'h-10 rounded-xl border-slate-300 text-[13px] font-medium shadow-none focus-visible:border-[#1565C0] focus-visible:ring-2 focus-visible:ring-blue-100'

interface EditTemplateDialogProps {
  /** Tài liệu đang sửa; `undefined` = popup đóng */
  document: TemplateFile | undefined
  onClose: () => void
}

/** Popup "Sửa tài liệu": đổi tên, loại, hoặc thay file mới → `PUT /template/{publicId}` */
export function EditTemplateDialog({ document, onClose }: EditTemplateDialogProps) {
  const updateMutation = useUpdateTemplateFile()
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<UpdateTemplateFileFormInput, unknown, UpdateTemplateFileFormValues>({
    resolver: zodResolver(updateTemplateFileSchema),
    defaultValues: { fileName: '', fileType: 'TEMPLATE', file: undefined },
  })

  // Nạp dữ liệu cũ mỗi khi mở popup cho một tài liệu
  useEffect(() => {
    if (document) {
      reset({ fileName: document.fileName, fileType: document.fileType, file: undefined })
    }
  }, [document, reset])

  // Lượt lưu đang chạy — để hủy khi người dùng bỏ file / đóng popup giữa chừng
  const saveRef = useRef<AbortController | null>(null)
  const cancelSave = () => {
    saveRef.current?.abort()
    saveRef.current = null
  }

  const close = () => {
    cancelSave()
    onClose()
  }

  // Bấm X trên file mới: hủy lượt lưu đang chạy (nếu có) và quay về giữ file hiện tại
  const clearFile = () => {
    cancelSave()
    setValue('file', undefined)
    clearErrors('file')
    clearErrors('root')
  }

  const onSubmit = (values: UpdateTemplateFileFormValues) => {
    if (!document) return
    const controller = new AbortController()
    saveRef.current = controller
    updateMutation.mutate(
      // Luôn gửi lại tên để tên không bị đổi theo file mới
      { publicId: document.publicId, body: values, signal: controller.signal },
      {
        onSuccess: onClose,
        onSettled: () => {
          if (saveRef.current === controller) saveRef.current = null
        },
        onError: (error) => {
          // Người dùng tự hủy (bấm X / Hủy) → không báo lỗi
          if (!isApiError(error)) return
          if (error.code === TEMPLATE_FILE_NOT_FOUND_CODE) {
            setError('root.server', {
              message: 'Không tìm thấy tài liệu — có thể tài liệu đã bị xóa. Danh sách đã được tải lại.',
            })
            return
          }
          const field = getTemplateErrorField(error)
          if (field) setError(field, { message: error.message }, { shouldFocus: true })
          else setError('root.server', { message: error.message })
        },
      },
    )
  }

  const isPending = updateMutation.isPending

  return (
    <Dialog open={document !== undefined} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-[600px] gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl">
        <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50/70 px-6 pt-5 pb-4 pr-12">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#1565C0]">
            <PencilLine className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-bold tracking-tight text-slate-800">Sửa tài liệu</h3>
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              Cập nhật tên tài liệu, loại tài liệu hoặc thay bằng file mới
            </p>
          </div>
        </div>

        <form noValidate onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="space-y-4 p-6">
            <FormField label="Tên tài liệu" required error={errors.fileName?.message}>
              <Input
                placeholder="VD: Mẫu đề cương đồ án tốt nghiệp"
                className={FIELD_CLASS}
                {...register('fileName')}
              />
            </FormField>

            <FormField label="Loại tài liệu" required error={errors.fileType?.message}>
              <Select className={FIELD_CLASS} {...register('fileType')}>
                {FILE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <Controller
              control={control}
              name="file"
              render={({ field }) => (
                <FormField
                  label="Thay file mới (tùy chọn)"
                  error={errors.file?.message}
                  hint={
                    document
                      ? `Bỏ trống để giữ file hiện tại${document.fileSizeText ? ` (${document.fileSizeText})` : ''}. File cũ vẫn còn trên kho lưu trữ.`
                      : undefined
                  }
                >
                  <FileDropZone
                    file={field.value}
                    onSelect={(file) => field.onChange(file)}
                    onClear={clearFile}
                    accept={TEMPLATE_FILE_ACCEPT}
                    hint={TEMPLATE_FILE_HINT}
                  />
                </FormField>
              )}
            />

            {errors.root?.server && (
              <p role="alert" className="text-sm font-semibold text-[#DC2626]">
                {errors.root.server.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-200 bg-slate-50/60 px-6 py-3.5">
            <Button
              type="button"
              variant="outline"
              onClick={close}
              className="h-9 rounded-xl border-slate-300 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-none hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-9 rounded-xl bg-[#1565C0] px-5 text-[13px] font-bold text-white shadow-xs hover:bg-[#0D47A1]"
            >
              <Check />
              {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
