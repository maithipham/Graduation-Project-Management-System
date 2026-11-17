import { useState } from 'react'
import { ArrowLeftRight, CalendarDays, Lock } from 'lucide-react'
import { useSemesterScope } from '@/features/department/lecturer_management'
import { Button, Select, Skeleton } from '@/shared/components/ui'
import { useSemesterRubrics } from '../hooks/useSemesterRubrics'
import type { RubricListItem, RubricRole } from '../types'
import { ChangeRubricDialog, type ChangeRubricTarget } from './ChangeRubricDialog'
import { RubricInUseDialog, type RubricInUseInfo } from './RubricInUseDialog'
import { RubricStatusBadge } from './RubricStatusBadge'

interface CurrentRubricCardProps {
  role: RubricRole
  roleLabel: string
  /** Kho rubric cùng loại phiếu (A1) để chọn khi đổi */
  candidates: RubricListItem[]
  onOpenRubric: (publicId: string) => void
  onClone: (publicId: string, name: string) => void
}

/** Thẻ "Rubric áp dụng cho học kỳ" (B1) với dropdown Năm học / Học kỳ, kèm nút đổi rubric (B2) */
export function CurrentRubricCard({ role, roleLabel, candidates, onOpenRubric, onClone }: CurrentRubricCardProps) {
  const scope = useSemesterScope({ allowAll: false })
  const semesterId = scope.activeSemesterId
  const semesterName = scope.activeSemester?.name ?? ''
  const rubricsQuery = useSemesterRubrics(semesterId)
  const assignment = rubricsQuery.data?.find((item) => item.role === role) ?? null

  const [changeTarget, setChangeTarget] = useState<ChangeRubricTarget | null>(null)
  const [inUseInfo, setInUseInfo] = useState<RubricInUseInfo | null>(null)

  const locked = assignment !== null && !assignment.canChange

  function handleChange() {
    if (!semesterId) return
    if (locked) {
      setInUseInfo({
        semesterName,
        templatePublicId: assignment.templatePublicId,
        templateName: assignment.templateName,
      })
      return
    }
    setChangeTarget({ semesterPublicId: semesterId, semesterName, assignment })
  }

  return (
    <section
      aria-label="Rubric áp dụng cho học kỳ"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs"
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
            <span className="text-[12px] font-semibold text-slate-500">· {roleLabel}</span>
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
              {assignment.status && <RubricStatusBadge status={assignment.status} label={assignment.statusLabel} />}
            </div>
          ) : (
            <p className="text-[13.5px] font-semibold text-amber-700">Chưa chọn rubric cho học kỳ này</p>
          )}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!semesterId || rubricsQuery.isPending || rubricsQuery.isError}
        onClick={handleChange}
        title={locked ? 'Học kỳ đã có phiếu chấm hoặc đã khóa, không thể đổi rubric' : undefined}
      >
        {locked ? <Lock className="h-4 w-4" /> : <ArrowLeftRight className="h-4 w-4" />}
        {assignment?.templatePublicId ? 'Đổi rubric cho kỳ này' : 'Chọn rubric cho kỳ này'}
      </Button>

      <ChangeRubricDialog
        target={changeTarget}
        role={role}
        roleLabel={roleLabel}
        candidates={candidates}
        onClose={() => setChangeTarget(null)}
        onLocked={(target) => {
          setChangeTarget(null)
          setInUseInfo({
            semesterName: target.semesterName,
            templatePublicId: target.assignment?.templatePublicId ?? null,
            templateName: target.assignment?.templateName ?? null,
          })
        }}
      />

      <RubricInUseDialog
        info={inUseInfo}
        onClose={() => setInUseInfo(null)}
        onClone={(publicId, name) => {
          setInUseInfo(null)
          onClone(publicId, name)
        }}
      />
    </section>
  )
}
