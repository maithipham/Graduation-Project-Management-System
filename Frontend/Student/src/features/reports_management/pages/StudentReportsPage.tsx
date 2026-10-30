import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileX,
  Upload,
} from 'lucide-react'
import { useMyInfo } from '@/features/auth'
import { STUDENT_PROFILE_MOCK } from '@/shared/constants/studentProfile.mock'
import { getTermInfo, useStudentSemester } from '@/shared/contexts'
import { PlagiarismPreviewModal } from '../components/PlagiarismPreviewModal'
import { SubmitReportModal } from '../components/SubmitReportModal'
import {
  INITIAL_REPORT_SUBMISSIONS,
  formatReportNow,
} from '../services/reports.service'
import type { StudentReportSubmissionItem } from '../types/reports.types'

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'warning' | 'error'
}

export default function StudentReportsPage() {
  const { data: user } = useMyInfo()
  const { term } = useStudentSemester()

  const [reportHistory, setReportHistory] = useState<StudentReportSubmissionItem[]>(
    INITIAL_REPORT_SUBMISSIONS,
  )
  const [submitModalOpen, setSubmitModalOpen] = useState<boolean>(false)
  const [previewState, setPreviewState] = useState<{
    fileName: string
    rate: number
  } | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (
    message: string,
    type: 'success' | 'warning' | 'error' = 'success',
  ) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id))
    }, 3200)
  }

  const filteredReports = reportHistory.filter(
    (h) => h.year === term.year && h.semester === term.semester,
  )

  const termInfo = getTermInfo(term)
  const reportDeadline = termInfo.reportDeadline || '28/10/2026 23:59:55'

  const handleToggleReportStatus = (id: number) => {
    let nextLabel = ''
    setReportHistory((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        const nextStatus = row.status === 'Đã duyệt' ? 'Đã từ chối' : 'Đã duyệt'
        nextLabel = nextStatus
        return {
          ...row,
          status: nextStatus,
          approvedTime:
            nextStatus === 'Đã duyệt' ? '06/10/2026 16:20' : '13/10/2026 10:15',
          plagiarismRate: nextStatus === 'Đã duyệt' ? 18 : 42,
          note:
            nextStatus === 'Đã duyệt'
              ? 'Báo cáo tiến độ đạt yêu cầu, tỷ lệ trùng lặp 18% hợp lệ (<= 35%).'
              : 'Tỷ lệ trùng lặp 42% vượt quá ngưỡng cho phép (<= 35%). Cần viết lại và trích dẫn đầy đủ.',
        }
      }),
    )
    if (nextLabel) {
      showToast(`Đã chuyển trạng thái lần nộp sang: ${nextLabel}`, 'success')
    }
  }

  const handleSubmitReport = (file: File, customNote: string) => {
    const newItem: StudentReportSubmissionItem = {
      id: Date.now(),
      year: term.year,
      semester: term.semester,
      time: formatReportNow(),
      fileName: file.name,
      status: 'Chờ duyệt',
      plagiarismFile: `Bao-cao-do-an-${STUDENT_PROFILE_MOCK.mssv}.pdf`,
      plagiarismRate: 18,
      note: customNote
        ? `Ghi chú SV: "${customNote}". (Đang chờ GVHD đánh giá)`
        : 'Đang chờ giáo viên hướng dẫn đánh giá và nhận xét.',
    }

    setReportHistory((prev) => [newItem, ...prev])
    setSubmitModalOpen(false)
    showToast('Nộp báo cáo tiến độ thành công! Vui lòng chờ giáo viên phản hồi.', 'success')
  }

  const renderStatusBadge = (
    status: StudentReportSubmissionItem['status'],
    approvedTime?: string,
  ) => {
    if (status === 'Đã duyệt') {
      return (
        <div className="flex flex-col items-start gap-1">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            Đã duyệt
          </span>
          <span className="text-[11.5px] text-slate-500 font-medium">
            {approvedTime || '06/10/2026 16:20'}
          </span>
        </div>
      )
    }
    if (status === 'Đã từ chối') {
      return (
        <div className="flex flex-col items-start gap-1">
          <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            Đã từ chối
          </span>
          <span className="text-[11.5px] text-slate-500 font-medium">
            {approvedTime || '13/10/2026 10:15'}
          </span>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
          Chờ duyệt
        </span>
      </div>
    )
  }

  const studentName = user?.name?.trim() || STUDENT_PROFILE_MOCK.name

  return (
    <div className="max-w-7xl w-full mx-auto space-y-5">
      {/* Toast Wrapper */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => {
            const bgClass =
              t.type === 'error'
                ? 'bg-rose-600 text-white'
                : t.type === 'warning'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-900 text-white'
            return (
              <div
                key={t.id}
                className={`${bgClass} px-4 py-3 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 pointer-events-auto transition-all duration-300`}
              >
                {t.type === 'error' ? (
                  <AlertTriangle size={16} className="shrink-0" />
                ) : t.type === 'warning' ? (
                  <AlertCircle size={16} className="shrink-0" />
                ) : (
                  <CheckCircle2 size={16} className="shrink-0" />
                )}
                <span>{t.message}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* 1. KHỐI NỘI DUNG & KHỐI THỜI HẠN NỘP (2 cột song song) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Khối Nội dung */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-2">Nội dung</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Nêu mục tiêu, tiến độ hoàn thành các phân hệ, mã nguồn kiểm thử và các khó khăn gặp
              phải trong đợt làm đồ án.
            </p>
          </div>
          <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Giáo viên hướng dẫn:{' '}
              <strong className="text-slate-800">{STUDENT_PROFILE_MOCK.mentor}</strong>
            </span>
          </div>
        </div>

        {/* Khối Thời hạn nộp */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h2 className="text-sm font-bold text-slate-900">Thời hạn nộp</h2>
              <button
                type="button"
                onClick={() => setSubmitModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Upload size={14} />
                <span>{filteredReports.length > 0 ? 'NỘP LẠI' : 'NỘP BÁO CÁO'}</span>
              </button>
            </div>
            <div className="text-[15px] font-extrabold text-slate-900">
              {reportDeadline}{' '}
              <span className="text-xs text-slate-400 font-normal">(GMT+07)</span>
            </div>
          </div>
          <div className="pt-4 mt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Đã nộp:{' '}
              <strong className="text-slate-800">{filteredReports.length} lần</strong>
            </span>
            <span>
              Lần nộp gần nhất:{' '}
              <strong className="text-slate-800">
                {filteredReports.length > 0 ? filteredReports[0].time : 'Chưa có'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. KHỐI LỊCH SỬ NỘP BÁO CÁO */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center font-bold">
              <Clock size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Lịch sử nộp báo cáo ({filteredReports.length} lần nộp)
              </h2>
            </div>
          </div>
          <div className="text-xs text-slate-400 italic">
            * Nhấp vào biểu tượng trạng thái để chuyển đổi test (Đã duyệt / Đã từ chối)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50/80 text-xs sm:text-[13px] font-bold text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5">Thời gian nộp</th>
                <th className="py-3.5 px-5">Tên tệp</th>
                <th className="py-3.5 px-5">Trạng thái</th>
                <th className="py-3.5 px-5">Kết quả kiểm tra trùng</th>
                <th className="py-3.5 px-5">Giáo viên hướng dẫn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 text-xs">
                    <FileX size={32} className="text-slate-300 mx-auto mb-2" />
                    Chưa có lần nộp báo cáo tiến độ nào trong học kỳ này.
                  </td>
                </tr>
              ) : (
                filteredReports.map((row) => {
                  const plagFile =
                    row.plagiarismFile || 'Bao-cao-do-an-2251060321.pdf'
                  const plagRate =
                    row.plagiarismRate ?? (row.status === 'Đã duyệt' ? 18 : 42)

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/70 transition border-b border-slate-100"
                    >
                      {/* 1. Thời gian nộp */}
                      <td className="py-3.5 px-5 text-sm font-normal text-slate-900 whitespace-nowrap">
                        {row.time}
                      </td>

                      {/* 2. Tên tệp */}
                      <td className="py-3.5 px-5 text-sm font-normal text-slate-900 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span
                            onClick={() =>
                              setPreviewState({ fileName: row.fileName, rate: plagRate })
                            }
                            className="hover:text-blue-600 font-medium cursor-pointer"
                          >
                            {row.fileName}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewState({ fileName: row.fileName, rate: plagRate })
                            }
                            className="p-0.5 rounded text-slate-500 hover:text-[#1565C0] hover:bg-blue-50 transition cursor-pointer"
                            title="Xem tệp"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>

                      {/* 3. Trạng thái */}
                      <td className="py-3.5 px-5 text-sm whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleReportStatus(row.id)}
                          title="Nhấp để chuyển đổi test trạng thái (Đã duyệt / Đã từ chối)"
                          className="cursor-pointer text-left"
                        >
                          {renderStatusBadge(row.status, row.approvedTime)}
                        </button>
                      </td>

                      {/* 4. Kết quả kiểm tra trùng */}
                      <td className="py-3.5 px-5 text-sm whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              onClick={() =>
                                setPreviewState({ fileName: plagFile, rate: plagRate })
                              }
                              className="font-medium text-slate-800 text-[13px] hover:text-[#1565C0] cursor-pointer"
                            >
                              {plagFile}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewState({ fileName: plagFile, rate: plagRate })
                              }
                              className="p-0.5 rounded text-slate-500 hover:text-[#1565C0] hover:bg-blue-50 transition cursor-pointer"
                              title="Xem tài liệu"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                          <span
                            className={`text-[12.5px] font-semibold ${
                              plagRate <= 35 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            Tỷ lệ: {plagRate}%
                          </span>
                        </div>
                      </td>

                      {/* 5. Giáo viên hướng dẫn */}
                      <td className="py-3.5 px-5 text-sm font-normal text-slate-700 max-w-[340px] leading-relaxed">
                        {row.note || '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SubmitReportModal
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onSubmitReport={handleSubmitReport}
      />

      <PlagiarismPreviewModal
        open={Boolean(previewState)}
        fileName={previewState?.fileName ?? ''}
        rate={previewState?.rate ?? 18}
        studentName={studentName}
        studentMssv={STUDENT_PROFILE_MOCK.mssv}
        topicTitle={STUDENT_PROFILE_MOCK.topic}
        onClose={() => setPreviewState(null)}
        onDownloadToast={(fName) => showToast(`Đang tải tệp: ${fName}`, 'success')}
      />
    </div>
  )
}
