import { useState, useMemo } from 'react'
import { ChevronDown, Trash2, UserCheck, X } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
} from '@/shared/components/ui'
import { toast } from '@/shared/components/feedback'
import type { SemesterOption } from '@/features/department/student_management'
import type { TeacherListItem } from '../types'
import { getTeacherPlainName, getTeacherId, getAvatarColor, getAvatarInitials } from '../utils/teacherDisplay'
import { cn } from '@/shared/utils/cn'
import { useAssignAdvisors } from '../hooks/useTeachers'

export interface AssignAdvisorsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds?: number[]
  selectedTeachers?: TeacherListItem[]
  semesterId?: string
  semesterName?: string
  academicYears?: string[]
  termsOfYear?: SemesterOption[]
  selectedYear?: string
  selectedSemesterId?: string
  onRemoveTeacher?: (teacherId: number) => void
  onSuccess: () => void
}

export function AssignAdvisorsDialog({
  open,
  onOpenChange,
  selectedIds = [],
  selectedTeachers = [],
  semesterId,
  semesterName = '',
  academicYears = [],
  termsOfYear = [],
  selectedYear = '',
  selectedSemesterId = '',
  onRemoveTeacher,
  onSuccess,
}: AssignAdvisorsDialogProps) {
  const assignMutation = useAssignAdvisors()

  const initialTeachers = useMemo<TeacherListItem[]>(() => {
    if (selectedTeachers.length > 0) return selectedTeachers
    return selectedIds.map((id) => ({
      id,
      teacherId: id,
      publicId: String(id),
      name: `Giảng viên #${id}`,
      firstName: '',
      lastName: `Giảng viên #${id}`,
      teacherCode: `GV${id}`,
      academicTitle: '',
      phone: '',
      email: '',
      organization: '',
      isInternal: true,
      status: true,
      majorName: '',
    }))
  }, [selectedTeachers, selectedIds])

  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set())
  const [prevOpen, setPrevOpen] = useState(false)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setRemovedIds(new Set())
    }
  }

  const localTeachers = useMemo(() => {
    return initialTeachers.filter((t) => {
      const id = typeof getTeacherId(t) === 'number' ? (getTeacherId(t) as number) : t.id
      return id ? !removedIds.has(id) : true
    })
  }, [initialTeachers, removedIds])

  // Năm học và Học kỳ hiển thị cố định theo học kỳ đang chọn (không cho thay đổi trong popup)
  // Nếu filter đang chọn 'all' thì ưu tiên lấy semesterId cụ thể (kỳ hiện tại)
  const targetSemesterId =
    selectedSemesterId && selectedSemesterId !== 'all' && selectedSemesterId !== 'ALL'
      ? selectedSemesterId
      : semesterId && semesterId !== 'all' && semesterId !== 'ALL'
        ? semesterId
        : ''

  const currentTermOption = useMemo(() => {
    if (!targetSemesterId) return undefined
    return termsOfYear.find((s) => s.publicId === targetSemesterId)
  }, [termsOfYear, targetSemesterId])

  const displayYear =
    selectedYear && selectedYear !== 'all'
      ? selectedYear
      : currentTermOption?.academicYear || academicYears.find((y) => y !== 'all') || '2026-2027'

  const displaySemesterName =
    currentTermOption?.term ||
    currentTermOption?.name ||
    semesterName ||
    (targetSemesterId ? 'Học kỳ 1' : 'Tất cả học kỳ')

  const handleRemove = (teacher: TeacherListItem) => {
    const rawId = getTeacherId(teacher)
    const id = typeof rawId === 'number' ? rawId : teacher.id
    if (typeof id === 'number') {
      setRemovedIds((prev) => new Set(prev).add(id))
      onRemoveTeacher?.(id)
    }
  }

  const handleConfirm = () => {
    if (!targetSemesterId) {
      toast.warning('Vui lòng chọn một học kỳ cụ thể để phân công giảng viên hướng dẫn.')
      return
    }
    if (localTeachers.length === 0) return

    const teacherIds = localTeachers
      .map((t) => {
        const rawId = getTeacherId(t)
        return typeof rawId === 'number' ? rawId : t.id
      })
      .filter((id): id is number => typeof id === 'number')

    assignMutation.mutate(
      {
        semesterId: targetSemesterId,
        teacherIds,
        maxStudentsPerTeacher: 20,
      },
      {
        onSuccess: () => {
          onSuccess()
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !assignMutation.isPending && onOpenChange(val)}>
      <DialogContent className="max-w-[760px] p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Phân công làm Giảng viên Hướng dẫn
              </h3>
            </div>
          </div>
          <button
            type="button"
            disabled={assignMutation.isPending}
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Năm học & Học kỳ (chỉ hiển thị cố định theo học kỳ đang chọn, không cho thay đổi) */}
          <div className="flex items-center gap-2.5">
            <div
              className="h-9 px-3.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-2xs select-none cursor-default"
              title="Năm học (cố định theo học kỳ đang chọn)"
            >
              <span>{displayYear}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </div>

            <div
              className="h-9 px-3.5 bg-white border border-emerald-500 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-2 shadow-2xs select-none cursor-default"
              title="Học kỳ (cố định theo học kỳ đang chọn)"
            >
              <span>{displaySemesterName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>

          {assignMutation.isError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {assignMutation.error instanceof Error
                ? assignMutation.error.message
                : 'Chỉ học kỳ đang diễn ra (ONGOING) mới được phân công GVHD.'}
            </div>
          )}

          {/* Bảng danh sách giảng viên đã chọn */}
          <div className="border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs bg-white max-h-[360px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th
                    className="py-2.5 px-2 w-20 text-center"
                    aria-label="Học hàm / Học vị"
                    title="Học hàm / Học vị"
                  />
                  <th className="py-2.5 px-4 min-w-[200px]">HỌ VÀ TÊN GIẢNG VIÊN</th>
                  <th className="py-2.5 px-4 min-w-[180px]">BỘ MÔN</th>
                  <th className="py-2.5 px-3 w-20 text-center">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {localTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      Chưa có giảng viên nào được chọn.
                    </td>
                  </tr>
                ) : (
                  localTeachers.map((teacher, index) => (
                    <tr key={teacher.publicId || teacher.id || index} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">{index + 1}</td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold text-slate-700 bg-slate-100/90 border border-slate-200/80">
                          {teacher.academicTitle || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs',
                              getAvatarColor(teacher.email || teacher.name),
                            )}
                          >
                            {getAvatarInitials(teacher)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-xs">
                              {getTeacherPlainName(teacher)}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {teacher.email || teacher.teacherCode || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="text-xs font-semibold text-slate-700">
                          {teacher.majorName || teacher.organization || '—'}
                        </div>
                        {teacher.organization && teacher.organization !== teacher.majorName && (
                          <div className="text-[11px] text-slate-400">
                            {teacher.organization}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemove(teacher)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition mx-auto cursor-pointer"
                          title="Xóa khỏi danh sách phân công"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/40">
          <Button
            type="button"
            variant="outline"
            disabled={assignMutation.isPending}
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 text-xs font-semibold text-slate-700"
          >
            Hủy
          </Button>
          <Button
            type="button"
            className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
            disabled={assignMutation.isPending || localTeachers.length === 0 || !targetSemesterId}
            onClick={handleConfirm}
          >
            {assignMutation.isPending ? 'Đang phân công...' : 'Xác nhận'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
