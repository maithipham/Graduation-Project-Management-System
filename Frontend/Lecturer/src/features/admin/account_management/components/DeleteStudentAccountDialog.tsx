import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button, Dialog, DialogContent } from '@/shared/components/ui'
import { useDeleteStudentAccount } from '../hooks/useAccounts'
import type { StudentAccountItem } from '../types/account.types'

interface DeleteStudentAccountDialogProps {
  /** Sinh viên cần xóa; null = đóng dialog */
  student: StudentAccountItem | null
  onClose: () => void
}

/** Xác nhận DELETE /student/account/{publicId} — BE tự quyết định xóa hẳn hay chỉ khóa tài khoản */
export function DeleteStudentAccountDialog({ student, onClose }: DeleteStudentAccountDialogProps) {
  const { mutate, isPending } = useDeleteStudentAccount()

  const confirmDelete = () => {
    if (!student) return
    // Toast + tải lại danh sách đã xử lý trong hook; ở đây chỉ đóng dialog
    mutate(student.publicId, { onSettled: onClose })
  }

  return (
    <Dialog open={student !== null} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="max-w-[480px] gap-0 p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="flex items-start gap-3.5 border-b border-slate-200 px-6 pt-5 pb-4 bg-white">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">
              Xóa tài khoản sinh viên
            </h3>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              Xác nhận xóa tài khoản khỏi hệ thống
            </p>
          </div>
        </div>

        {/* Nội dung */}
        <div className="px-6 py-4 space-y-3.5 bg-white">
          {student && (
            <p className="text-[13.5px] text-slate-700">
              Xóa tài khoản sinh viên <span className="font-bold text-slate-900">{student.name}</span> (
              <span className="font-mono">{student.studentCode}</span>)?
            </p>
          )}
          <div className="rounded-xl border border-rose-200/80 bg-rose-50/70 p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <p className="text-[12.5px] text-rose-900 leading-relaxed">
              Nếu sinh viên đã có dữ liệu đồ án, tài khoản sẽ chỉ bị{' '}
              <span className="font-semibold">khóa đăng nhập</span> thay vì xóa.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 border-t border-slate-200 bg-slate-50/70 px-6 py-3.5">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="h-9 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition shadow-none"
          >
            Hủy
          </Button>
          <Button
            onClick={confirmDelete}
            disabled={isPending}
            className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-semibold transition shadow-sm shadow-rose-600/20 inline-flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
