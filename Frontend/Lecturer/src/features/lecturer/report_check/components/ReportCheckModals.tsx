import React, { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  FileUp,
  Minus,
  Plus,
  Printer,
  UploadCloud,
  X,
} from 'lucide-react'
import type { ReportCheckItem, ReportSubmissionHistoryEntry } from '../types/reportCheck.types'

// ==========================================
// 1. MODAL CẬP NHẬT KẾT QUẢ KIỂM TRA TRÙNG LẶP
// ==========================================
interface PlagiarismUploadModalProps {
  item: ReportCheckItem | null
  onClose: () => void
  onSave: (id: string, fileName: string, rate: number) => void
}

export const PlagiarismUploadModal: React.FC<PlagiarismUploadModalProps> = ({
  item,
  onClose,
  onSave,
}) => {
  const [, setSelectedFile] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [rate, setRate] = useState<string>('15')
  const [rateError, setRateError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (item) {
      setRate(
        item.plagiarismRate !== null && item.plagiarismRate !== undefined
          ? String(item.plagiarismRate)
          : '15',
      )
      setSelectedFileName(item.plagiarismFile || '')
      setSelectedFile(null)
      setRateError('')
      setIsDragging(false)
    }
  }, [item])

  if (!item) return null

  const handleFileChange = (file?: File) => {
    if (!file) return
    setSelectedFile(file)
    setSelectedFileName(file.name)

    // Tự động nhận diện tỷ lệ trùng lặp ngẫu nhiên hợp lệ hoặc theo tên file nếu có
    const match = file.name.match(/(\d{1,2})%/)
    if (match) {
      setRate(match[1])
    }
    setRateError('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileChange(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedRate = Number(rate)
    if (rate.trim() === '' || Number.isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
      setRateError('Vui lòng nhập tỷ lệ trùng lặp hợp lệ từ 0% đến 100%.')
      return
    }

    const finalFileName =
      selectedFileName || item.plagiarismFile || `Ket-qua-Turnitin-${item.mssv}.pdf`

    onSave(item.id, finalFileName, parsedRate)
  }

  const canSave = Boolean(selectedFileName || item.plagiarismFile)

  return (
    <div
      id="plagiarismModal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[530px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
            <FileUp className="w-4 h-4 text-blue-600" /> Cập nhật kết quả kiểm tra trùng lặp
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form noValidate onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 text-[13px] max-h-[85vh] overflow-y-auto">
            {/* Thông tin sinh viên & đề tài */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-200/80">
                <div>
                  <div className="text-[11.5px] text-slate-500 font-medium">Sinh viên</div>
                  <div id="plagiarismStudentName" className="text-slate-900 font-bold text-[13px] mt-0.5">
                    {item.name}
                  </div>
                </div>
                <div>
                  <div className="text-[11.5px] text-slate-500 font-medium">Mã sinh viên</div>
                  <div id="plagiarismStudentMssv" className="font-mono font-bold text-slate-800 text-[13px] mt-0.5">
                    {item.mssv}
                  </div>
                </div>
                <div>
                  <div className="text-[11.5px] text-slate-500 font-medium">Khóa</div>
                  <div id="plagiarismStudentCohort" className="font-bold text-slate-800 text-[13px] mt-0.5">
                    {item.cohort || 'K64'}
                  </div>
                </div>
              </div>
              <div className="text-[12px] text-slate-600">
                <span className="text-slate-500">Đề tài:</span>{' '}
                <span id="plagiarismTopicName" className="font-medium text-slate-800">
                  {item.topic}
                </span>
              </div>
            </div>

            {/* Khu vực Tải lên file kết quả */}
            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold text-[13px] mb-1.5">
                  Tải lên file kết quả Turnitin / DoIT (.pdf, .txt, .docx):{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <div
                  id="plagiarismDropZone"
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition cursor-pointer ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/40'
                      : 'border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/20'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="plagiarismFileInput"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                  />
                  <div id="plagiarismFileInputLabel" className="cursor-pointer flex flex-col items-center">
                    <UploadCloud id="plagiarismUploadIcon" className="w-8 h-8 text-blue-600 mb-1" />
                    <span id="plagiarismFileChosenName" className="text-slate-700 font-medium text-xs">
                      {selectedFileName ? (
                        <span className="font-bold text-blue-700 break-all">{selectedFileName}</span>
                      ) : (
                        'Bấm hoặc kéo thả file kết quả vào đây'
                      )}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5" id="plagiarismFileSubtext">
                      Hỗ trợ file .pdf, .docx, .txt (Tối đa 15MB)
                    </span>
                  </div>
                </div>
              </div>

              {/* Box kết quả kiểm tra & đối soát thông tin file */}
              {selectedFileName && (
                <div
                  id="fileVerificationBox"
                  className="p-3.5 rounded-xl border text-[12.5px] transition-all duration-200 bg-emerald-50/80 border-emerald-200 text-emerald-900 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-emerald-950">Đối soát thông tin thành công:</div>
                    <div className="text-[12px] leading-relaxed text-emerald-800">
                      Tệp: <b className="font-mono text-emerald-900">{selectedFileName}</b> • Mã sinh viên khớp:{' '}
                      <b className="font-mono">{item.mssv}</b>
                    </div>
                  </div>
                </div>
              )}

              {/* Tỷ lệ trùng lặp */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Tỷ lệ trùng lặp (%): <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="plagiarismRateInput"
                    min={0}
                    max={100}
                    value={rate}
                    onChange={(e) => {
                      setRate(e.target.value)
                      if (rateError) setRateError('')
                    }}
                    className={`w-full h-10 px-3 pr-8 border rounded-xl text-[13.5px] font-bold outline-none transition ${
                      rateError
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-300 focus:border-blue-500'
                    }`}
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                </div>
                {rateError ? (
                  <p className="text-[11.5px] text-rose-500 font-semibold mt-1">{rateError}</p>
                ) : (
                  <p className="text-[11.5px] text-slate-500 mt-1">
                    Quy định chuẩn: &le; 35% là đạt yêu cầu để bảo vệ đồ án.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="modal-close-btn h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              id="btnSavePlagiarism"
              disabled={!canSave}
              className={`h-8 px-4 rounded-lg text-[12px] font-bold transition shadow-xs ${
                canSave
                  ? 'bg-[#1565C0] hover:bg-[#0D47A1] text-white cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              Lưu kết quả
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==========================================
// 2. MODAL XÁC NHẬN PHÊ DUYỆT BÁO CÁO
// ==========================================
interface ApproveReportModalProps {
  item: ReportCheckItem | null
  onClose: () => void
  onConfirm: (id: string, comment?: string) => void
}

export const ApproveReportModal: React.FC<ApproveReportModalProps> = ({
  item,
  onClose,
  onConfirm,
}) => {
  const [comment, setComment] = useState('')

  useEffect(() => {
    setComment('')
  }, [item])

  if (!item) return null

  const handleConfirm = () => {
    onConfirm(item.id, comment)
  }

  const rateDisplay =
    item.plagiarismRate !== null && item.plagiarismRate !== undefined
      ? `${item.plagiarismRate}%`
      : 'Chưa kiểm tra'

  return (
    <div
      id="approveModal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50/50">
          <h3 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Xác nhận phê duyệt báo cáo đồ án
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-[13px]">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Sinh viên:</span>
              <b id="approveStudentName" className="text-slate-900">
                {item.name}
              </b>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Mã sinh viên:</span>
              <span id="approveStudentMssv" className="font-mono font-bold text-slate-800">
                {item.mssv}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Tỷ lệ trùng lặp:</span>
              <span
                id="approvePlagiarismRate"
                className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-xs"
              >
                {rateDisplay}
              </span>
            </div>
            <div className="pt-1 border-t border-slate-200 text-slate-600 line-clamp-2">
              <span className="text-slate-500">Đề tài:</span>{' '}
              <span id="approveTopicName" className="font-medium text-slate-800">
                {item.topic}
              </span>
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed">
            Bạn có chắc chắn muốn <b>phê duyệt</b> báo cáo đồ án của sinh viên này? Sau khi duyệt,
            sinh viên sẽ đủ điều kiện chuyển sang bước đánh giá và đề xuất hội đồng bảo vệ.
          </p>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Ghi chú / Nhận xét phê duyệt (tùy chọn):
            </label>
            <textarea
              id="approveCommentInput"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ví dụ: Báo cáo đạt chất lượng tốt, trình bày đúng quy định..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] outline-none focus:border-emerald-500 focus:bg-white transition resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn h-8.5 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            id="btnConfirmApprove"
            onClick={handleConfirm}
            className="h-8.5 px-4.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Xác nhận duyệt
          </button>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 3. MODAL XÁC NHẬN TỪ CHỐI BÁO CÁO
// ==========================================
interface RejectReportModalProps {
  item: ReportCheckItem | null
  onClose: () => void
  onConfirm: (id: string, comment?: string) => void
}

export const RejectReportModal: React.FC<RejectReportModalProps> = ({
  item,
  onClose,
  onConfirm,
}) => {
  const [comment, setComment] = useState('')

  useEffect(() => {
    setComment('')
  }, [item])

  if (!item) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(item.id, comment)
  }

  return (
    <div
      id="rejectModal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form
        noValidate
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl w-full max-w-[480px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-slate-900">Xác nhận từ chối báo cáo đồ án</h3>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-[13px]">
          <p className="text-slate-600">
            Xác nhận từ chối báo cáo của sinh viên{' '}
            <b id="rejectStudentName" className="text-slate-900">
              {item.name}
            </b>
            ?
          </p>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Nhận xét lý do chưa đạt:
            </label>
            <textarea
              id="rejectCommentInput"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Nêu rõ các lỗi trình bày, tỷ lệ trùng lặp cao hoặc nội dung chưa hoàn thiện..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] outline-none focus:border-rose-500 focus:bg-white transition resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            id="btnConfirmReject"
            className="h-8 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold transition cursor-pointer shadow-xs"
          >
            Xác nhận
          </button>
        </div>
      </form>
    </div>
  )
}

// ==========================================
// 4. MODAL XEM LỊCH SỬ NỘP BÁO CÁO
// ==========================================
interface ReportHistoryModalProps {
  item: ReportCheckItem | null
  onClose: () => void
}

export const ReportHistoryModal: React.FC<ReportHistoryModalProps> = ({ item, onClose }) => {
  if (!item) return null

  const historyEntries: ReportSubmissionHistoryEntry[] =
    item.history && item.history.length > 0
      ? item.history
      : item.reportFileName
      ? [
          {
            submitIndex: 1,
            submittedDate: item.reportSubmittedAt,
            fileName: item.reportFileName,
            status:
              item.status === 'approved'
                ? 'Đã duyệt'
                : item.status === 'rejected'
                ? 'Từ chối'
                : 'Chờ duyệt',
            processedAt: item.approvedAt || item.rejectedAt,
            note: item.comment || 'Nộp bản báo cáo hoàn thiện.',
          },
        ]
      : []

  return (
    <div
      id="reportHistoryModal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900" id="histReportStudentName">
              Lịch sử nộp báo cáo — {item.name} ({item.mssv})
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-1" id="histReportTopicName">
              Đề tài: {item.topic}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {historyEntries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs italic">
              Chưa có lịch sử nộp báo cáo nào từ sinh viên này.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[12.5px]">
                <thead className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-20 text-center">LẦN NỘP</th>
                    <th className="px-4 py-3 w-44">THỜI GIAN NỘP</th>
                    <th className="px-4 py-3 min-w-[200px]">FILE BÁO CÁO</th>
                    <th className="px-4 py-3 w-40 text-center">TRẠNG THÁI</th>
                    <th className="px-4 py-3 min-w-[260px]">GHI CHÚ / LÝ DO TỪ CHỐI</th>
                  </tr>
                </thead>
                <tbody id="histReportTableBody" className="divide-y divide-slate-100 bg-white">
                  {historyEntries.map((hist, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-center font-bold text-slate-700">
                        Lần {hist.submitIndex || idx + 1}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{hist.submittedDate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-semibold text-blue-700">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>{hist.fileName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            hist.status.includes('Duyệt') || hist.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : hist.status.includes('Từ chối') || hist.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {hist.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {hist.note || <span className="text-slate-400 italic">Không có ghi chú</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

// ====================================================================
// 5. GOOGLE CLASSROOM / DRIVE STYLE FULLSCREEN REPORT PREVIEW MODAL
// ====================================================================
interface ReportClassroomPreviewModalProps {
  item: ReportCheckItem | null
  onClose: () => void
  onOpenPlagiarism: (item: ReportCheckItem) => void
  onDownloadReport: (item: ReportCheckItem) => void
}

const TOTAL_PAGES = 3

export const ReportClassroomPreviewModal: React.FC<ReportClassroomPreviewModalProps> = ({
  item,
  onClose,
  onOpenPlagiarism,
  onDownloadReport,
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [hasDownloaded, setHasDownloaded] = useState(false)
  const [prevItemId, setPrevItemId] = useState<string | null>(item?.id ?? null)

  if ((item?.id ?? null) !== prevItemId) {
    setPrevItemId(item?.id ?? null)
    setCurrentPage(1)
    setZoom(100)
    setHasDownloaded(Boolean(item?.hasDownloaded))
  }

  const scrollAreaRef = useRef<HTMLElement>(null)
  const page1Ref = useRef<HTMLElement>(null)
  const page2Ref = useRef<HTMLElement>(null)
  const page3Ref = useRef<HTMLElement>(null)

  const goToPage = (pageNum: number) => {
    const next = Math.max(1, Math.min(TOTAL_PAGES, Number(pageNum) || 1))
    setCurrentPage(next)
    const refMap = { 1: page1Ref, 2: page2Ref, 3: page3Ref } as const
    refMap[next as 1 | 2 | 3]?.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  useEffect(() => {
    if (!item) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        setCurrentPage((prev) => {
          const next = Math.max(1, prev - 1)
          const refMap = { 1: page1Ref, 2: page2Ref, 3: page3Ref } as const
          refMap[next as 1 | 2 | 3]?.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
          return next
        })
      } else if (e.key === 'ArrowRight') {
        setCurrentPage((prev) => {
          const next = Math.min(TOTAL_PAGES, prev + 1)
          const refMap = { 1: page1Ref, 2: page2Ref, 3: page3Ref } as const
          refMap[next as 1 | 2 | 3]?.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
          return next
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [item, onClose])

  if (!item) return null

  const handleDownload = () => {
    setHasDownloaded(true)
    onDownloadReport(item)
  }

  const docTitle = item.reportFileName || `Bao-cao-${item.name}.pdf`
  const topicTitle =
    item.topic || 'Hệ thống cảnh báo ngập lụt đô thị thông minh dựa trên IoT & dữ liệu thủy văn'

  const needsPlagiarism = !item.plagiarismFile && item.status !== 'approved'

  return (
    <div
      id="fullReportPreviewModal"
      className="fixed inset-0 z-50 bg-[#202124] flex flex-col select-none overflow-hidden animate-in fade-in duration-200"
    >
      {/* Top Bar Toolbar (Dark theme like Google Classroom / Drive Previewer) */}
      <header className="h-14 sm:h-16 bg-[#202124] border-b border-[#3c4043] flex items-center justify-between px-3 sm:px-6 shrink-0 z-30 shadow-md">
        {/* Left: File Badge & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2 py-0.5 rounded bg-[#EA4335] text-white text-[11px] font-extrabold tracking-wider shrink-0 shadow-xs">
              PDF
            </span>
            <div className="min-w-0">
              <h2
                id="reportPreviewDocTitle"
                className="text-white text-[13.5px] sm:text-[14.5px] font-bold truncate tracking-wide max-w-[200px] sm:max-w-[420px]"
                title={docTitle}
              >
                {docTitle}
              </h2>
              <div className="hidden md:flex items-center gap-4 text-[11.5px] text-slate-400 mt-0.5 font-medium">
                <span className="hover:text-white cursor-pointer transition">Tệp</span>
                <span className="hover:text-white cursor-pointer transition">Xem</span>
                <span className="hover:text-white cursor-pointer transition">Công cụ</span>
                <span className="hover:text-white cursor-pointer transition">Trợ giúp</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Pagination & Zoom Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-white text-xs shrink-0">
          <span className="hidden sm:inline text-slate-400">Trang</span>
          <input
            id="reportPreviewPageInput"
            type="number"
            min={1}
            max={TOTAL_PAGES}
            value={currentPage}
            onChange={(e) => goToPage(Number(e.target.value))}
            className="w-10 h-7 bg-[#303134] border border-[#5f6368] rounded text-center text-xs font-bold text-white outline-none focus:border-blue-400 transition"
          />
          <span className="text-slate-400">
            / <span id="reportPreviewTotalPages" className="text-slate-300 font-bold">{TOTAL_PAGES}</span>
          </span>

          <div className="h-4 w-px bg-[#5f6368] mx-1 sm:mx-2" />

          <button
            type="button"
            id="btnReportPreviewPrint"
            onClick={() => window.print()}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
            title="In tài liệu"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="btnReportZoomOut"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
            title="Thu nhỏ"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span id="reportPreviewZoomLabel" className="text-[11.5px] font-bold text-slate-300 w-12 text-center font-mono">
            {zoom}%
          </span>
          <button
            type="button"
            id="btnReportZoomIn"
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
            title="Phóng to"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions & Close */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Nút Nộp kết quả đạo văn */}
          {needsPlagiarism && (
            <button
              type="button"
              id="btnReportPreviewSubmitPlag"
              onClick={() => {
                onOpenPlagiarism(item)
              }}
              className="inline-flex h-8.5 px-3 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold shadow-xs items-center gap-1.5 transition cursor-pointer"
              title="Nộp file kết quả kiểm tra đạo văn cho sinh viên này"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nộp kết quả đạo văn</span>
            </button>
          )}

          <button
            type="button"
            id="btnReportPreviewDownload"
            onClick={handleDownload}
            className="w-8 sm:w-9 h-8 sm:h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
            title="Tải xuống tài liệu"
          >
            <Download className="w-4.5 h-4.5" />
          </button>

          <button
            type="button"
            id="btnCloseReportPreview"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer ml-0.5"
            title="Đóng xem trước (Phím Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Viewer Body: Thumbnails on Left + Main Canvas on Right */}
      <div className="flex flex-1 overflow-hidden relative bg-[#3c4043]">
        {/* Left Thumbnail Drawer */}
        <aside className="w-40 sm:w-56 bg-[#282a2d] border-r border-[#3c4043] p-3 overflow-y-auto shrink-0 flex flex-col gap-3 select-none">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1" id="reportPreviewSideTitle">
            Các trang báo cáo
          </div>

          {/* Thumbnail Page 1 */}
          <div
            id="reportThumbPage1"
            data-page="1"
            onClick={() => goToPage(1)}
            className={`thumb-card p-2 rounded-xl border-2 cursor-pointer transition ${
              currentPage === 1
                ? 'border-blue-500 bg-[#3c4043]/80'
                : 'border-transparent hover:border-slate-500 bg-[#303134] hover:bg-[#3c4043]'
            }`}
          >
            <div className="text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
              <span>Trang 1</span>
              <span className={`text-[10px] font-semibold ${currentPage === 1 ? 'text-blue-400' : 'text-slate-400'}`} id="thumbPage1Sub">
                Bìa & Đặt vấn đề
              </span>
            </div>
            <div className="w-full h-32 bg-white rounded shadow-xs p-2 text-[6px] text-slate-400 overflow-hidden leading-tight flex flex-col items-center">
              <div className="font-bold text-slate-800 text-[6.5px] uppercase text-center">ĐH THỦY LỢI - KHOA CNTT</div>
              <div className="font-bold text-blue-800 text-[7px] uppercase mt-2 text-center" id="thumbPage1DocType">
                BÁO CÁO ĐỒ ÁN TỐT NGHIỆP
              </div>
              <div className="w-16 h-0.5 bg-slate-300 my-1" />
              <div className="w-full space-y-1 mt-2 text-slate-500">
                <div className="h-1 bg-slate-200 rounded w-full" />
                <div className="h-1 bg-slate-200 rounded w-5/6" />
                <div className="h-1 bg-slate-200 rounded w-4/6" />
              </div>
            </div>
          </div>

          {/* Thumbnail Page 2 */}
          <div
            id="reportThumbPage2"
            data-page="2"
            onClick={() => goToPage(2)}
            className={`thumb-card p-2 rounded-xl border-2 cursor-pointer transition ${
              currentPage === 2
                ? 'border-blue-500 bg-[#3c4043]/80'
                : 'border-transparent hover:border-slate-500 bg-[#303134] hover:bg-[#3c4043]'
            }`}
          >
            <div className="text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
              <span>Trang 2</span>
              <span className={`text-[10px] font-semibold ${currentPage === 2 ? 'text-blue-400' : 'text-slate-400'}`} id="thumbPage2Sub">
                Kiến trúc & Công nghệ
              </span>
            </div>
            <div className="w-full h-32 bg-white rounded shadow-xs p-2 text-[6px] text-slate-400 overflow-hidden leading-tight">
              <div className="font-bold text-slate-800 text-[6.5px]" id="thumbPage2Heading">
                II. PHƯƠNG PHÁP & CÔNG NGHỆ
              </div>
              <div className="w-full h-10 border border-dashed border-slate-300 rounded my-1.5 flex items-center justify-center text-[7px] text-slate-400 font-mono">
                [Architecture Diagram]
              </div>
              <div className="space-y-1">
                <div className="h-1 bg-slate-200 rounded w-full" />
                <div className="h-1 bg-slate-200 rounded w-full" />
                <div className="h-1 bg-slate-200 rounded w-3/4" />
              </div>
            </div>
          </div>

          {/* Thumbnail Page 3 */}
          <div
            id="reportThumbPage3"
            data-page="3"
            onClick={() => goToPage(3)}
            className={`thumb-card p-2 rounded-xl border-2 cursor-pointer transition ${
              currentPage === 3
                ? 'border-blue-500 bg-[#3c4043]/80'
                : 'border-transparent hover:border-slate-500 bg-[#303134] hover:bg-[#3c4043]'
            }`}
          >
            <div className="text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
              <span>Trang 3</span>
              <span className={`text-[10px] font-semibold ${currentPage === 3 ? 'text-blue-400' : 'text-slate-400'}`} id="thumbPage3Sub">
                Kế hoạch & Ký tên
              </span>
            </div>
            <div className="w-full h-32 bg-white rounded shadow-xs p-2 text-[6px] text-slate-400 overflow-hidden leading-tight">
              <div className="font-bold text-slate-800 text-[6.5px]" id="thumbPage3Heading">
                III. KẾT QUẢ & ĐÁNH GIÁ
              </div>
              <div className="w-full space-y-1 my-1">
                <div className="h-1.5 bg-blue-100 rounded w-full" />
                <div className="h-1.5 bg-blue-100 rounded w-full" />
                <div className="h-1.5 bg-blue-100 rounded w-full" />
              </div>
              <div className="flex justify-between items-end mt-4 pt-2 border-t border-slate-200">
                <div className="text-[5.5px] font-bold text-slate-600">SINH VIÊN KÝ</div>
                <div className="text-[5.5px] font-bold text-slate-600">GVHD KÝ</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Document Viewing Canvas */}
        <main
          ref={scrollAreaRef}
          id="reportPreviewCanvasScrollArea"
          className="flex-1 overflow-y-auto p-4 sm:p-10 flex flex-col items-center justify-start relative select-text"
        >
          {/* MESSAGE BANNER KHI BẮT BUỘC DOWNLOAD BÁO CÁO ĐỂ NỘP FILE KẾT QUẢ */}
          {!hasDownloaded && needsPlagiarism && (
            <div
              id="previewDownloadRequiredBanner"
              className="mb-6 w-full max-w-[780px] p-4 rounded-2xl bg-amber-500 text-slate-900 shadow-2xl flex items-center justify-between gap-4 border-2 border-amber-300 animate-in fade-in slide-in-from-top-4 duration-300 sticky top-0 z-20 backdrop-blur-md"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm" id="bannerNoticeIcon">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-[13.5px] text-slate-950" id="bannerNoticeTitle">
                    Bạn phải download (tải về máy) báo cáo để nộp file kết quả kiểm tra trùng lặp
                  </div>
                  <div className="text-xs text-slate-900/90 mt-0.5" id="bannerNoticeDesc">
                    Vui lòng bấm nút <b>"Tải báo cáo về máy"</b> bên cạnh để lấy file chạy phần mềm Turnitin / DoIT.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0" id="bannerActionArea">
                <button
                  type="button"
                  id="btnBannerDownloadReport"
                  onClick={handleDownload}
                  className="h-9 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-[12.5px] font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer animate-bounce"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Tải báo cáo về máy</span>
                </button>
              </div>
            </div>
          )}

          {/* Floating Navigation Arrows */}
          <button
            type="button"
            id="btnReportPrevPage"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="fixed left-48 sm:left-64 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#202124]/90 hover:bg-[#303134] text-white shadow-2xl flex items-center justify-center transition cursor-pointer z-20 backdrop-blur-xs border border-white/15 disabled:opacity-30 disabled:pointer-events-none"
            title="Trang trước (Phím Mũi tên Trái)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            id="btnReportNextPage"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= TOTAL_PAGES}
            className="fixed right-6 sm:right-10 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#202124]/90 hover:bg-[#303134] text-white shadow-2xl flex items-center justify-center transition cursor-pointer z-20 backdrop-blur-xs border border-white/15 disabled:opacity-30 disabled:pointer-events-none"
            title="Trang sau (Phím Mũi tên Phải)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Document Paper Canvas Wrapper */}
          <div
            id="reportPreviewPaperWrapper"
            className="transition-transform duration-200 origin-top"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            {/* ================= PAGE 1 ================= */}
            <article
              ref={page1Ref}
              id="reportPreviewPage1"
              className="w-[780px] min-h-[1100px] bg-white text-slate-800 shadow-2xl rounded-xs p-12 sm:p-16 mb-10 transition-all font-serif"
            >
              {/* Header Trường & Khoa */}
              <div className="text-center space-y-1 pb-6 border-b-2 border-slate-900">
                <div className="text-[13px] font-bold uppercase tracking-wider text-slate-900">
                  BỘ GIÁO DỤC VÀ ĐÀO TẠO — TRƯỜNG ĐẠI HỌC THỦY LỢI
                </div>
                <div className="text-[14px] font-extrabold uppercase tracking-wide text-blue-900">
                  KHOA CÔNG NGHỆ THÔNG TIN — BỘ MÔN KỸ THUẬT PHẦN MỀM
                </div>
                <div className="w-24 h-0.5 bg-slate-900 mx-auto my-2" />
              </div>

              {/* Title Báo cáo */}
              <div className="text-center my-8 space-y-2">
                <h1 className="text-[20px] font-black uppercase text-slate-900 tracking-wide" id="reportPreviewDocTypeHeading">
                  BÁO CÁO ĐỒ ÁN TỐT NGHIỆP
                </h1>
                <p className="text-[13.5px] italic text-slate-600 font-sans">
                  Chương trình đào tạo Kỹ sư / Cử nhân Công nghệ Thông tin ({item.cohort || 'Khóa 64'})
                </p>
              </div>

              {/* Box Thông tin đề tài & Sinh viên */}
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-5 my-6 space-y-3 font-sans text-[13px]">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-700 min-w-[150px] shrink-0">1. Tên đề tài đồ án:</span>
                  <span className="font-bold text-blue-900 text-[14px] leading-snug report-topic-name">
                    {topicTitle}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 min-w-[150px] shrink-0">2. Sinh viên thực hiện:</span>
                  <span className="font-bold text-slate-900 report-student-name">{item.name}</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span>
                    MSSV: <b className="font-mono text-slate-800 report-student-mssv">{item.mssv}</b>
                  </span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span>
                    Lớp: <b className="text-slate-800 report-student-class">{item.studentClass || '64CNPM1'}</b>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 min-w-[150px] shrink-0">3. Cán bộ hướng dẫn:</span>
                  <span className="font-semibold text-slate-800">TS. Trần Mai Anh</span>
                  <span className="text-slate-500 text-xs">(Khoa CNTT - ĐH Thủy Lợi)</span>
                </div>
              </div>

              {/* I. ĐẶT VẤN ĐỀ VÀ MỤC TIÊU */}
              <div className="space-y-4 my-6 font-sans">
                <h2 className="text-[14.5px] font-bold uppercase text-slate-900 border-b border-slate-200 pb-1 flex items-center justify-between">
                  <span>I. ĐẶT VẤN ĐỀ VÀ MỤC TIÊU ĐỒ ÁN</span>
                  <span className="text-xs font-normal text-slate-400 capitalize">Chương 1</span>
                </h2>
                <p className="text-[13px] text-slate-700 text-justify leading-relaxed">
                  Đề tài <b className="report-topic-name">"{topicTitle}"</b> hướng đến việc xây dựng mô hình thu thập dữ liệu
                  cảm biến thời gian thực, kết hợp các thuật toán học máy phân tích dự báo mực nước ngập nhằm đưa ra cảnh
                  báo sớm cho người dân và cơ quan quản lý đô thị.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[13px] text-slate-700 text-justify leading-relaxed">
                  <li>
                    <b>Mục tiêu tổng quát:</b> Thiết kế, xây dựng và đánh giá thực nghiệm một hệ thống cảnh báo ngập lụt
                    thông minh có khả năng mở rộng và độ chính xác cao.
                  </li>
                  <li>
                    <b>Mục tiêu cụ thể:</b> Xây dựng mạng lưới cảm biến IoT, mô hình phân tích dự báo thủy văn và giao
                    diện web tương tác thời gian thực.
                  </li>
                  <li>
                    <b>Phạm vi nghiên cứu:</b> Áp dụng thử nghiệm trên tập dữ liệu tại các điểm ngập úng trọng điểm khu
                    vực Hà Nội.
                  </li>
                </ul>
              </div>

              <div className="text-center pt-8 text-[11px] text-slate-400 font-sans">— Trang 1 / 3 —</div>
            </article>

            {/* ================= PAGE 2 ================= */}
            <article
              ref={page2Ref}
              id="reportPreviewPage2"
              className="w-[780px] min-h-[1100px] bg-white text-slate-800 shadow-2xl rounded-xs p-12 sm:p-16 mb-10 transition-all font-sans"
            >
              {/* Header Trang 2 */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-200 pb-2 mb-6">
                <span>BÁO CÁO ĐỒ ÁN TỐT NGHIỆP — ĐẠI HỌC THỦY LỢI</span>
                <span className="report-student-name">{item.name}</span>
              </div>

              {/* II. PHƯƠNG PHÁP & CÔNG NGHỆ */}
              <div className="space-y-4 my-6">
                <h2 className="text-[14.5px] font-bold uppercase text-slate-900 border-b border-slate-200 pb-1">
                  II. PHƯƠNG PHÁP TIẾP CẬN VÀ CÔNG NGHỆ SỬ DỤNG
                </h2>
                <p className="text-[13px] text-slate-700 text-justify leading-relaxed">
                  Đề tài áp dụng kiến trúc Microservices phân tán hiện đại, tách biệt rõ ràng giữa dịch vụ dữ liệu cảm biến
                  IoT và dịch vụ giao diện tương tác người dùng:
                </p>

                {/* Sơ đồ kiến trúc */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl my-4 text-center">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-3">
                    SƠ ĐỒ KHỐI KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-[12px]">
                    <div className="p-3 bg-white border border-blue-200 rounded-lg shadow-2xs font-bold text-blue-900">
                      <div>Frontend Layer</div>
                      <div className="text-[10.5px] font-normal text-slate-500 mt-1">
                        TailwindCSS • Vue/React • Vite
                      </div>
                    </div>
                    <div className="p-3 bg-white border border-indigo-200 rounded-lg shadow-2xs font-bold text-indigo-900">
                      <div>Backend & AI Engine</div>
                      <div className="text-[10.5px] font-normal text-slate-500 mt-1">
                        Python FastAPI • PyTorch • GNN
                      </div>
                    </div>
                    <div className="p-3 bg-white border border-emerald-200 rounded-lg shadow-2xs font-bold text-emerald-900">
                      <div>Data & IoT Broker</div>
                      <div className="text-[10.5px] font-normal text-slate-500 mt-1">
                        MQTT • PostgreSQL • Redis
                      </div>
                    </div>
                  </div>
                </div>

                {/* Công nghệ sử dụng */}
                <div className="space-y-2 text-[13px]">
                  <div className="font-bold text-slate-800">1. Công nghệ lưu trữ và khai phá dữ liệu:</div>
                  <p className="text-slate-600 pl-4 leading-relaxed">
                    Cơ sở dữ liệu chuỗi thời gian kết hợp <b>PostgreSQL/TimescaleDB</b> để quản lý hàng triệu bản ghi đo
                    lường cảm biến. Thuật toán phân tích dự báo cho phép cảnh báo trước từ 30 đến 60 phút.
                  </p>
                  <div className="font-bold text-slate-800 mt-3">2. Công nghệ xây dựng giao diện và dịch vụ Backend:</div>
                  <p className="text-slate-600 pl-4 leading-relaxed">
                    Backend triển khai bằng <b>FastAPI</b> bất đồng bộ (Asynchronous Python) nhằm đáp ứng lượng truy cập
                    đồng thời lớn với thời gian phản hồi dưới 120ms.
                  </p>
                </div>
              </div>

              <div className="text-center pt-8 text-[11px] text-slate-400">— Trang 2 / 3 —</div>
            </article>

            {/* ================= PAGE 3 ================= */}
            <article
              ref={page3Ref}
              id="reportPreviewPage3"
              className="w-[780px] min-h-[1100px] bg-white text-slate-800 shadow-2xl rounded-xs p-12 sm:p-16 mb-10 transition-all font-sans"
            >
              {/* Header Trang 3 */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-200 pb-2 mb-6">
                <span>BÁO CÁO ĐỒ ÁN TỐT NGHIỆP — ĐẠI HỌC THỦY LỢI</span>
                <span className="report-student-name">{item.name}</span>
              </div>

              {/* III. TIẾN ĐỘ THỰC HIỆN VÀ KẾT QUẢ */}
              <div className="space-y-4 my-6">
                <h2 className="text-[14.5px] font-bold uppercase text-slate-900 border-b border-slate-200 pb-1">
                  III. KẾT QUẢ TRIỂN KHAI VÀ ĐÁNH GIÁ THỰC NGHIỆM (15 TUẦN)
                </h2>

                {/* Bảng tiến độ */}
                <div className="border border-slate-200 rounded-lg overflow-hidden text-[12px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                      <tr>
                        <th className="p-2.5 border-b border-slate-200 w-24">Giai đoạn</th>
                        <th className="p-2.5 border-b border-slate-200">Nội dung công việc</th>
                        <th className="p-2.5 border-b border-slate-200 w-28">Thời gian</th>
                        <th className="p-2.5 border-b border-slate-200 w-32">Kết quả đầu ra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 font-bold text-blue-900">Giai đoạn 1</td>
                        <td className="p-2.5">Khảo sát lý thuyết, nghiên cứu tài liệu & xây dựng đề cương chi tiết.</td>
                        <td className="p-2.5 font-mono text-slate-600">Tuần 1 - 3</td>
                        <td className="p-2.5 font-medium text-emerald-700">Đạt yêu cầu</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-blue-900">Giai đoạn 2</td>
                        <td className="p-2.5">Xây dựng mạch IoT đo mực nước & chuẩn bị dataset thực nghiệm.</td>
                        <td className="p-2.5 font-mono text-slate-600">Tuần 4 - 7</td>
                        <td className="p-2.5 font-medium text-emerald-700">Đạt yêu cầu</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-blue-900">Giai đoạn 3</td>
                        <td className="p-2.5">Huấn luyện mô hình phân tích dữ liệu, tích hợp bản đồ GIS thời gian thực.</td>
                        <td className="p-2.5 font-mono text-slate-600">Tuần 8 - 11</td>
                        <td className="p-2.5 font-medium text-emerald-700">Đạt yêu cầu</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-blue-900">Giai đoạn 4</td>
                        <td className="p-2.5">Kiểm thử thực địa, hoàn thiện báo cáo đồ án và kiểm tra đạo văn.</td>
                        <td className="p-2.5 font-mono text-slate-600">Tuần 12 - 15</td>
                        <td className="p-2.5 font-medium text-emerald-700">Hoàn thành báo cáo</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chữ ký xác nhận */}
              <div className="pt-8 mt-8 border-t border-slate-200 text-[13px]">
                <div className="grid grid-cols-2 text-center gap-8">
                  <div>
                    <div className="font-bold text-slate-700 uppercase text-[12px]">SINH VIÊN THỰC HIỆN</div>
                    <div className="text-[11px] text-slate-400 italic mb-14">(Ký và ghi rõ họ tên)</div>
                    <span className="font-serif italic font-bold text-slate-700 text-lg report-student-name">
                      {item.name}
                    </span>
                    <div className="font-bold text-slate-900 report-student-name mt-1">{item.name}</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-700 uppercase text-[12px]">GIẢNG VIÊN HƯỚNG DẪN</div>
                    <div className="text-[11px] text-slate-400 italic mb-14">(Ký và ghi rõ họ tên)</div>
                    <span className="font-serif italic font-bold text-blue-900 text-lg">TS. Trần Mai Anh</span>
                    <div className="font-bold text-slate-900 mt-1">TS. Trần Mai Anh</div>
                  </div>
                </div>
              </div>

              <div className="text-center pt-8 text-[11px] text-slate-400">— Trang 3 / 3 —</div>
            </article>
          </div>
        </main>
      </div>
    </div>
  )
}
