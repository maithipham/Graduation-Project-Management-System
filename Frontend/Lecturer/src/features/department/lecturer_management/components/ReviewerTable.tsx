import { getAvatarInitials, getAvatarColor } from '../utils/teacherDisplay'
import { cn } from '@/shared/utils/cn'
import type { ReviewerLecturer, ReviewerStudent } from '../types'
import { ReviewerCombobox } from './ReviewerCombobox'

interface ReviewerTableProps {
  students: ReviewerStudent[]
  lecturers: ReviewerLecturer[]
  page: number
  pageSize: number
  totalElements: number
  onPageChange: (page: number) => void
  onAssignReviewer: (studentId: string, reviewerId: string | null) => void
}

export function ReviewerTable({
  students,
  lecturers,
  page,
  pageSize,
  totalElements,
  onPageChange,
  onAssignReviewer,
}: ReviewerTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize))
  const startIdx = page * pageSize

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10">
            <tr>
              <th className="py-3 px-3 w-12 text-center">STT</th>
              <th className="py-3 px-3.5 w-28">MSSV</th>
              <th className="py-3 px-4 min-w-[200px]">Sinh viên</th>
              <th className="py-3 px-4 min-w-[240px] max-w-[320px]">Tên đề tài</th>
              <th className="py-3 px-4 min-w-[170px]">GV Hướng dẫn</th>
              <th className="py-3 px-4 min-w-[220px]">Người nhận xét</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[13px]">
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  Không tìm thấy sinh viên nào phù hợp.
                </td>
              </tr>
            ) : (
              students.map((s, idx) => {
                const initials = getAvatarInitials(s.name)
                const avatarColor = getAvatarColor(s.name)

                return (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-3 text-center font-bold text-slate-400 text-xs">
                      {startIdx + idx + 1}
                    </td>

                    <td className="py-3.5 px-3.5 font-mono font-bold text-slate-800 text-xs">
                      {s.code || s.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs',
                            avatarColor,
                          )}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {s.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">{s.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {s.topic ? (
                        <div className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                          {s.topic}
                        </div>
                      ) : (
                        <span className="italic text-slate-400 text-xs">(Chưa đăng ký)</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {s.gvhds && s.gvhds.length > 0 ? (
                        <div className="space-y-0.5">
                          {s.gvhds.map((gv, i) => (
                            <div key={i} className="font-semibold text-slate-800 text-xs">
                              {gv}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="italic text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <ReviewerCombobox
                        currentReviewerId={s.reviewerId}
                        currentReviewerName={s.reviewerName}
                        excludedGvhdNames={s.gvhds || []}
                        lecturers={lecturers}
                        onSelect={(reviewerId) => onAssignReviewer(s.id, reviewerId)}
                      />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer phân trang */}
      <div className="p-3.5 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap bg-slate-50/50 text-xs">
        <div className="text-slate-500 font-medium">
          Hiển thị{' '}
          <strong className="text-slate-800">
            {totalElements > 0 ? startIdx + 1 : 0}–
            {Math.min(startIdx + pageSize, totalElements)}
          </strong>{' '}
          trên <strong className="text-slate-800">{totalElements}</strong> sinh viên
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            className="h-8 px-2.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-white disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
          >
            Trước
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPageChange(i)}
              className={cn(
                'h-8 min-w-8 px-2 rounded-lg text-xs font-semibold transition cursor-pointer',
                i === page
                  ? 'bg-[#1565C0] text-white font-bold'
                  : 'border border-slate-200 text-slate-600 hover:bg-white',
              )}
            >
              {i + 1}
            </button>
          ))}

          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            className="h-8 px-2.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-white disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  )
}

