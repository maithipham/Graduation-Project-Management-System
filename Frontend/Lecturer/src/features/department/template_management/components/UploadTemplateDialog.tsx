import { useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload } from 'lucide-react'
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
import { useCreateTemplateFile } from '../hooks/useTemplateFiles'
import type { FileType } from '../types'
import { FILE_TYPE_OPTIONS, stripFileExtension } from '../utils/templateCategory'
import {
  createTemplateFileSchema,
  getTemplateErrorField,
  TEMPLATE_FILE_ACCEPT,
  TEMPLATE_FILE_HINT,
  type CreateTemplateFileFormInput,
  type CreateTemplateFileFormValues,
} from '../utils/templateDocumentSchema'

// Ô nhập trong popup theo bản thiết kế: cao 40px, chữ 13.5px, focus viền xanh + quầng sky
const FIELD_CLASS =
  'h-10 rounded-lg border-slate-300 text-[13.5px] shadow-none focus-visible:border-[#0288D1] focus-visible:ring-[3px] focus-visible:ring-sky-100'

// Chưa chọn file / loại → schema báo lỗi khi bấm "Tải lên"
const EMPTY_VALUES: CreateTemplateFileFormInput = {
  file: undefined as unknown as File,
  fileType: '' as unknown as FileType,
  fileName: '',
}

interface UploadTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Popup "Tải lên tài liệu": chọn file + tên + loại → `POST /template` */
export function UploadTemplateDialog({ open, onOpenChange }: UploadTemplateDialogProps) {
  const createMutation = useCreateTemplateFile()
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CreateTemplateFileFormInput, unknown, CreateTemplateFileFormValues>({
    resolver: zodResolver(createTemplateFileSchema),
    defaultValues: EMPTY_VALUES,
  })

  // Lượt tải lên đang chạy — để hủy khi người dùng bỏ file / đóng popup giữa chừng
  const uploadRef = useRef<AbortController | null>(null)
  const cancelUpload = () => {
    uploadRef.current?.abort()
    uploadRef.current = null
  }

  // Mỗi lần mở popup là một form trống
  useEffect(() => {
    if (open) reset(EMPTY_VALUES)
  }, [open, reset])

  const onSubmit = (values: CreateTemplateFileFormValues) => {
    const controller = new AbortController()
    uploadRef.current = controller
    createMutation.mutate(
      { body: values, signal: controller.signal },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => {
          // Người dùng tự hủy (bấm X / Hủy) → không phải lỗi, không báo gì
          if (!isApiError(error)) return
          const field = getTemplateErrorField(error)
          if (field) setError(field, { message: error.message }, { shouldFocus: true })
          else setError('root.server', { message: error.message })
        },
        onSettled: () => {
          if (uploadRef.current === controller) uploadRef.current = null
        },
      },
    )
  }

  // Bấm X trên file: hủy lượt tải đang chạy (nếu có), bỏ file và tên đã tự điền theo file đó
  const clearFile = (removed: File | undefined) => {
    cancelUpload()
    setValue('file', undefined as unknown as File)
    if (removed && getValues('fileName')?.trim() === stripFileExtension(removed.name)) {
      setValue('fileName', '')
    }
    clearErrors('file')
    clearErrors('root')
  }

  const close = () => {
    cancelUpload()
    onOpenChange(false)
  }

  const isPending = createMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-[600px] gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl">
        <div className="flex items-start gap-3 border-b border-slate-200 px-6 pt-5 pb-4 pr-12">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F2FD] text-[#1565C0]">
            <Upload className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-bold tracking-tight text-slate-800">Tải lên tài liệu</h3>
            <p className="mt-1 text-[12.5px] text-slate-500">Chọn file và điền thông tin mô tả</p>
          </div>
        </div>

        <form noValidate onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="space-y-4 p-6">
            <Controller
              control={control}
              name="file"
              render={({ field }) => (
                <FormField label="File tài liệu" required error={errors.file?.message}>
                  <FileDropZone
                    file={field.value}
                    onSelect={(file) => {
                      field.onChange(file)
                      // Ô tên đang trống → điền sẵn tên file để người dùng sửa
                      if (!getValues('fileName')?.trim()) {
                        setValue('fileName', stripFileExtension(file.name))
                      }
                    }}
                    onClear={() => clearFile(field.value)}
                    accept={TEMPLATE_FILE_ACCEPT}
                    hint={TEMPLATE_FILE_HINT}
                  />
                </FormField>
              )}
            />

            <FormField
              label="Tên tài liệu"
              error={errors.fileName?.message}
              hint="Bỏ trống thì hệ thống lấy tên file gốc"
            >
              <Input
                placeholder="VD: Mẫu đề cương đồ án tốt nghiệp"
                className={FIELD_CLASS}
                {...register('fileName')}
              />
            </FormField>

            <FormField label="Loại tài liệu" required error={errors.fileType?.message}>
              <Select className={FIELD_CLASS} {...register('fileType')}>
                <option value="">Chọn loại tài liệu</option>
                {FILE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>

            {errors.root?.server && (
              <p role="alert" className="text-sm font-semibold text-[#DC2626]">
                {errors.root.server.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/60 px-6 py-3.5">
            <Button
              type="button"
              variant="outline"
              onClick={close}
              className="h-9 rounded-lg border-slate-300 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-none hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-9 rounded-lg bg-[#1565C0] px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-[#0D47A1]"
            >
              <Upload />
              {isPending ? 'Đang tải lên...' : 'Tải lên'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
