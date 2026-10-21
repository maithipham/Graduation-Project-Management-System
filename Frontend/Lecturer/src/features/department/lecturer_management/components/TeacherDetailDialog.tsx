import type { ReactNode } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@/shared/components/ui'
import { useTeacherDetail } from '../hooks/useTeachers'
import { formatAmount } from '../utils/teacherDisplay'
import { TeacherStatusBadge } from './TeacherStatusBadge'

interface TeacherDetailDialogProps {
  /** publicId của giáo viên đang xem; undefined → popup đóng */
  publicId: string | undefined
  onClose: () => void
}

export function TeacherDetailDialog({ publicId, onClose }: TeacherDetailDialogProps) {
  const { data: teacher, isPending, isError } = useTeacherDetail(publicId)

  return (
    <Dialog open={publicId !== undefined} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Thông tin giáo viên
            {teacher && <TeacherStatusBadge active={teacher.status} />}
          </DialogTitle>
        </DialogHeader>

        {isPending ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-40" />
              </div>
            ))}
          </dl>
        ) : isError || !teacher ? (
          // Toast lỗi (ví dụ 3009 – Giáo viên không tồn tại) đã do interceptor hiện
          <p className="py-8 text-center text-sm text-slate-500">
            Không tải được thông tin giáo viên.
          </p>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
            <DetailItem label="Họ và tên">{teacher.name}</DetailItem>
            <DetailItem label="Đơn vị công tác">{teacher.organization}</DetailItem>
            <DetailItem label="Ngành">{teacher.majorName ?? '—'}</DetailItem>
            <DetailItem label="Hạn mức">{formatAmount(teacher.amount)}</DetailItem>
            <DetailItem label="Số điện thoại">{teacher.phone ?? '—'}</DetailItem>
            <DetailItem label="Email">
              <a href={`mailto:${teacher.email}`} className="break-all text-blue-600 hover:underline">
                {teacher.email}
              </a>
            </DetailItem>
          </dl>
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
