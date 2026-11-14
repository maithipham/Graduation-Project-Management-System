import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertOctagon,
  Check,
  CheckCircle2,
  Download,
  FileDown,
  FileSpreadsheet,
  FileUp,
  Loader2,
  Minus,
  Plus,
  Printer,
  RotateCcw,
  ShieldAlert,
  UploadCloud,
  X,
} from 'lucide-react'
import { toast } from '@/shared/components/feedback/toast.store'
import type { TeacherProfile } from '@/features/lecturer/lecturer_portal_storage'
import type {
  GuidingEvaluationItem,
  RubricCriterionKey,
  RubricScores,
} from '../types/guidingEvaluation.types'
import {
  clampRubricValue,
  computeRubricSummary,
  getInitialRubricScores,
  hasTrackingFile,
  INCOMPLETE_TRACKING_TIMELINE,
  isEvaluationCompleted,
  OFFICIAL_TRACKING_TIMELINE,
  RUBRIC_GROUPS,
  verifyTrackingFileContent,
} from '../utils/guidingEvaluation.utils'

// ==========================================
// 1. MODAL NỘP / NỘP LẠI PHIẾU THEO DÕI TIẾN ĐỘ
// ==========================================
interface UploadTrackingModalProps {
  item: GuidingEvaluationItem | null
  onClose: () => void
  onConfirm: (item: GuidingEvaluationItem, fileName: string) => void
}

export const UploadTrackingModal: React.FC<UploadTrackingModalProps> = ({
  item,
  onClose,
  onConfirm,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationState, setVerificationState] = useState<
    'idle' | 'matched' | 'mismatched'
  >('idle')

  if (!item) return null

  const isReUpload = hasTrackingFile(item)

  const processFile = (file: File) => {
    setSelectedFileName(file.name)
    setIsVerifying(true)
    setVerificationState('idle')

    const finishVerify = (textContent: string) => {
      const matched = verifyTrackingFileContent(textContent, file.name, item)
      setIsVerifying(false)
      if (matched) {
        setVerificationState('matched')
      } else {
        setVerificationState('mismatched')
        toast.error(
          `Cảnh báo: Mã sinh viên trong file không trùng khớp với sinh viên đang chọn (${item.mssv})!`,
        )
      }
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = typeof e.target?.result === 'string' ? e.target.result : ''
      setTimeout(() => finishVerify(text), 300)
    }
    reader.onerror = () => {
      finishVerify('')
    }
    reader.readAsText(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const canSubmit = verificationState === 'matched' && !isVerifying

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error(
        `Cảnh báo: Mã sinh viên trong file không trùng khớp với sinh viên đang chọn (${item.mssv})!`,
      )
      return
    }
    onConfirm(item, selectedFileName || `Phieu_tiendo_${item.mssv}.pdf`)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
            {isReUpload ? (
              <RotateCcw className="w-4 h-4 text-blue-600" />
            ) : (
              <FileUp className="w-4 h-4 text-blue-600" />
            )}
            <span>
              {isReUpload
                ? 'Nộp lại phiếu theo dõi tiến độ'
                : 'Nộp phiếu theo dõi tiến độ'}
            </span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-[13px]">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div>
              <span className="text-slate-500">Sinh viên:</span>{' '}
              <b className="text-slate-900">
                {item.name} ({item.mssv})
              </b>
            </div>
            <div className="text-[12px] text-slate-600">
              <div>
                Đề tài: <b className="text-slate-800">{item.topic}</b>
              </div>
              {isReUpload && (
                <div className="text-[11.5px] text-amber-700 font-medium mt-1">
                  File hiện tại:{' '}
                  <span className="font-mono font-bold">{item.fileName}</span>{' '}
                  (Nộp file mới sẽ ghi đè file này)
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Chọn file phiếu theo dõi (.pdf, .docx):{' '}
              <span className="text-rose-500">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setIsDragging(false)
              }}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/40'
                  : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="cursor-pointer flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <span className="text-slate-700 font-semibold text-xs">
                  Bấm để chọn file từ máy tính
                </span>
                <span
                  className={
                    selectedFileName
                      ? 'text-[11px] text-blue-700 font-bold mt-1'
                      : 'text-[11px] text-slate-400 mt-1'
                  }
                >
                  {selectedFileName
                    ? `Tệp đã chọn: ${selectedFileName}`
                    : isReUpload
                      ? `File hiện tại: ${item.fileName} (Bấm để chọn file mới thay thế)`
                      : 'Định dạng hỗ trợ: .pdf, .docx, .txt (tối đa 15MB)'}
                </span>
              </div>
            </div>
          </div>

          {isVerifying && (
            <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-600 animate-pulse text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <span>Đang kiểm tra và đối soát mã sinh viên trong file...</span>
            </div>
          )}

          {verificationState === 'mismatched' && !isVerifying && (
            <div className="p-3.5 rounded-xl border-2 bg-rose-50 border-rose-300 text-rose-950 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-bold text-[13px] text-rose-800 mb-1.5">
                <AlertOctagon className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                <span>CẢNH BÁO: Mã sinh viên không trùng khớp!</span>
              </div>
              <div className="text-[12px] text-rose-900 mb-2 leading-relaxed">
                Tệp <b>{selectedFileName}</b> không chứa mã sinh viên{' '}
                <b>{item.mssv}</b> của sinh viên <b>{item.name}</b> đang chọn. Hệ
                thống đã ngăn nộp để tránh việc tải nhầm file.
              </div>
              <div className="space-y-1.5 text-xs pl-3 pr-2 bg-white/80 p-2.5 rounded-lg border border-rose-200">
                <div className="flex items-center justify-between text-rose-700 font-bold">
                  <span>✗ Mã sinh viên (MSSV):</span>
                  <span className="font-mono">
                    Không tìm thấy &apos;{item.mssv}&apos;
                  </span>
                </div>
              </div>
              <div className="text-[11.5px] font-bold text-rose-700 mt-2 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Vui lòng chọn đúng file phiếu theo dõi có chứa mã sinh viên{' '}
                  {item.mssv} của {item.name} để nộp!
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl bg-white border border-slate-300 text-slate-700 text-[12.5px] font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={
              canSubmit
                ? 'h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-bold transition cursor-pointer shadow-xs inline-flex items-center gap-1.5'
                : 'h-9 px-5 rounded-xl bg-slate-200 border border-slate-300 text-slate-400 text-[12.5px] font-bold transition cursor-not-allowed shadow-none inline-flex items-center gap-1.5'
            }
          >
            <Check className="w-4 h-4" />
            <span>
              {isReUpload ? 'Xác nhận nộp lại file' : 'Xác nhận nộp file'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 2. MODAL BẢNG ĐIỂM RUBRIC CHẤM ĐIỂM HƯỚNG DẪN
// ==========================================
interface RubricGradingModalProps {
  item: GuidingEvaluationItem | null
  onClose: () => void
  onSave: (
    item: GuidingEvaluationItem,
    totalScore: number,
    rubricScores: RubricScores,
    isDraft: boolean,
  ) => void
}

export const RubricGradingModal: React.FC<RubricGradingModalProps> = ({
  item,
  onClose,
  onSave,
}) => {
  const [scores, setScores] = useState<RubricScores>(() =>
    item
      ? getInitialRubricScores(item)
      : {
          r1_1: 9.0,
          r1_2: 9.0,
          r2_1: 8.5,
          r2_2: 9.0,
          r3_1: 8.8,
          r3_2: 8.7,
          r4_1: 8.5,
          r4_2: 9.0,
          r4_3: 8.5,
        },
  )

  const summary = useMemo(() => computeRubricSummary(scores), [scores])

  if (!item) return null

  const handleScoreChange = (key: RubricCriterionKey, rawValue: string) => {
    const parsed = rawValue === '' ? 0 : parseFloat(rawValue)
    const clamped = clampRubricValue(parsed)
    setScores((prev) => ({ ...prev, [key]: clamped }))
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[940px] max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
        {/* Modal Header */}
        <div className="px-7 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1565C0] flex items-center justify-center shrink-0 border border-blue-100/80">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[15px] font-bold text-slate-800">
                  Bảng điểm:{' '}
                  <span className="text-[#1565C0]">{item.name}</span>
                </h3>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[11px] font-semibold">
                  MSV: {item.mssv}
                </span>
              </div>
              <p
                className="text-[12px] text-slate-500 mt-0.5 max-w-[620px] truncate"
                title={item.topic}
              >
                Đề tài: {item.topic}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-1.5 rounded-xl bg-[#0D47A1] text-white flex items-baseline gap-1 shadow-xs">
              <span className="text-[17px] font-extrabold leading-none tracking-tight">
                {summary.totalScore.toFixed(1)}
              </span>
              <span className="text-[11.5px] font-semibold text-blue-200">
                /10.0
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Bảng tiêu chí chấm điểm 5 cột */}
        <div className="overflow-y-auto px-7 py-4 flex-1">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-wider h-9 border-b border-slate-100 select-none">
                <th className="px-3 py-2 w-14 text-center">STT</th>
                <th className="px-4 py-2">TIÊU CHÍ CHẤM ĐIỂM</th>
                <th className="px-4 py-2 w-28 text-center">TRỌNG SỐ</th>
                <th className="px-4 py-2 w-36 text-center">ĐIỂM (THANG 10)</th>
                <th className="px-4 py-2 w-28 text-center">ĐIỂM TỔNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {RUBRIC_GROUPS.map((grp) => (
                <React.Fragment key={grp.group}>
                  <tr className="bg-white hover:bg-slate-50/50 transition font-bold text-slate-800">
                    <td className="px-3 py-2.5 text-center">{grp.group}</td>
                    <td className="px-4 py-2.5">{grp.title}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11.5px] font-bold bg-blue-50 text-blue-700">
                        {grp.weight}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-slate-300 font-bold">
                      —
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold text-blue-700 text-[13.5px]">
                      {summary.groupTotals[grp.group].toFixed(1)}
                    </td>
                  </tr>
                  {grp.criteria.map((crit) => (
                    <tr key={crit.key} className="hover:bg-slate-50/40 transition">
                      <td className="px-3 py-2 text-center text-slate-400 text-[12.5px]">
                        {crit.code}
                      </td>
                      <td className="px-4 py-2 text-slate-700">{crit.label}</td>
                      <td className="px-4 py-2 text-center text-slate-600 font-medium text-[12.5px]">
                        {crit.weight}%
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            value={scores[crit.key]}
                            onChange={(e) =>
                              handleScoreChange(crit.key, e.target.value)
                            }
                            className="w-16 h-8 text-center font-bold text-[13px] border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 bg-white transition shadow-2xs text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-slate-400 text-[12px] font-medium">
                            /10
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center font-bold text-emerald-600 text-[13px]">
                        {summary.criterionWeighted[crit.key].toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {/* TỔNG CỘNG HÀNG CUỐI */}
              <tr className="bg-blue-50/30 border-t-2 border-slate-200">
                <td
                  colSpan={2}
                  className="px-4 py-3.5 text-center font-bold text-slate-800 uppercase tracking-wide text-[12.5px]"
                >
                  TỔNG CỘNG ĐIỂM HƯỚNG DẪN ĐỒ ÁN
                </td>
                <td className="px-4 py-3.5 text-center font-bold text-blue-700 text-[13px]">
                  100%
                </td>
                <td className="px-4 py-3.5 text-center text-slate-300 font-bold">
                  —
                </td>
                <td className="px-4 py-3.5 text-center font-extrabold text-blue-700 text-[16px]">
                  {summary.totalScore.toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-7 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onSave(item, summary.totalScore, scores, true)}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span>Lưu nháp</span>
          </button>
          <button
            type="button"
            onClick={() => onSave(item, summary.totalScore, scores, false)}
            className="h-10 px-5 rounded-xl bg-[#0D47A1] hover:bg-blue-800 text-white text-[13px] font-bold transition cursor-pointer shadow-xs inline-flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Lưu bảng điểm</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 3. GOOGLE CLASSROOM / DRIVE STYLE FULLSCREEN TRACKING PREVIEW MODAL
// ==========================================
interface PreviewTrackingModalProps {
  item: GuidingEvaluationItem | null
  teacher: TeacherProfile
  academicYear: string
  semester: string
  onClose: () => void
  onReUpload: (item: GuidingEvaluationItem) => void
  onDownload: (item: GuidingEvaluationItem) => void
}

export const PreviewTrackingModal: React.FC<PreviewTrackingModalProps> = ({
  item,
  teacher,
  academicYear,
  semester,
  onClose,
  onReUpload,
  onDownload,
}) => {
  const [zoom, setZoom] = useState(100)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!item) return
    if (canvasRef.current) {
      canvasRef.current.scrollTop = 0
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [item, onClose])

  if (!item) return null

  const completed = isEvaluationCompleted(item)
  const resolvedFileName = item.fileName || `Phieu_tiendo_${item.mssv}.pdf`
  const timelineRows = completed
    ? OFFICIAL_TRACKING_TIMELINE
    : INCOMPLETE_TRACKING_TIMELINE
  const lecturerFullName = teacher.name || 'Chu Thị Minh Huệ'
  const workplace = teacher.workplace || 'Trường Đại học Thủy lợi'
  const semesterLabel =
    semester === 'HK2' ? 'Học kỳ 2' : semester === 'HK1' ? 'Học kỳ 1' : semester

  return (
    <div className="fixed inset-0 z-50 bg-[#202124] flex flex-col select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Bar Toolbar */}
      <header className="h-14 sm:h-16 bg-[#202124] border-b border-[#3c4043] flex items-center justify-between px-3 sm:px-6 shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2 py-0.5 rounded bg-[#EA4335] text-white text-[11px] font-extrabold tracking-wider shrink-0 shadow-xs">
              PDF
            </span>
            <div className="min-w-0">
              <h2 className="text-white text-[13.5px] sm:text-[14.5px] font-bold truncate tracking-wide max-w-[200px] sm:max-w-[420px]">
                {resolvedFileName}
              </h2>
              <div className="hidden md:flex items-center gap-4 text-[11.5px] text-slate-400 mt-0.5 font-medium">
                <span className="hover:text-white cursor-pointer transition">
                  Tệp
                </span>
                <span className="hover:text-white cursor-pointer transition">
                  Xem
                </span>
                <span className="hover:text-white cursor-pointer transition">
                  Công cụ
                </span>
                <span className="hover:text-white cursor-pointer transition">
                  Trợ giúp
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Pagination & Zoom Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-white text-xs shrink-0">
          <span className="hidden sm:inline text-slate-400">Trang</span>
          <input
            type="number"
            min={1}
            max={1}
            value={1}
            readOnly
            className="w-10 h-7 bg-[#303134] border border-[#5f6368] rounded text-center text-xs font-bold text-white outline-none focus:border-blue-400 transition"
          />
          <span className="text-slate-400">
            / <span className="text-slate-300 font-bold">1</span>
          </span>

          <div className="h-4 w-px bg-[#5f6368] mx-1 sm:mx-2" />

          <button
            type="button"
            onClick={() => window.print()}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
            title="In tài liệu"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
            title="Thu nhỏ"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-[11.5px] font-bold text-slate-300 w-12 text-center font-mono">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(180, z + 10))}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
            title="Phóng to"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions & Close */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose()
              onReUpload(item)
            }}
            className="h-8.5 px-3 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Nộp lại file phiếu theo dõi mới cho sinh viên này"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nộp lại file</span>
          </button>

          <button
            type="button"
            onClick={() => onDownload(item)}
            className="w-8 sm:w-9 h-8 sm:h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
            title="Tải xuống tài liệu"
          >
            <Download className="w-4.5 h-4.5" />
          </button>

          <button
            type="button"
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
        <aside className="w-40 sm:w-56 bg-[#282a2d] border-r border-[#3c4043] p-3 overflow-y-auto shrink-0 hidden sm:flex flex-col gap-3 select-none">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Các trang phiếu tiến độ
          </div>
          <div className="p-2 rounded-xl border-2 border-blue-500 bg-[#3c4043]/80 cursor-pointer transition hover:bg-[#3c4043]">
            <div className="text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
              <span>Trang 1</span>
              <span className="text-[10px] text-blue-400 font-semibold">
                Phiếu theo dõi
              </span>
            </div>
            <div className="w-full h-32 bg-white rounded shadow-xs p-2 text-[6px] text-slate-400 overflow-hidden leading-tight flex flex-col items-center">
              <div className="font-bold text-slate-800 text-[6.5px] uppercase text-center">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div className="font-bold text-blue-800 text-[6.5px] uppercase mt-1 text-center">
                PHIẾU THEO DÕI HƯỚNG DẪN
              </div>
              <div className="w-16 h-0.5 bg-slate-300 my-1" />
              <div className="w-full space-y-1 mt-1 text-slate-500">
                <div className="h-1 bg-slate-200 rounded w-full" />
                <div className="h-1 bg-slate-200 rounded w-5/6" />
                <div className="h-1 bg-slate-200 rounded w-4/6" />
              </div>
              <div className="w-full mt-2 border border-slate-200 rounded p-1">
                <div className="h-1 bg-slate-100 rounded w-full mb-0.5" />
                <div className="h-1 bg-slate-100 rounded w-full" />
              </div>
            </div>
          </div>
        </aside>

        <main
          ref={canvasRef}
          className="flex-1 overflow-y-auto p-4 sm:p-10 flex flex-col items-center justify-start relative select-text"
        >
          <div
            className="transition-transform duration-200 origin-top"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <article className="w-[780px] min-h-[1050px] bg-white text-slate-900 shadow-2xl rounded-xs p-10 sm:p-14 mb-10 transition-all font-sans leading-relaxed text-[13px]">
              {/* Quốc hiệu & Tiêu ngữ */}
              <div className="text-center font-bold tracking-tight">
                <div className="text-[13px] uppercase">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-[13px]">Độc lập – Tự do – Hạnh phúc</div>
                <div className="w-40 h-[1px] bg-slate-700 mx-auto mt-1 mb-5" />
                <div className="text-[16px] uppercase font-extrabold leading-snug">
                  PHIẾU THEO DÕI HƯỚNG DẪN SINH VIÊN
                  <br />
                  THỰC HIỆN HỌC PHẦN TỐT NGHIỆP
                </div>
                {!completed && (
                  <div className="text-[13px] italic font-normal text-slate-700 mt-1">
                    (Đối với sinh viên không đủ điều kiện đề xuất hội đồng)
                  </div>
                )}
              </div>

              {/* Thông tin 1 & 2 */}
              <div className="mt-6 space-y-3">
                <div>
                  <div className="font-bold text-[13.5px]">
                    1. Thông tin Giảng viên/ Cán bộ hướng dẫn:
                  </div>
                  <div className="pl-4 sm:pl-6 space-y-1 mt-1 text-slate-800">
                    <div>
                      – Họ và tên: <b>{lecturerFullName}</b>
                    </div>
                    <div>
                      – Đơn vị công tác: <b>{workplace}</b>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-bold text-[13.5px]">
                    2. Thông tin sinh viên:
                  </div>
                  <div className="pl-4 sm:pl-6 space-y-1.5 mt-1 text-slate-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        – Họ và tên:{' '}
                        <b className="text-slate-900">{item.name}</b>
                      </div>
                      <div>
                        Mã sinh viên:{' '}
                        <b className="font-mono">{item.mssv}</b>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        Lớp: <b>{item.classCode || '64CNTT3'}</b>
                      </div>
                      <div>
                        Đợt thực hiện:{' '}
                        <b>
                          {semesterLabel} ({academicYear || '2026–2027'})
                        </b>
                      </div>
                    </div>
                    <div>
                      Tên đề tài:{' '}
                      <b className="text-blue-900 leading-snug">{item.topic}</b>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bảng 3: Quá trình hướng dẫn */}
              <div className="mt-6">
                <div className="font-bold text-[13.5px] mb-2">
                  3. Quá trình hướng dẫn của Giảng viên:
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-700 text-[12px]">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-center border-b border-slate-700">
                        <th className="border border-slate-700 p-2 w-16 text-center">
                          Ngày tháng
                        </th>
                        <th className="border border-slate-700 p-2 min-w-[190px]">
                          Nội dung công việc Giảng viên đã thực hiện
                        </th>
                        <th className="border border-slate-700 p-2 min-w-[210px]">
                          Nhận xét, góp ý, đánh giá của GV
                        </th>
                        <th className="border border-slate-700 p-2 w-28 text-center">
                          Địa điểm thực hiện
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {timelineRows.map((row, idx) => (
                        <tr
                          key={`${row.date}-${idx}`}
                          className="hover:bg-slate-50 transition border-b border-slate-700"
                        >
                          <td className="border border-slate-700 p-2 text-center font-bold text-slate-800 whitespace-nowrap">
                            {row.date}
                          </td>
                          <td className="border border-slate-700 p-2 text-slate-900 leading-snug">
                            {row.work}
                          </td>
                          <td className="border border-slate-700 p-2 text-slate-800 leading-snug">
                            {row.comment}
                          </td>
                          <td className="border border-slate-700 p-2 text-center text-slate-700 whitespace-nowrap">
                            {row.location}
                          </td>
                        </tr>
                      ))}
                      {!completed && (
                        <tr className="border-b border-slate-700 h-8">
                          <td className="border border-slate-700 p-2" />
                          <td className="border border-slate-700 p-2" />
                          <td className="border border-slate-700 p-2" />
                          <td className="border border-slate-700 p-2" />
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Nhận xét */}
              <div className="mt-6 space-y-2">
                <div className="font-bold text-[13.5px]">4. Nhận xét:</div>
                {completed ? (
                  <div className="pl-4 sm:pl-6 space-y-1.5 text-slate-800">
                    <div>
                      <b>a. Tinh thần thái độ làm việc của Sinh viên:</b> Sinh
                      viên có tinh thần chủ động, sáng tạo và tiếp thu tốt những
                      ý kiến hướng dẫn và góp ý của giảng viên.
                    </div>
                    <div>
                      <b>b. Đánh giá chung:</b> Đạt yêu cầu quy định và đủ điều
                      kiện bảo vệ trước Hội đồng chấm đồ án tốt nghiệp.
                    </div>
                  </div>
                ) : (
                  <div className="pl-4 sm:pl-6 space-y-1.5 text-slate-800">
                    <div>
                      <b>a. Tinh thần thái độ làm việc của Sinh viên:</b>{' '}
                      <i>
                        Sinh viên không tuân thủ lịch hẹn báo cáo tiến độ,
                        thường xuyên vắng mặt/báo cáo không đạt yêu cầu. (Chỉ
                        gặp GV 4 lần trong tổng số 16 tuần, từ giữa học kỳ không
                        liên lạc phản hồi).
                      </i>
                    </div>
                    <div>
                      <b>b. Đánh giá chung:</b>{' '}
                      <i>
                        Tính đến thời điểm 20/08/2026, sinh viên đã{' '}
                        <b>KHÔNG HOÀN THÀNH</b> đồ án theo yêu cầu của GVHD, phần
                        việc đã thực hiện được đánh giá chỉ đạt khoảng{' '}
                        <b>25%</b> và{' '}
                        <b>
                          không đủ điều kiện để tiếp tục thực hiện/ báo cáo không
                          đạt yêu cầu đưa ra hội đồng
                        </b>
                        .
                      </i>
                    </div>
                  </div>
                )}
              </div>

              {/* Chữ ký & Ngày tháng */}
              <div className="mt-8 text-[13px]">
                {completed ? (
                  <div className="flex justify-end text-center">
                    <div className="space-y-1 pr-4">
                      <div className="italic text-slate-600">
                        Hà Nội, ngày 28 tháng 11 năm 2026
                      </div>
                      <div className="font-bold uppercase tracking-wide">
                        GV/Cán bộ hướng dẫn
                      </div>
                      <div className="text-[11px] text-slate-400 italic mb-16">
                        (Ký và ghi rõ họ tên)
                      </div>
                      <div className="font-bold text-[14px] text-slate-900">
                        {lecturerFullName}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="font-bold uppercase tracking-wide">
                        Bộ môn (phụ trách ngành)
                      </div>
                      <div className="text-[11px] text-slate-400 italic mb-16">
                        (Ký và ghi rõ họ tên)
                      </div>
                      <div className="font-bold text-[14px] text-slate-900">
                        TS. Phạm Hoàng
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="italic text-slate-600">
                        Hà Nội, ngày 28 tháng 11 năm 2026
                      </div>
                      <div className="font-bold uppercase tracking-wide">
                        GV/Cán bộ hướng dẫn
                      </div>
                      <div className="text-[11px] text-slate-400 italic mb-16">
                        (Ký và ghi rõ họ tên)
                      </div>
                      <div className="font-bold text-[14px] text-slate-900">
                        {lecturerFullName}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center pt-8 text-[11px] text-slate-400">
                — Trang 1 / 1 —
              </div>
            </article>
          </div>
        </main>
      </div>
    </div>
  )
}

