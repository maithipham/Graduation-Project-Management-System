import { useId } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Download, Info, RotateCcw } from 'lucide-react'
import { toast } from '@/shared/components/feedback/toast.store'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FileDropZone,
  FormField,
} from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import { useImportStudents } from '../hooks/useStudents'
import { StudentImportResult } from './StudentImportResult'

const MAX_IMPORT_SIZE = 50 * 1024 * 1024 // 50MB, trùng giới hạn của BE

// Thứ tự cột trong file mẫu student_import_template.xlsx
const IMPORT_COLUMNS = [
  'Mã sinh viên',
  'Họ',
  'Tên',
  'Email',
  'Số điện thoại',
  'Khóa',
  'Lớp',
  'Ngành',
]

// Message trùng với lỗi mức toàn file của POST /student/import
const importSchema = z.object({
  file: z
    .file({ error: 'File import không được để trống' })
    .refine((file) => file.name.toLowerCase().endsWith('.xlsx'), 'File import phải có định dạng .xlsx')
    .refine((file) => file.size <= MAX_IMPORT_SIZE, 'File import vượt quá dung lượng cho phép (50MB)'),
})

type ImportFormValues = z.infer<typeof importSchema>

interface ImportStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportStudentDialog({ open, onOpenChange }: ImportStudentDialogProps) {
  const formId = useId()
  const importStudents = useImportStudents()
  // Có kết quả (data) → chuyển sang màn kết quả; reset() mutation → quay lại bước chọn file
  const result = importStudents.data

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<ImportFormValues>({
    resolver: zodResolver(importSchema),
    defaultValues: { file: undefined },
  })
  const file = useWatch({ control, name: 'file' })

  const backToUpload = () => {
    importStudents.reset()
    reset()
  }

  const handleOpenChange = (value: boolean) => {
    // Đang gửi file thì không cho đóng, tránh người dùng tưởng đã hủy trong khi BE vẫn lưu
    if (!value && importStudents.isPending) return
    if (!value) backToUpload()
    onOpenChange(value)
  }

  const onSubmit = (values: ImportFormValues) => {
    importStudents.mutate(values.file, {
      onSuccess: (data) => {
        if (data.errorCount === 0 && data.warningCount === 0) {
          toast.success(`Đã import thành công ${data.successCount} sinh viên`)
        }
      },
      // Lỗi mức toàn file (sai mẫu, file trống, sai định dạng...) hiện ngay dưới ô chọn file
      onError: (error) => setError('file', { message: error.message }),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn('max-h-[90vh] overflow-y-auto', result ? 'max-w-6xl' : 'max-w-3xl')}
      >
        <DialogHeader>
          <DialogTitle>{result ? 'Kết quả import sinh viên' : 'Import danh sách sinh viên'}</DialogTitle>
          <DialogDescription>
            {result
              ? `File: ${file?.name ?? ''}`
              : 'Tải lên file Excel theo đúng mẫu để thêm nhiều sinh viên cùng lúc.'}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          // Form sửa từng dòng nằm trong bảng kết quả → bảng phải ở ngoài form chọn file (không lồng form)
          <StudentImportResult result={result} />
        ) : (
          <form id={formId} noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <fieldset disabled={importStudents.isPending} className="space-y-4">
              <FormField label="File import" required error={errors.file?.message}>
                <FileDropZone
                  file={file}
                  accept=".xlsx"
                  hint="Chỉ nhận file .xlsx, tối đa 50MB"
                  onSelect={(selected) => {
                    if (importStudents.isPending) return
                    setValue('file', selected, { shouldValidate: true })
                  }}
                  // Ô file gán bằng setValue (không register) nên resetField không có tác dụng → reset cả form (chỉ có 1 ô), xóa luôn lỗi
                  onClear={() => reset()}
                />
              </FormField>

              <div className="flex gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-sm text-slate-700">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <div className="space-y-2">
                  <p>
                    File gồm <span className="font-semibold">8 cột</span> theo đúng thứ tự, dòng 1 là
                    tiêu đề, không gộp ô:
                  </p>
                  <ol className="flex flex-wrap gap-1.5">
                    {IMPORT_COLUMNS.map((column, index) => (
                      <li
                        key={column}
                        className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium"
                      >
                        {index + 1}. {column}
                      </li>
                    ))}
                  </ol>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0"
                    onClick={() => toast.info('Sẽ hỗ trợ sau')}
                  >
                    <Download /> Tải file mẫu
                  </Button>
                </div>
              </div>
            </fieldset>
          </form>
        )}

        <DialogFooter>
          {result ? (
            <>
              <Button type="button" variant="outline" onClick={backToUpload}>
                <RotateCcw /> Import file khác
              </Button>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Đóng
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={importStudents.isPending}
                onClick={() => handleOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" form={formId} disabled={!file || importStudents.isPending}>
                {importStudents.isPending ? 'Đang import...' : 'Import'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
