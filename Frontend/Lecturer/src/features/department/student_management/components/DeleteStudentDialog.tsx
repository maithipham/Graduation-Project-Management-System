import { AlertTriangle, Trash2 } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
} from '@/shared/components/ui'
import { toast } from '@/shared/components/feedback/toast.store'
import { cn } from '@/shared/utils/cn'
import { useDeleteStudent } from '../hooks/useStudents'
import type { SemesterOption, StudentListItem } from '../types'

// Màu avatar chữ cái đầu đồng bộ 100% với StudentTable
const AVATAR_COLORS = [
  'from-cyan-500 to-sky-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
]

function getAvatarColor(studentCode: string) {
  const sum = [...studentCode].reduce((total, char) => total + char.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/)
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

interface DeleteStudentDialogProps {
  student: StudentListItem | undefined
  semester: SemesterOption | undefined
  onClose: () => void
}

export function DeleteStudentDialog({ student, semester, onClose }: DeleteStudentDialogProps) {
  const { mutate, isPending } = useDeleteStudent()

  const confirmDelete = () => {
    if (!student || !semester) return
    mutate(
      { publicId: student.publicId, semesterId: semester.publicId },
      {
        onSuccess: (message) => {
          toast.success(message || 'Xóa sinh viên thành công')
          onClose()
        },
        onError: onClose,
      },
    )
  }

  return (
    <Dialog
      open={student !== undefined}
      onOpenChange={(open) => !open && !isPending && onClose()}
    >
      {/* gap-0: bỏ khoảng cách 16px mặc định giữa header / nội dung / footer của DialogContent */}
      <DialogContent className="max-w-[480px] gap-0 p-0 overflow-hidden rounded-2xl">
        {/* Header Modal */}
        <div className="flex items-start gap-3.5 border-b border-slate-200 px-6 pt-5 pb-4 bg-white">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">
              Xóa sinh viên khỏi học kỳ
            </h3>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              Xác nhận gỡ sinh viên khỏi danh sách làm đồ án
            </p>
          </div>
        </div>

        {/* Nội dung xác nhận */}
        <div className="px-6 py-4 space-y-3.5 bg-white">
          {student && (
            /* Card tóm tắt sinh viên cần xóa */
            <div className="flex items-center gap-3.5 rounded-xl border border-slate-200/90 bg-slate-50/80 p-3.5">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-[11px] font-bold text-white shadow-2xs',
                  getAvatarColor(student.studentCode),
                )}
              >
                {getInitials(student.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-slate-800 truncate">{student.name}</span>
                  <span className="font-mono text-[11.5px] font-semibold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.2 rounded shadow-2xs">
                    {student.studentCode}
                  </span>
                </div>
                <div className="text-[12px] text-slate-500 mt-0.5">
                  Lớp: <span className="font-medium text-slate-700">{student.className}</span>
                  {semester && (
                    <>
                      {' · '}
                      <span>{semester.term || semester.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Warning Callout */}
          <div className="rounded-xl border border-rose-200/80 bg-rose-50/70 p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div className="text-[12.5px] text-rose-900 leading-relaxed">
              <span className="font-semibold text-rose-950">Lưu ý rủi ro dữ liệu:</span> Hành động này sẽ hủy gán đồ án trong <span className="font-semibold">{semester?.name || 'học kỳ này'}</span>.
              <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                <li>Nếu sinh viên không còn đề tài ở học kỳ nào khác, toàn bộ hồ sơ và tài khoản đăng nhập cũng sẽ bị xóa.</li>
                <li>Nếu sinh viên đã có đề tài ở học kỳ trước, tài khoản sẽ không được phép đăng nhập trong học kì này.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
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
            disabled={isPending || !semester}
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