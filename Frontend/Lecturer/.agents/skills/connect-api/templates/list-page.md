# Mẫu: trang danh sách có phân trang

Vị trí trong feature: `pages/SemesterListPage.tsx`

Ví dụ dùng feature `admin/semester_management` (học kỳ). Khi làm feature khác: đổi tên, giữ cấu trúc.

```tsx
import { useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import {
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui'
import { SemesterFormDialog } from '../components/SemesterFormDialog'
import { useSemesters } from '../hooks/useSemesters'
import type { Semester, SemesterStatus } from '../types/semester.types'

const PAGE_SIZE = 10

const statusLabels: Record<SemesterStatus, string> = {
  UPCOMING: 'Sắp diễn ra',
  ACTIVE: 'Đang diễn ra',
  CLOSED: 'Đã kết thúc',
}

export default function SemesterListPage() {
  // Trang hiện tại tính từ 0 giống Spring Pageable; hiển thị cho người dùng thì +1
  const [page, setPage] = useState(0)
  const { data, isPending, isError, isPlaceholderData } = useSemesters({
    page,
    size: PAGE_SIZE,
    sort: 'createdAt,desc',
  })

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Semester | undefined>()

  const openCreate = () => {
    setEditing(undefined)
    setFormOpen(true)
  }
  const openEdit = (semester: Semester) => {
    setEditing(semester)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý học kỳ</h1>
          <p className="text-sm text-slate-500">Danh sách học kỳ dùng cho đợt đồ án tốt nghiệp.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> Thêm học kỳ
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên học kỳ</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-16" />
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
                  Không tải được danh sách học kỳ.
                </TableCell>
              </TableRow>
            ) : data.empty ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                  Chưa có học kỳ nào.
                </TableCell>
              </TableRow>
            ) : (
              data.content.map((semester) => (
                <TableRow key={semester.id}>
                  <TableCell className="font-medium">{semester.code}</TableCell>
                  <TableCell>{semester.name}</TableCell>
                  <TableCell>
                    {semester.startDate} – {semester.endDate}
                  </TableCell>
                  <TableCell>{statusLabels[semester.status]}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Sửa ${semester.name}`}
                      onClick={() => openEdit(semester)}
                    >
                      <Pencil />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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

      <SemesterFormDialog open={formOpen} onOpenChange={setFormOpen} semester={editing} />
    </div>
  )
}
```
