import { CalendarDays } from 'lucide-react'
import { useSemesterScope } from '@/features/department/lecturer_management'
import { Select, Skeleton } from '@/shared/components/ui'
import { useSemesterRubrics } from '../hooks/useSemesterRubrics'
import type { RubricRole } from '../types'

interface CurrentRubricCardProps {
  role: RubricRole
  roleLabel: string
  onOpenRubric: (publicId: string) => void
}

/**
 * Thẻ "Rubric áp dụng cho học kỳ" (B1, chỉ xem) với dropdown Năm học / Học kỳ.
 * Rubric của học kỳ do khoảng "Từ kỳ" – "Đến kỳ" của rubric quyết định nên không đổi tay ở đây.
 */
export function CurrentRubricCard({ role, roleLabel, onOpenRubric }: CurrentRubricCardProps) {
  const scope = useSemesterScope({ allowAll: false })
  const semesterId = scope.activeSemesterId
  const rubricsQuery = useSemesterRubrics(semesterId)
  const assignment = rubricsQuery.data?.find((item) => item.role === role) ?? null

  return (
    <section
      aria-label="Rubric áp dụng cho học kỳ"
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1565C0]">
          <CalendarDays className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              aria-label="Năm học"
              containerClassName="w-36"
              value={scope.selectedYear}
              disabled={scope.isLoading}
              onChange={(event) => scope.onYearChange(event.target.value)}
            >
              {scope.selectedYear === '' && <option value="">Năm học</option>}
              {scope.academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Học kỳ"
              containerClassName="w-40"
              value={scope.selectedSemesterId}
              disabled={scope.isLoading}
              onChange={(event) => scope.onSemesterChange(event.target.value)}
            >
              {scope.selectedSemesterId === '' && <option value="">Học kỳ</option>}
              {scope.termsOfYear.map((semester) => (
                <option key={semester.publicId} value={semester.publicId}>
                  {semester.term || semester.name}
                </option>
              ))}
            </Select>
          </div>

          {!semesterId ? (
            scope.isLoading ? (
              <Skeleton className="h-5 w-64" />
            ) : (
              <p className="text-[13px] text-slate-500">Chưa có học kỳ nào.</p>
            )
          ) : rubricsQuery.isPending ? (
            <Skeleton className="h-5 w-64" />
          ) : rubricsQuery.isError ? (
            // Toast lỗi interceptor đã hiện
            <p className="text-[13px] font-semibold text-slate-500">Không tải được rubric của học kỳ.</p>
          ) : assignment?.templatePublicId ? (
            <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-slate-700">
              <span>Đang áp dụng:</span>
              <button
                type="button"
                onClick={() => onOpenRubric(assignment.templatePublicId as string)}
                className="cursor-pointer font-bold text-slate-900 hover:text-[#1565C0] hover:underline"
              >
                {assignment.templateName}
              </button>
            </div>
          ) : (
            <p className="text-[13.5px] font-semibold text-amber-700">
              Học kỳ này chưa có rubric {roleLabel}. Hãy áp dụng một rubric có khoảng kỳ chứa học kỳ này.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
