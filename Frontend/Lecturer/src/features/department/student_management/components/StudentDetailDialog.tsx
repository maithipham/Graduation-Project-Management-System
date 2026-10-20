import type { ReactNode } from 'react'
import { BookOpenCheck } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@/shared/components/ui'
import { useStudentDetail } from '../hooks/useStudents'
import { StudentStatusBadge } from './StudentStatusBadge'

interface StudentDetailDialogProps {
  /** publicId của sinh viên đang xem; undefined → popup đóng */
  publicId: string | undefined
  onClose: () => void
}

export function StudentDetailDialog({ publicId, onClose }: StudentDetailDialogProps) {
  const { data: student, isPending, isError } = useStudentDetail(publicId)

  return (
    <Dialog open={publicId !== undefined} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thông tin sinh viên</DialogTitle>
        </DialogHeader>

        {isPending ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-40" />
              </div>
            ))}
          </dl>
        ) : isError || !student ? (
          // Toast lỗi (ví dụ 3008 – Sinh viên không tồn tại) đã do interceptor hiện
          <p className="py-8 text-center text-sm text-slate-500">
            Không tải được thông tin sinh viên.
          </p>
        ) : (
          <>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
              <DetailItem label="Mã sinh viên">{student.studentCode}</DetailItem>
              <DetailItem label="Họ và tên">{student.name}</DetailItem>
              <DetailItem label="Email">
                <a href={`mailto:${student.email}`} className="break-all text-blue-600 hover:underline">
                  {student.email}
                </a>
              </DetailItem>
              <DetailItem label="Số điện thoại">{student.phone ?? '—'}</DetailItem>
              <DetailItem label="Ngành">{student.majorName ?? '—'}</DetailItem>
              <DetailItem label="Lớp">{student.className}</DetailItem>
              <DetailItem label="Khóa">{student.batch}</DetailItem>
              <DetailItem label="Trạng thái">
                <StudentStatusBadge active={student.status} />
              </DetailItem>
            </dl>

            <div className="flex items-start gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-slate-400">
              <BookOpenCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-500">Đề tài &amp; Giảng viên hướng dẫn</p>
                <p className="text-xs">Sẽ cập nhật khi có module đề tài.</p>
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-slate-900">{children}</dd>
    </div>
  )
}
