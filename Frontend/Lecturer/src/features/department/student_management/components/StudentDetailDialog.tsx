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
import { useStudentDetail } from '../hooks/useStudents'
import type { StudentListItem } from '../types'
import { StudentStatusBadge } from './StudentStatusBadge'

interface StudentDetailDialogProps {
  /** Dòng đang bấm trên bảng; undefined → popup đóng */
  student: StudentListItem | undefined
  onClose: () => void
}

export function StudentDetailDialog({ student: row, onClose }: StudentDetailDialogProps) {
  const { data: student, isPending, isError } = useStudentDetail(row?.publicId)

  return (
    <Dialog open={row !== undefined} onOpenChange={(open) => !open && onClose()}>
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
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
            <DetailItem label="Mã sinh viên">{student.studentCode}</DetailItem>
            <DetailItem label="Họ và tên">{student.name}</DetailItem>
            <DetailItem label="Email">
              <a href={`mailto:${student.email}`} className="break-all text-blue-600 hover:underline">
                {student.email}
              </a>
            </DetailItem>
            <DetailItem label="Số điện thoại">{student.phone ?? '—'}</DetailItem>
            <DetailItem label="Bộ môn">{student.majorName ?? '—'}</DetailItem>
            <DetailItem label="Lớp">{student.className}</DetailItem>
            <DetailItem label="Khóa">{student.batch}</DetailItem>
            <DetailItem label="Tài khoản">
              {student.accountStatus ? (
                <span className="text-green-700">Được đăng nhập</span>
              ) : (
                <span className="text-slate-500">Bị khóa đăng nhập</span>
              )}
            </DetailItem>
          </dl>
        )}

        {/* Đồ án học kì đang chọn: lấy từ dòng trên bảng, không gọi thêm API */}
        {row && (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Đồ án học kì này
            </p>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <DetailItem label="Đề tài">
                  {row.topicName ?? <span className="font-normal text-slate-400 italic">Chưa có đề tài</span>}
                </DetailItem>
              </div>
              <DetailItem label="Giảng viên hướng dẫn">
                {row.lecturerName ?? <span className="font-normal text-slate-400">Chưa phân công</span>}
              </DetailItem>
              <DetailItem label="Đồng hướng dẫn">{row.coLecturerName ?? '—'}</DetailItem>
              <DetailItem label="Trạng thái">
                <StudentStatusBadge status={row.status} label={row.statusLabel} />
              </DetailItem>
            </dl>
          </div>
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
