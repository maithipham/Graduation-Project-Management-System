import { Trash2 } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui'
import { toast } from '@/shared/components/feedback/toast.store'
import { useDeleteStudent } from '../hooks/useStudents'
import type { SemesterOption, StudentListItem } from '../types'

interface DeleteStudentDialogProps {
  /** Dòng đang muốn xóa; undefined → popup đóng */
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
        // BE trả 2 kiểu message (xóa hẳn hay chỉ xóa khỏi kì) → hiện đúng message đó
        onSuccess: (message) => {
          toast.success(message || 'Xóa sinh viên thành công')
          onClose()
        },
        // Toast lỗi đã do interceptor hiện; danh sách đã được tải lại nên đóng popup
        onError: onClose,
      },
    )
  }

  return (
    <Dialog
      open={student !== undefined}
      // Đang xóa thì không cho đóng giữa chừng
      onOpenChange={(open) => !open && !isPending && onClose()}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <DialogTitle>Xóa sinh viên khỏi học kỳ?</DialogTitle>
          <DialogDescription className="leading-relaxed">
            Xóa sinh viên{' '}
            <span className="font-semibold text-slate-800">
              {student?.name} ({student?.studentCode})
            </span>{' '}
            khỏi <span className="font-semibold text-slate-800">{semester?.name}</span>? Nếu sinh viên
            không còn đồ án ở học kỳ nào khác, hồ sơ và tài khoản cũng bị xóa.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={confirmDelete} disabled={isPending || !semester}>
            {isPending ? 'Đang xóa...' : 'Xóa sinh viên'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
