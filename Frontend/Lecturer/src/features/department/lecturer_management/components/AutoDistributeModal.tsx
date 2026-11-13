import { useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  Sparkles,
  CheckCircle2,
  Users,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import type {
  CommentingLecturer,
  StudentAssignment,
} from '../types/commenting.types'
import { calculateDistributionPreviewSummary } from '../utils/commenting.mapper'

interface AutoDistributeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
  lecturers: CommentingLecturer[]
  previewAssignments: StudentAssignment[]
}

export function AutoDistributeModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  lecturers,
  previewAssignments,
}: AutoDistributeModalProps) {
  // Bảng thống kê biến động số lượng nhận xét của từng giảng viên
  const summary = useMemo(() => {
    return calculateDistributionPreviewSummary(lecturers, previewAssignments)
  }, [lecturers, previewAssignments])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Xem trước kết quả phân công chia đều
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-1">
                Thuật toán cân bằng tải tự động chia đều {previewAssignments.length} sinh viên cho các giảng viên hợp lệ và loại trừ 100% trùng GVHD.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Thống kê biến động tải công việc */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Cân đối tải công việc giữa các giảng viên
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {summary.map((item) => (
                <div
                  key={item.lecturerId}
                  className="p-3.5 rounded-lg border border-gray-200 bg-white hover:border-blue-300 transition-colors shadow-xs"
                >
                  <p className="font-medium text-gray-900 text-sm truncate" title={item.lecturerName}>
                    {item.lecturerName}
                  </p>
                  <p className="text-xs text-gray-500 truncate mb-2">{item.department}</p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                    <span className="text-gray-500">Đang nhận xét:</span>
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span className="text-gray-700">{item.currentCount}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-blue-600 font-bold">{item.newCount}</span>
                      {item.diffCount > 0 && (
                        <span className="text-emerald-600 font-medium">(+{item.diffCount})</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Danh sách phân công chi tiết */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3">
              Danh sách sinh viên và GV nhận xét dự kiến ({previewAssignments.length})
            </h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">MSSV</th>
                    <th className="py-2.5 px-3">Họ và tên</th>
                    <th className="py-2.5 px-3">Đề tài</th>
                    <th className="py-2.5 px-3">GV Hướng dẫn</th>
                    <th className="py-2.5 px-3">GV Nhận xét (Dự kiến)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {previewAssignments.map((s) => (
                    <tr key={s.id} className="hover:bg-blue-50/40">
                      <td className="py-2.5 px-3 font-mono text-xs font-semibold text-gray-700">
                        {s.studentCode}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">{s.studentName}</td>
                      <td className="py-2.5 px-3 text-xs text-gray-600 max-w-xs truncate" title={s.topicTitle}>
                        {s.topicTitle}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-gray-600">{s.supervisorName}</td>
                      <td className="py-2.5 px-3 text-xs">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                          {s.commentingLecturerName}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 px-6 border-t bg-gray-50 flex items-center justify-between sm:justify-between">
          <p className="text-xs text-gray-500">
            Dữ liệu sẽ chỉ được lưu chính thức khi bạn nhấn nút "Xác nhận lưu".
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Hủy bỏ
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Xác nhận lưu
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
