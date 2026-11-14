import React, { useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  FileUp,
  UploadCloud,
  X,
} from 'lucide-react'
import type { StudentReportSubmissionItem } from '../types/reports.types'

interface GvPlagiarismModalProps {
  open: boolean
  item: StudentReportSubmissionItem | null
  studentName: string
  studentMssv: string
  cohort: string
  topicTitle: string
  onClose: () => void
  onSave: (id: number, plagiarismFile: string, plagiarismRate: number) => void
}

export const GvPlagiarismModal: React.FC<GvPlagiarismModalProps> = ({
  open,
  item,
  studentName,
  studentMssv,
  cohort,
  topicTitle,
  onClose,
  onSave,
}) => {
  const [selectedFileName, setSelectedFileName] = useState<string>('')
  const [rate, setRate] = useState<number | string>(18)
  const [verification, setVerification] = useState<{
    status: 'idle' | 'valid' | 'invalid'
    title?: string
    message?: string
  }>({ status: 'idle' })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      setSelectedFileName(item?.plagiarismFile || '')
      setRate(item?.plagiarismRate ?? 18)
      setVerification({ status: 'idle' })
    }
  }

  if (!open || !item) return null

  const handleTestValidFile = () => {
    const validFileName = `Bao-cao-do-an-${studentMssv}.pdf`
    setSelectedFileName(validFileName)
    setRate(18)
    setVerification({
      status: 'valid',
      title: 'Khớp thông tin sinh viên',
      message: `Tệp đối soát khớp hoàn toàn với sinh viên ${studentName} (${studentMssv}) - ${cohort}. Tỷ lệ trùng lặp: 18% (Đạt tiêu chuẩn ≤ 35%).`,
    })
  }

  const handleTestInvalidFile = () => {
    setSelectedFileName('Bao-cao-do-an-2051060999_NguyenVanA.pdf')
    setRate(42)
    setVerification({
      status: 'invalid',
      title: 'Cảnh báo: Sai lệch thông tin sinh viên',
      message: `Tệp kết quả kiểm tra thuộc về sinh viên khác (MSSV: 2051060999), không khớp với sinh viên hiện tại (${studentName} - ${studentMssv}). Vui lòng tải lại tệp hợp lệ!`,
    })
  }

  const handleFileChange = (file: File) => {
    setSelectedFileName(file.name)
    // Kiểm tra sơ bộ nếu tên tệp có chứa MSSV
    if (file.name.includes(studentMssv)) {
      setVerification({
        status: 'valid',
        title: 'Khớp thông tin sinh viên',
        message: `Tệp đối soát khớp với sinh viên ${studentName} (${studentMssv}).`,
      })
    } else {
      setVerification({
        status: 'valid',
        title: 'Đã nhận tệp kết quả',
        message: `Đã tải lên tệp: ${file.name}. Vui lòng đối soát tỷ lệ trùng lặp bên dưới.`,
      })
    }
  }

  const numRate = Number(rate)
  const isValidRate = !isNaN(numRate) && numRate >= 0 && numRate <= 100
  const canSave =
    Boolean(selectedFileName) &&
    verification.status !== 'invalid' &&
    isValidRate

  const handleSave = () => {
    if (!canSave) return
    onSave(item.id, selectedFileName, numRate)
    onClose()
  }

  return (
    <div
      id="gvPlagiarismModal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[530px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
            <FileUp className="w-4 h-4 text-[#1565C0]" /> Cập nhật kết quả kiểm tra trùng lặp (GVHD)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="gv-modal-close-btn text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-[13px] max-h-[85vh] overflow-y-auto">
          {/* Thông tin sinh viên & đề tài */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-200/80">
              <div>
                <div className="text-[11.5px] text-slate-500 font-medium">Sinh viên</div>
                <div id="gvPlagStudentName" className="text-slate-900 font-bold text-[13px] mt-0.5">
                  {studentName}
                </div>
              </div>
              <div>
                <div className="text-[11.5px] text-slate-500 font-medium">Mã sinh viên</div>
                <div id="gvPlagStudentMssv" className="font-mono font-bold text-slate-800 text-[13px] mt-0.5">
                  {studentMssv}
                </div>
              </div>
              <div>
                <div className="text-[11.5px] text-slate-500 font-medium">Khóa</div>
                <div id="gvPlagStudentCohort" className="font-bold text-slate-800 text-[13px] mt-0.5">
                  {cohort}
                </div>
              </div>
            </div>
            <div className="text-[12px] text-slate-600">
              <span className="text-slate-500">Đề tài:</span>{' '}
              <span id="gvPlagTopicName" className="font-medium text-slate-800">
                {topicTitle}
              </span>
            </div>
          </div>

          {/* Khu vực Tải lên file kết quả */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-700 font-semibold text-[13px] mb-1.5">
                Tải lên file kết quả Turnitin / DoIT (.pdf, .docx, .txt): <span className="text-rose-500">*</span>
              </label>
              <div
                id="gvPlagDropZone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer?.files?.[0]
                  if (file) handleFileChange(file)
                }}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center bg-slate-50 hover:bg-blue-50/20 transition cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="gvPlagFileInput"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileChange(file)
                  }}
                />
                <div className="cursor-pointer flex flex-col items-center">
                  <UploadCloud id="gvPlagUploadIcon" className="w-8 h-8 text-blue-600 mb-1" />
                  <span id="gvPlagFileChosenName" className="text-slate-700 font-medium text-xs">
                    {selectedFileName || 'Bấm hoặc kéo thả file kết quả vào đây'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Hỗ trợ file .pdf, .docx, .txt (Tối đa 15MB)
                  </span>
                </div>
              </div>
            </div>

            {/* Nút test thử nghiệm tiện ích cho Tester */}
            <div className="flex items-center gap-1.5 pt-0.5 text-xs">
              <span className="text-slate-400 text-[11px]">Dùng thử:</span>
              <button
                type="button"
                id="btnGvTestValidFile"
                onClick={handleTestValidFile}
                className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md cursor-pointer transition"
              >
                + File đúng (Khớp thông tin)
              </button>
              <button
                type="button"
                id="btnGvTestInvalidFile"
                onClick={handleTestInvalidFile}
                className="text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md cursor-pointer transition"
              >
                + File sai (Khác sinh viên)
              </button>
            </div>

            {/* Box kết quả kiểm tra & đối soát thông tin file */}
            {verification.status !== 'idle' && (
              <div
                id="gvFileVerificationBox"
                className={`p-3.5 rounded-xl border text-[12.5px] transition-all duration-200 ${
                  verification.status === 'valid'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {verification.status === 'valid' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{verification.title}</span>
                </div>
                <div
                  className={`text-[12px] mt-1 ${
                    verification.status === 'valid'
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {verification.message}
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
                  id="gvPlagRateInput"
                  min="0"
                  max="100"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full h-10 px-3 pr-8 border border-slate-300 rounded-xl text-[13.5px] font-bold outline-none focus:border-blue-500 transition"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[11.5px] text-slate-500 mt-1">
                Quy định chuẩn: &le; 35% là đạt yêu cầu để bảo vệ đồ án.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="gv-modal-close-btn h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            id="btnGvSavePlagiarism"
            disabled={!canSave}
            onClick={handleSave}
            className={
              canSave
                ? 'h-8 px-4 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-[12px] font-bold transition cursor-pointer shadow-xs'
                : 'h-8 px-4 rounded-lg bg-slate-300 text-slate-500 text-[12px] font-bold transition cursor-not-allowed shadow-none'
            }
          >
            Lưu kết quả
          </button>
        </div>
      </div>
    </div>
  )
}

