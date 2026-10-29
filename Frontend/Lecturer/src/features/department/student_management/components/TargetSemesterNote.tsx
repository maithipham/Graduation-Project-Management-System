import { CalendarDays } from 'lucide-react'
import type { SemesterOption } from '../types'

interface TargetSemesterNoteProps {
  /** "Import vào" / "Thêm vào" */
  label: string
  semester: SemesterOption | undefined
}

/**
 * Dòng "Import vào: Học kỳ 1 năm học 2026-2027". Luôn là học kì hiện tại (GET /semester/current):
 * BE tự thêm sinh viên vào kì hiện tại, không theo học kì đang chọn trên bộ lọc
 */
export function TargetSemesterNote({ label, semester }: TargetSemesterNoteProps) {
  if (!semester) return null
  return (
    <p className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
      <CalendarDays className="h-4 w-4 shrink-0 text-blue-600" />
      {label}: <span className="font-semibold text-slate-900">{semester.name}</span>
    </p>
  )
}
