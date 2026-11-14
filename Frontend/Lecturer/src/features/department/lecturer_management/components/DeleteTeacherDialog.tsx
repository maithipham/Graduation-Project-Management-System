import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button, Dialog, DialogContent } from '@/shared/components/ui'
import { useDeleteTeacher } from '../hooks/useTeachers'
import type { TeacherListItem } from '../types'

interface DeleteTeacherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacher: TeacherListItem | null
  onSuccess?: () => void
}

export function DeleteTeacherDialog({
  open,
  onOpenChange,
  teacher,
  onSuccess,
}: DeleteTeacherDialogProps) {
  const deleteTeacher = useDeleteTeacher()

  if (!teacher) return null

  const teacherId = teacher.id || teacher.teacherId || teacher.publicId
  const teacherName = teacher.fullNameWithTitle || teacher.displayName || teacher.name

  const handleConfirm = () => {
    deleteTeacher.mutate(teacherId, {
      onSuccess: () => {
        onOpenChange(false)
        onSuccess?.()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !deleteTeacher.isPending && onOpenChange(val)}>
      <DialogContent className="max-w-[480px] gap-0 p-0 overflow-hidden rounded-2xl">
        {/* Header Modal */}
        <div className="flex items-start gap-3.5 border-b border-slate-200 px-6 pt-5 pb-4 bg-white">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">
              Xóa giảng viên
            </h3>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              Xác nhận xóa tài khoản giảng viên khỏi hệ thống
            </p>
          </div>
        </div>

        {/* Nội dung xác nhận */}
        <div className="px-6 py-4 space-y-3.5 bg-white">
          {/* Card tóm tắt giảng viên cần xóa */}
          <div className="flex items-center gap-3.5 rounded-xl border border-slate-200/90 bg-slate-50/80 p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white text-sm shadow-sm">
              {teacherName.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm truncate">
                  {teacherName}
                </span>
                {teacher.teacherCode && (
                  <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[11px] font-mono text-slate-700">
                    {teacher.teacherCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {teacher.email} {teacher.organization ? `• ${teacher.organization}` : ''}
              </p>
            </div>
          </div>

          {/* Cảnh báo ràng buộc */}
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 p-3 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-amber-900">Lưu ý trước khi xóa:</p>
              <p className="text-amber-700 leading-relaxed">
                Hành động này sẽ xóa dữ liệu giảng viên. Nếu giảng viên đang có phân công hướng dẫn, phản biện hoặc gắn với đồ án trong kỳ, hệ thống sẽ chặn xóa để đảm bảo toàn vẹn dữ liệu.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <Button
            type="button"
            variant="outline"
            disabled={deleteTeacher.isPending}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteTeacher.isPending}
            onClick={handleConfirm}
          >
            {deleteTeacher.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

