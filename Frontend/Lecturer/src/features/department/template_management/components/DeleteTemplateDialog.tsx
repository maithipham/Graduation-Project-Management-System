import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button, Dialog, DialogContent } from '@/shared/components/ui'
import { useDeleteTemplateFile } from '../hooks/useTemplateFiles'
import type { TemplateFile } from '../types'
import { TemplateFileIcon } from './TemplateFileIcon'

interface DeleteTemplateDialogProps {
  /** Tài liệu cần xóa; `undefined` = popup đóng */
  document: TemplateFile | undefined
  onClose: () => void
  /** Xóa xong (để trang lùi về trang trước nếu vừa xóa dòng cuối) */
  onDeleted: () => void
}

/** Popup xác nhận xóa tài liệu → `DELETE /template/{publicId}` */
export function DeleteTemplateDialog({ document, onClose, onDeleted }: DeleteTemplateDialogProps) {
  const deleteMutation = useDeleteTemplateFile()
  const isPending = deleteMutation.isPending

  const handleConfirm = () => {
    if (!document) return
    deleteMutation.mutate(document.publicId, {
      onSuccess: () => {
        onDeleted()
        onClose()
      },
      // Lỗi đã được toast (vd. 404: tài liệu đã bị xóa trước đó, danh sách tự tải lại)
      onError: onClose,
    })
  }

  return (
    <Dialog open={document !== undefined} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="max-w-[480px] gap-0 overflow-hidden rounded-2xl p-0">
        <div className="flex items-start gap-3.5 border-b border-slate-200 px-6 pt-5 pb-4 pr-12">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-bold tracking-tight text-slate-800">Xóa tài liệu</h3>
            <p className="mt-0.5 text-[12.5px] text-slate-500">Xác nhận xóa tài liệu khỏi danh sách</p>
          </div>
        </div>

        <div className="space-y-3.5 px-6 py-4">
          {document && (
            <div className="flex items-center gap-3.5 rounded-xl border border-slate-200/90 bg-slate-50/80 p-3.5">
              <TemplateFileIcon fileName={document.fileUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-slate-800">{document.fileName}</p>
                <p className="mt-0.5 truncate text-[12px] text-slate-500">
                  {document.fileTypeName}
                  {document.fileSizeText && ` · ${document.fileSizeText}`}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl border border-rose-200/80 bg-rose-50/70 p-3.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <p className="text-[12.5px] leading-relaxed text-rose-900">
              Tài liệu sẽ bị gỡ khỏi danh sách và không khôi phục được. File trên kho lưu trữ vẫn còn, ai đã lưu
              link vẫn có thể mở.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 border-t border-slate-200 bg-slate-50/70 px-6 py-3.5">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onClose}
            className="h-9 rounded-lg border-slate-300 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            Hủy
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={handleConfirm}
            className="h-9 rounded-lg bg-rose-600 px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-rose-700"
          >
            <Trash2 />
            {isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
