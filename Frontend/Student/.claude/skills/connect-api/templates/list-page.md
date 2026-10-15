# Mẫu: trang danh sách có phân trang + dữ liệu của chính sinh viên

Vị trí trong feature: `pages/SupervisorRegistrationPage.tsx`

Ví dụ dùng feature `student/supervisor_registration` (đăng ký GVHD). Khi làm feature khác: đổi tên, giữ cấu trúc.

```tsx
import { useState } from 'react'
import { Pencil } from 'lucide-react'
import {
  Badge,
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui'
import { RegistrationFormDialog } from '../components/RegistrationFormDialog'
import { useMyRegistration, useSupervisors } from '../hooks/useSupervisorRegistration'
import type { RegistrationStatus, SupervisorSummary } from '../types/registration.types'

const PAGE_SIZE = 10

const statusLabels: Record<RegistrationStatus, string> = {
  PENDING: 'Chờ GVHD duyệt',
  APPROVED: 'Đã được nhận',
  REJECTED: 'Bị từ chối',
}

const statusVariants: Record<RegistrationStatus, 'warning' | 'success' | 'destructive'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
}

export default function SupervisorRegistrationPage() {
  // Trang hiện tại tính từ 0 giống Spring Pageable; hiển thị cho người dùng thì +1
  const [page, setPage] = useState(0)
  const { data, isPending, isError, isPlaceholderData } = useSupervisors({
    page,
    size: PAGE_SIZE,
    sort: 'fullName,asc',
  })
  const myRegistration = useMyRegistration()

  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<SupervisorSummary | undefined>()
  const [editing, setEditing] = useState(false)

  // Đang chờ duyệt hoặc đã được nhận thì không đăng ký thêm. Đây chỉ là giao diện, BE vẫn phải kiểm tra
  const current = myRegistration.data ?? undefined
  const hasActiveRegistration = current?.status === 'PENDING' || current?.status === 'APPROVED'

  const openRegister = (supervisor: SupervisorSummary) => {
    setSelected(supervisor)
    setEditing(false)
    setFormOpen(true)
  }
  const openEdit = () => {
    if (!current) return
    setSelected(current.supervisor)
    setEditing(true)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Đăng ký GVHD</h1>
        <p className="text-sm text-slate-500">
          Chọn giảng viên hướng dẫn và nhập tên đề tài dự kiến.
        </p>
      </div>

      {/* Đăng ký hiện tại của sinh viên */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        {myRegistration.isPending ? (
          <Skeleton className="h-12 w-full" />
        ) : myRegistration.isError ? (
          <p className="text-sm text-slate-500">Không tải được thông tin đăng ký.</p>
        ) : !current ? (
          <p className="text-sm text-slate-500">Bạn chưa đăng ký GVHD.</p>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{current.supervisor.fullName}</span>
                <Badge variant={statusVariants[current.status]}>
                  {statusLabels[current.status]}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">Đề tài: {current.topicTitle}</p>
              {current.rejectReason && (
                <p className="text-sm text-slate-500">Lý do từ chối: {current.rejectReason}</p>
              )}
            </div>
            {/* Chỉ sửa được khi GVHD chưa duyệt */}
            {current.status === 'PENDING' && (
              <Button variant="outline" size="sm" onClick={openEdit}>
                <Pencil /> Sửa
              </Button>
            )}
          </div>
        )}
      </div>

      {hasActiveRegistration && (
        <p className="text-sm text-slate-500">
          Bạn đã có đăng ký đang chờ duyệt hoặc đã được nhận nên không thể đăng ký thêm.
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã GV</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Bộ môn</TableHead>
              <TableHead>Chỉ tiêu</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              Array.from({ length: 5 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              // Toast lỗi đã do interceptor hiện, ở đây chỉ báo trạng thái trong bảng
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                  Không tải được danh sách giảng viên.
                </TableCell>
              </TableRow>
            ) : data.empty ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                  Chưa có giảng viên nào nhận hướng dẫn.
                </TableCell>
              </TableRow>
            ) : (
              data.content.map((supervisor) => {
                const isFull = supervisor.acceptedCount >= supervisor.quota
                return (
                  <TableRow key={supervisor.id}>
                    <TableCell className="font-medium">{supervisor.code}</TableCell>
                    <TableCell>{supervisor.fullName}</TableCell>
                    <TableCell>{supervisor.department ?? '—'}</TableCell>
                    <TableCell>
                      {supervisor.acceptedCount} / {supervisor.quota}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        disabled={isFull || hasActiveRegistration}
                        onClick={() => openRegister(supervisor)}
                      >
                        {isFull ? 'Đã đủ chỉ tiêu' : 'Đăng ký'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-3 text-sm text-slate-600">
          <span>
            Trang {data.number + 1} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={data.first || isPlaceholderData}
            onClick={() => setPage((p) => p - 1)}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={data.last || isPlaceholderData}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}

      {selected && (
        <RegistrationFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          supervisor={selected}
          registration={editing ? current : undefined}
        />
      )}
    </div>
  )
}
```
