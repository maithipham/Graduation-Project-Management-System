import { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileUp,
  FileX,
  Upload,
} from 'lucide-react'
import { useMyInfo } from '@/features/auth'
import { STUDENT_PROFILE_MOCK } from '@/shared/constants/studentProfile.mock'
import { getTermInfo, useStudentSemester } from '@/shared/contexts'
import { GvApproveModal } from '../components/GvApproveModal'
import { GvPlagiarismModal } from '../components/GvPlagiarismModal'
import { GvRejectModal } from '../components/GvRejectModal'
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

  // GVHD action modals state
  const [plagiarismModalItem, setPlagiarismModalItem] =
    useState<StudentReportSubmissionItem | null>(null)
  const [approveModalItem, setApproveModalItem] =
    useState<StudentReportSubmissionItem | null>(null)
  const [rejectModalItem, setRejectModalItem] =
    useState<StudentReportSubmissionItem | null>(null)

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

  // Khai báo global function cho window để tương thích với HTML onclick
  useEffect(() => {
    const win = window as unknown as {
      openSubmitReportModal?: () => void
      closeReportModal?: () => void
    }
    win.openSubmitReportModal = () => setSubmitModalOpen(true)
    win.closeReportModal = () => setSubmitModalOpen(false)

    return () => {
      delete win.openSubmitReportModal
      delete win.closeReportModal
    }
  }, [])

  const filteredReports = reportHistory.filter(
    (h) => h.year === term.year && h.semester === term.semester,
  )

  const termInfo = getTermInfo(term)
  const reportDeadline = termInfo.reportDeadline || '28/10/2026 23:59:55'

  const studentName = user?.name?.trim() || STUDENT_PROFILE_MOCK.name
  const studentMssv = STUDENT_PROFILE_MOCK.mssv
  const studentCohort = 'Khóa 63'
  const mentorName = STUDENT_PROFILE_MOCK.mentor
  const topicTitle = STUDENT_PROFILE_MOCK.topic

  // Submit report handler (Student)
  const handleSubmitReport = (file: File, customNote: string) => {
    const newItem: StudentReportSubmissionItem = {
      id: Date.now(),
      year: term.year,
      semester: term.semester,
      time: formatReportNow(),
      fileName: file.name,
      status: 'Chờ duyệt',
      plagiarismFile: `Bao-cao-do-an-${studentMssv}.pdf`,
      plagiarismRate: 18,
      note: customNote
        ? `Ghi chú SV: "${customNote}". (Đang chờ GVHD đánh giá)`
        : 'Đang chờ giáo viên hướng dẫn đánh giá và nhận xét.',
    }

    setReportHistory((prev) => [newItem, ...prev])
    setSubmitModalOpen(false)
    showToast('Nộp báo cáo tiến độ thành công! Vui lòng chờ giáo viên phản hồi.', 'success')
  }

  // Save Plagiarism Result (GVHD)
  const handleSavePlagiarism = (
    id: number,
    plagiarismFile: string,
    plagiarismRate: number,
  ) => {
    setReportHistory((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        return {
          ...row,
          plagiarismFile,
          plagiarismRate,
        }
      }),
    )
    showToast('Cập nhật kết quả kiểm tra trùng lặp thành công!', 'success')
  }

  // Approve Report (GVHD)
  const handleConfirmApprove = (id: number, comment: string) => {
    setReportHistory((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        return {
          ...row,
          status: 'Đã duyệt',
          approvedTime: formatReportNow(),
          note: comment,
        }
      }),
    )
    showToast('Đã xác nhận phê duyệt báo cáo đồ án thành công!', 'success')
  }

  // Reject Report (GVHD)
  const handleConfirmReject = (id: number, reason: string) => {
    setReportHistory((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        return {
          ...row,
          status: 'Đã từ chối',
          approvedTime: formatReportNow(),
          note: reason,
        }
      }),
    )
    showToast('Đã từ chối báo cáo đồ án. Yêu cầu sinh viên chỉnh sửa.', 'warning')
  }

  return (
    <div className="flex-1 px-4 sm:px-6 pt-4 pb-6 w-full max-w-full space-y-5 transition-all duration-200">
      {/* 1. Khối thông tin báo cáo: Thời hạn nộp & Nút Nộp báo cáo */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 items-center gap-4 sm:gap-0">
          {/* Cột 1: Thời hạn nộp */}
          <div className="flex items-center justify-center py-1 sm:py-0 sm:pr-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock className="w-4 h-4 text-[#1565C0] shrink-0" />
                <h2 className="text-xs font-bold text-slate-800">Thời hạn nộp</h2>
              </div>
              <div
                id="reportDeadlineText"
                className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug"
              >
                {reportDeadline}{' '}
                <span className="text-[11px] text-slate-400 font-normal">
                  (GMT+07)
                </span>
              </div>
              <div className="pt-2 text-xs text-slate-600">
                Giáo viên hướng dẫn:{' '}
                <strong className="text-slate-800 font-semibold">
                  {mentorName}
                </strong>
              </div>
            </div>
          </div>

          {/* Cột 2: Nút NỘP / NỘP LẠI (Tự động hiển thị NỘP nếu chưa có báo cáo, NỘP LẠI nếu đã nộp) */}
          <div className="flex items-center justify-center py-1 sm:py-0 sm:pl-4">
            <button
              type="button"
              id="btnOpenSubmitReportModal"
              onClick={() => setSubmitModalOpen(true)}
              className="h-9 px-5 rounded-lg border border-[#1565C0] text-[#1565C0] hover:bg-blue-50/70 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap uppercase tracking-wide"
            >
              <Upload className="w-4 h-4" />
              <span id="submitBtnLabel">
                {filteredReports.length > 0 ? 'NỘP LẠI' : 'NỘP BÁO CÁO'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KHỐI LỊCH SỬ NỘP BÁO CÁO */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#1565C0]" />
          <h2
            className="text-xs sm:text-[13px] font-bold text-slate-900"
            id="historyTableTitle"
          >
            Lịch sử nộp báo cáo
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-[13px] text-slate-600 border-collapse">
            <thead className="bg-slate-50/70 text-[12px] font-bold text-slate-700 border-b border-slate-100">
              <tr>
                <th className="py-3 px-5 font-semibold text-slate-700">
                  Thời gian nộp
                </th>
                <th className="py-3 px-5 font-semibold text-slate-700">
                  Tên tệp
                </th>
                <th className="py-3 px-5 font-semibold text-slate-700">
                  Trạng thái
                </th>
                <th className="py-3 px-5 font-semibold text-slate-700">
                  Kết quả kiểm tra trùng
                </th>
              </tr>
            </thead>
            <tbody
              id="reportHistoryTableBody"
              className="divide-y divide-slate-100 bg-white"
            >
              {filteredReports.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-10 text-center text-slate-400 text-xs"
                  >
                    <FileX size={32} className="text-slate-300 mx-auto mb-2" />
                    Chưa có lần nộp báo cáo tiến độ nào trong học kỳ này.
                  </td>
                </tr>
              ) : (
                filteredReports.map((row) => {
                  const plagFile =
                    row.plagiarismFile || `Bao-cao-do-an-${studentMssv}.pdf`
                  const plagRate =
                    row.plagiarismRate ?? (row.status === 'Đã duyệt' ? 18 : 42)
                  const isPassing = plagRate <= 35

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/70 transition border-b border-slate-100"
                    >
                      {/* 1. Thời gian nộp */}
                      <td className="py-3.5 px-5 text-slate-900 font-medium whitespace-nowrap">
                        {row.time}
                      </td>

                      {/* 2. Tên tệp */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span
                            onClick={() =>
                              setPreviewState({
                                fileName: row.fileName,
                                rate: plagRate,
                              })
                            }
                            className="hover:text-blue-600 font-medium text-slate-800 cursor-pointer"
                            title="Xem tệp báo cáo"
                          >
                            {row.fileName}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewState({
                                fileName: row.fileName,
                                rate: plagRate,
                              })
                            }
                            className="p-0.5 rounded text-slate-400 hover:text-[#1565C0] hover:bg-blue-50 transition cursor-pointer"
                            title="Xem tệp"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* 3. Trạng thái */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          {row.status === 'Đã duyệt' && (
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                                Đã duyệt
                              </span>
                              {row.approvedTime && (
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {row.approvedTime}
                                </span>
                              )}
                            </div>
                          )}

                          {row.status === 'Đã từ chối' && (
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
                                Đã từ chối
                              </span>
                              {row.approvedTime && (
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {row.approvedTime}
                                </span>
                              )}
                            </div>
                          )}

                          {row.status === 'Chờ duyệt' && (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                              Chờ duyệt
                            </span>
                          )}

                          {/* Tiện ích chuyển đổi / duyệt báo cáo cho GVHD / Tester */}
                          <div className="flex items-center gap-1.5 pt-0.5 text-[11px]">
                            <button
                              type="button"
                              onClick={() => setApproveModalItem(row)}
                              className="font-medium text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                              title="Duyệt báo cáo đồ án"
                            >
                              Duyệt (GVHD)
                            </button>
                            <span className="text-slate-300">·</span>
                            <button
                              type="button"
                              onClick={() => setRejectModalItem(row)}
                              className="font-medium text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                              title="Từ chối báo cáo đồ án"
                            >
                              Từ chối
                            </button>
                          </div>

                          {row.note && (
                            <div
                              className="text-[11px] text-slate-500 max-w-[240px] truncate"
                              title={row.note}
                            >
                              {row.note}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. Kết quả kiểm tra trùng */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              onClick={() =>
                                setPreviewState({
                                  fileName: plagFile,
                                  rate: plagRate,
                                })
                              }
                              className="font-medium text-slate-800 text-xs sm:text-[13px] hover:text-[#1565C0] cursor-pointer"
                              title="Xem kết quả chi tiết"
                            >
                              {plagFile}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewState({
                                  fileName: plagFile,
                                  rate: plagRate,
                                })
                              }
                              className="p-0.5 rounded text-slate-400 hover:text-[#1565C0] hover:bg-blue-50 transition cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>

                          <span
                            className={`text-[12px] font-semibold ${
                              isPassing ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            Tỷ lệ: {plagRate}% (
                            {isPassing ? 'Hợp lệ ≤ 35%' : 'Vượt ngưỡng > 35%'})
                          </span>

                          <button
                            type="button"
                            onClick={() => setPlagiarismModalItem(row)}
                            className="text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer mt-0.5"
                          >
                            <FileUp className="w-3.5 h-3.5" />
                            <span>Cập nhật kết quả (GVHD)</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Report Modal */}
      <SubmitReportModal
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onSubmitReport={handleSubmitReport}
      />

      {/* GVHD Plagiarism Modal */}
      <GvPlagiarismModal
        open={Boolean(plagiarismModalItem)}
        item={plagiarismModalItem}
        studentName={studentName}
        studentMssv={studentMssv}
        cohort={studentCohort}
        topicTitle={topicTitle}
        onClose={() => setPlagiarismModalItem(null)}
        onSave={handleSavePlagiarism}
      />

      {/* GVHD Approve Modal */}
      <GvApproveModal
        open={Boolean(approveModalItem)}
        item={approveModalItem}
        studentName={studentName}
        studentMssv={studentMssv}
        onClose={() => setApproveModalItem(null)}
        onConfirmApprove={handleConfirmApprove}
      />

      {/* GVHD Reject Modal */}
      <GvRejectModal
        open={Boolean(rejectModalItem)}
        item={rejectModalItem}
        studentName={studentName}
        studentMssv={studentMssv}
        onClose={() => setRejectModalItem(null)}
        onConfirmReject={handleConfirmReject}
      />

      {/* Plagiarism Document Preview Modal */}
      <PlagiarismPreviewModal
        open={Boolean(previewState)}
        fileName={previewState?.fileName ?? ''}
        rate={previewState?.rate ?? 18}
        studentName={studentName}
        studentMssv={studentMssv}
        topicTitle={topicTitle}
        onClose={() => setPreviewState(null)}
        onDownloadToast={(fName) =>
          showToast(`Đang tải tệp: ${fName}`, 'success')
        }
      />

      {/* Toast Notification Wrapper */}
      <div
        id="toastWrap"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
      >
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
    </div>
  )
}
