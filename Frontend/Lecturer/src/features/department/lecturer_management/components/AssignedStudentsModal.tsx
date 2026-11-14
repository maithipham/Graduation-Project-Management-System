import { GraduationCap, FileText, CheckCircle2 } from 'lucide-react'
import { Dialog, DialogContent } from '@/shared/components/ui'
import type { SupervisorLecturer, SupervisorStudent } from '../types'

interface AssignedStudentsModalProps {
  lecturer: SupervisorLecturer | null
  students: SupervisorStudent[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignedStudentsModal({
  lecturer,
  students,
  open,
  onOpenChange,
}: AssignedStudentsModalProps) {
  if (!lecturer) return null

  const cleanLecturerName = lecturer.name.trim().toLowerCase()
  const assignedStudents = students.filter(
    (s) =>
      s.supervisorId === lecturer.id ||
      s.supervisor2Id === lecturer.id ||
      (s.supervisorName && s.supervisorName.trim().toLowerCase() === cleanLecturerName) ||
      (s.supervisor2Name && s.supervisor2Name.trim().toLowerCase() === cleanLecturerName),
  )

  const pct = Math.min(100, Math.round((assignedStudents.length / lecturer.quota) * 100))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[840px] p-0 overflow-hidden rounded-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center font-bold text-sm shrink-0">
              {lecturer.title || 'GV'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-slate-800">
                  {lecturer.name}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-[#1565C0] border border-blue-200">
                  {lecturer.department}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Đang hướng dẫn <strong>{assignedStudents.length}/{lecturer.quota} sinh viên</strong> ({pct}% chỉ tiêu) · {lecturer.email}
              </p>
            </div>
          </div>
        </div>

        {/* Content list */}
        <div className="p-6 flex-1 overflow-y-auto space-y-3">
          {assignedStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <GraduationCap className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              Giảng viên này hiện chưa được phân công hướng dẫn sinh viên nào trong kỳ.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">STT</th>
                    <th className="py-2.5 px-3.5 min-w-[170px]">MSSV & Họ tên</th>
                    <th className="py-2.5 px-3 w-28">Lớp</th>
                    <th className="py-2.5 px-4 min-w-[240px]">Đề tài tốt nghiệp</th>
                    <th className="py-2.5 px-3.5 w-40 text-left">Vai trò</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {assignedStudents.map((s, idx) => {
                    const isMain =
                      s.supervisorId === lecturer.id ||
                      (s.supervisorName && s.supervisorName.trim().toLowerCase() === cleanLecturerName)

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-3 text-center font-bold text-slate-400 text-xs">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900 text-[13.5px]">{s.name}</div>
                          <div className="text-[11.5px] text-slate-400 font-mono mt-0.5">{s.code}</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-600">
                          {s.className || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {s.topic ? (
                            <div className="flex items-start gap-1.5 line-clamp-2">
                              <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                              <span className="leading-snug">{s.topic}</span>
                            </div>
                          ) : (
                            <span className="italic text-slate-400">(chưa đăng ký)</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          <div>
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                isMain
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-purple-50 text-purple-700 border border-purple-200'
                              }`}
                            >
                              {isMain ? 'GVHD 1 (Chính)' : 'GVHD 2 (Đồng HD)'}
                            </span>
                            <div className="text-[11.5px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Đã phân công</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-8 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

