import { useState } from 'react'
import { Download, Info, RotateCcw } from 'lucide-react'
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
import { toast } from '@/shared/components/feedback'
import { useImportAdvisorsExcel, useTeachers } from '../hooks/useTeachers'
import type { AdvisorImportResponse, SupervisorLecturer } from '../types'
import { AdvisorImportResult } from './AdvisorImportResult'
import { parseAdvisorExcelFile, type ParsedAdvisorExcelRow } from '../utils/parseExcelRows'

const MAX_IMPORT_SIZE = 50 * 1024 * 1024 // 50MB, trùng giới hạn của BE

const ADVISOR_IMPORT_COLUMNS = [
  'STT',
  'Mã GV',
  'Họ và tên',
  'Email',
  'Số lượng SV tối đa',
]

interface ImportAdvisorsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  semesterId?: string
  semesterName?: string
  lecturers?: SupervisorLecturer[]
  onSuccess?: () => void
}

export function ImportAdvisorsDialog({
  open,
  onOpenChange,
  semesterId,
  semesterName,
  lecturers = [],
  onSuccess,
}: ImportAdvisorsDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [result, setResult] = useState<AdvisorImportResponse | null>(null)
  const [parsedFileRows, setParsedFileRows] = useState<ParsedAdvisorExcelRow[]>([])

  const importMutation = useImportAdvisorsExcel()
  const { data: teachersData } = useTeachers({ page: 0, size: 1000 })

  const handleReset = () => {
    setFile(null)
    setFileError(null)
    setResult(null)
    setParsedFileRows([])
    importMutation.reset()
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && importMutation.isPending) return
    if (!nextOpen) handleReset()
    onOpenChange(nextOpen)
  }

  const handleSelectFile = async (selected: File) => {
    setFileError(null)
    if (!selected.name.toLowerCase().endsWith('.xlsx')) {
      setFileError('File import phải có định dạng .xlsx')
      return
    }
    if (selected.size > MAX_IMPORT_SIZE) {
      setFileError('File import vượt quá dung lượng cho phép (50MB)')
      return
    }
    setFile(selected)
    try {
      const rows = await parseAdvisorExcelFile(selected)
      setParsedFileRows(rows)
    } catch (err) {
      console.warn('Lỗi phân tích file Excel tại client:', err)
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      setFileError('Vui lòng chọn file Excel để import')
      return
    }
    if (!semesterId || semesterId === 'all') {
      toast.warning('Vui lòng chọn một học kỳ cụ thể trước khi import GVHD')
      return
    }

    try {
      // Đảm bảo dữ liệu các dòng file Excel đã phân tích xong
      let currentRows = parsedFileRows
      if (!currentRows || currentRows.length === 0) {
        currentRows = await parseAdvisorExcelFile(file)
        setParsedFileRows(currentRows)
      }

      const data = await importMutation.mutateAsync({
        semesterId,
        file,
      })
      setResult(data)
      if (data.failedCount === 0 && (!data.errorCount || data.errorCount === 0)) {
        toast.success(
          `Import thành công ${data.successCount} giảng viên${
            data.skippedCount > 0 ? ` (bỏ qua ${data.skippedCount} đã phân công)` : ''
          }`,
        )
      } else {
        toast.warning(
          `Đã import ${data.successCount} GV, bỏ qua ${data.skippedCount} GV, ${
            data.failedCount || data.errorCount || 0
          } dòng lỗi`,
        )
      }
      onSuccess?.()
    } catch {
      // Error handled by hook or global interceptor
    }
  }

  const handleDownloadSample = () => {
    const header = 'STT,Mã GV,Họ và tên,Email,Số lượng SV tối đa\n'
    const sampleRows = [
      '1,GV001,PGS.TS. Trần Quốc Bảo,bao.tq@tlu.edu.vn,8',
      '2,GV002,TS. Vũ Thị Lan,lan.vt@tlu.edu.vn,7',
      '3,GV003,ThS. Nguyễn Văn Bình,binh.nv@gmail.com,5',
    ].join('\n')
    const blob = new Blob(['\uFEFF' + header + sampleRows], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'mau_danh_sach_gvhd.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[90vh] overflow-y-auto',
          result ? 'max-w-6xl' : 'max-w-3xl',
        )}
      >
        <DialogHeader>
          <DialogTitle>
            {result
              ? 'Kết quả import Giáo viên Hướng dẫn'
              : 'Import danh sách Giáo viên Hướng dẫn'}
          </DialogTitle>
          <DialogDescription>
            {result
              ? `File: ${file?.name ?? ''}${semesterName ? ` · Học kỳ: ${semesterName}` : ''}`
              : semesterName
                ? `Áp dụng cho học kỳ: ${semesterName}`
                : 'Tải lên file Excel theo đúng mẫu để phân công nhiều giáo viên hướng dẫn cùng lúc.'}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <AdvisorImportResult
            result={result}
            parsedFileRows={parsedFileRows}
            lecturers={lecturers}
            teachers={teachersData?.content ?? []}
          />
        ) : (
          <div className="space-y-4">
            <fieldset disabled={importMutation.isPending} className="space-y-4">
              <FormField
                label="File import"
                required
                error={fileError ?? undefined}
              >
                <FileDropZone
                  file={file ?? undefined}
                  accept=".xlsx"
                  hint="Chỉ nhận file .xlsx, tối đa 50MB"
                  onSelect={handleSelectFile}
                  onClear={() => {
                    setFile(null)
                    setFileError(null)
                  }}
                />
              </FormField>

              {/* Hướng dẫn quy tắc và thứ tự cột giống bên Quản lý giáo viên */}
              <div className="flex gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-sm text-slate-700">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <div className="space-y-2.5 flex-1">
                  <div>
                    <strong className="text-slate-800 font-semibold block mb-1">
                      Quy tắc đối soát tự động khi import GVHD:
                    </strong>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                      <li>
                        <strong className="text-slate-700">Chưa có trong hệ thống:</strong> Tự động{' '}
                        <span className="text-blue-700 font-semibold">tạo tài khoản và hồ sơ giáo viên</span>, sau đó phân công làm GVHD kỳ này.
                      </li>
                      <li>
                        <strong className="text-slate-700">Đã là GVHD kỳ này:</strong> Hệ thống tự động{' '}
                        <span className="text-amber-700 font-semibold">bỏ qua</span> (chuyển vào tab Cảnh báo), không gây trùng lặp.
                      </li>
                      <li>
                        <strong className="text-slate-700">Chưa là GVHD kỳ này:</strong> Tự động{' '}
                        <span className="text-emerald-700 font-semibold">thêm vào danh sách GVHD kỳ này</span> theo hạn mức trong file (hoặc hạn mức chức danh).
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-blue-200/60">
                    <p className="text-xs text-slate-600 mb-1.5">
                      File gồm{' '}
                      <span className="font-semibold text-slate-800">
                        {ADVISOR_IMPORT_COLUMNS.length} cột
                      </span>{' '}
                      theo đúng thứ tự, dòng 1 là tiêu đề, không gộp ô:
                    </p>
                    <ol className="flex flex-wrap gap-1.5">
                      {ADVISOR_IMPORT_COLUMNS.map((column, index) => (
                        <li
                          key={column}
                          className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700"
                        >
                          {index + 1}. {column}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold text-xs cursor-pointer"
                      onClick={handleDownloadSample}
                    >
                      <Download className="h-3.5 w-3.5" /> Tải file mẫu
                    </Button>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
        )}

        <DialogFooter>
          {result ? (
            <>
              <Button type="button" variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1.5" /> Import file khác
              </Button>
              <Button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="bg-[#1565C0] hover:bg-blue-700 text-white"
              >
                Đóng
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={importMutation.isPending}
                onClick={() => handleOpenChange(false)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                disabled={!file || importMutation.isPending}
                onClick={handleSubmit}
                className="bg-[#1565C0] hover:bg-blue-700 text-white font-medium"
              >
                {importMutation.isPending ? 'Đang import...' : 'Import'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
