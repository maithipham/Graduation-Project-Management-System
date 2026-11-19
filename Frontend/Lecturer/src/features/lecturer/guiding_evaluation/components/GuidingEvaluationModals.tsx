import React, { useEffect, useRef, useState } from 'react'
import {
  Check,
  CheckCircle2,
  Download,
  FileDown,
  FileSpreadsheet,
  FileUp,
  Lock,
  RotateCcw,
  UploadCloud,
  X,
} from 'lucide-react'
import { Skeleton } from '@/shared/components/ui'
import { formatDate } from '@/shared/utils'
import {
  useAdvisorEvaluationDetail,
  useSaveAdvisorEvaluation,
  useSubmitProgressReport,
} from '../hooks/useGuidingEvaluation'
import type { EvaluationSheetDetail } from '@/features/lecturer/defense_management'
import type { AdvisorEvaluation } from '../types'

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // < 10MB giống BE (DocumentFileValidator)
const SCORE_REGEX = /^(10(\.0)?|[0-9](\.[0-9])?)$/

function fileNameFromUrl(url: string | null): string {
  if (!url) return ''
  try {
    return decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? '')
  } catch {
    return url.split('/').pop() ?? ''
  }
}

// ==========================================
// 1. MODAL NỘP / NỘP LẠI PHIẾU THEO DÕI TIẾN ĐỘ (POST /report/progress-report)
// ==========================================
interface UploadTrackingModalProps {
  item: AdvisorEvaluation | null
  onClose: () => void
}

export const UploadTrackingModal: React.FC<UploadTrackingModalProps> = ({ item, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const submitMutation = useSubmitProgressReport()
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState(item?.progressNote ?? '')
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  if (!item) return null
  const isReUpload = Boolean(item.progressFileUrl)

  const pickFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFile(null)
      setFileError('File phiếu theo dõi chỉ nhận định dạng .pdf, .doc hoặc .docx')
      return
    }
    if (f.size >= MAX_FILE_SIZE) {
      setFile(null)
      setFileError('File tải lên phải nhỏ hơn 10MB')
      return
    }
    setFileError(null)
    setFile(f)
  }

  const handleSubmit = () => {
    if (!file) {
      setFileError('Vui lòng chọn file phiếu theo dõi tiến độ')
      return
    }
    submitMutation.mutate({ topicPublicId: item.topicPublicId, file, note }, { onSuccess: onClose })
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitMutation.isPending) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
            {isReUpload ? <RotateCcw className="w-4 h-4 text-blue-600" /> : <FileUp className="w-4 h-4 text-blue-600" />}
            <span>{isReUpload ? 'Nộp lại phiếu theo dõi tiến độ' : 'Nộp phiếu theo dõi tiến độ'}</span>
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
                {item.studentName} ({item.studentCode})
              </b>
            </div>
            <div className="text-[12px] text-slate-600">
              Đề tài: <b className="text-slate-800">{item.topicName || '—'}</b>
            </div>
            {isReUpload && (
              <div className="text-[11.5px] text-amber-700 font-medium">
                File hiện tại: <span className="font-mono font-bold">{fileNameFromUrl(item.progressFileUrl)}</span> (nộp file
                mới sẽ thay thế file này)
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Chọn file phiếu theo dõi (.pdf, .doc, .docx): <span className="text-rose-500">*</span>
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
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const f = e.dataTransfer.files?.[0]
                if (f) pickFile(f)
              }}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/40'
                  : fileError
                    ? 'border-[#DC2626] bg-rose-50/30'
                    : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) pickFile(f)
                }}
                className="hidden"
              />
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <span className="text-slate-700 font-semibold text-xs">Bấm hoặc kéo thả file vào đây</span>
                <span className={file ? 'text-[11px] text-blue-700 font-bold mt-1' : 'text-[11px] text-slate-400 mt-1'}>
                  {file ? `Tệp đã chọn: ${file.name}` : 'Định dạng hỗ trợ: .pdf, .doc, .docx (dưới 10MB)'}
                </span>
              </div>
            </div>
            {fileError && <p className="text-xs font-bold text-[#DC2626] mt-1">{fileError}</p>}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Nhận xét tiến độ (tùy chọn)</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-[12.5px] outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitMutation.isPending}
            className="h-9 px-4 rounded-xl bg-white border border-slate-300 text-slate-700 text-[12.5px] font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={submitMutation.isPending}
            onClick={handleSubmit}
            className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-bold transition cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            <span>
              {submitMutation.isPending ? 'Đang nộp...' : isReUpload ? 'Xác nhận nộp lại file' : 'Xác nhận nộp file'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 2. MODAL BẢNG ĐIỂM RUBRIC CHẤM ĐIỂM HƯỚNG DẪN (PUT /report/advisor-evaluation/{topicId})
// ==========================================
interface RubricGradingModalProps {
  item: AdvisorEvaluation | null
  onClose: () => void
}

export const RubricGradingModal: React.FC<RubricGradingModalProps> = ({ item, onClose }) => {
  const { data, isPending, isError } = useAdvisorEvaluationDetail(item?.topicPublicId)
  if (!item) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[940px] max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
        {isPending && (
          <div className="p-7 space-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-72 w-full" />
          </div>
        )}
        {isError && (
          <div className="p-7 space-y-3">
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-xl">
              Không tải được bảng điểm. Học kỳ có thể chưa cấu hình Rubric phiếu hướng dẫn.
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={onClose} className="h-9 px-4 rounded-xl border border-slate-300 text-xs font-bold cursor-pointer">
                Đóng
              </button>
            </div>
          </div>
        )}
        {data?.sheet && (
          <RubricForm
            key={`${data.sheet.sheetPublicId ?? 'new'}-${data.sheet.updatedAt ?? ''}-${data.sheet.status ?? ''}`}
            evaluation={data}
            sheet={data.sheet}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}

const RubricForm: React.FC<{
  evaluation: AdvisorEvaluation
  sheet: EvaluationSheetDetail
  onClose: () => void
}> = ({ evaluation, sheet, onClose }) => {
  const saveMutation = useSaveAdvisorEvaluation(evaluation.topicPublicId)
  const locked = !evaluation.editable || !evaluation.gradingOpen
  const criteria = sheet.groups.flatMap((g) => g.criteria)

  const [scores, setScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(criteria.map((c) => [c.criteriaPublicId, c.score !== null && c.score !== undefined ? String(c.score) : ''])),
  )
  const [comment, setComment] = useState(sheet.generalComment ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const weighted = (id: string, weight: number) => {
    const v = Number(scores[id])
    return scores[id] !== '' && !Number.isNaN(v) ? (v * weight) / 100 : 0
  }
  const total = Math.round(criteria.reduce((s, c) => s + weighted(c.criteriaPublicId, c.weight), 0) * 10) / 10

  const save = (submit: boolean) => {
    const next: Record<string, string> = {}
    criteria.forEach((c) => {
      const v = scores[c.criteriaPublicId]?.trim() ?? ''
      if (v === '') {
        if (submit) next[c.criteriaPublicId] = 'Bắt buộc'
      } else if (!SCORE_REGEX.test(v)) {
        next[c.criteriaPublicId] = '0–10, 1 số lẻ'
      }
    })
    setErrors(next)
    if (Object.keys(next).length > 0) return
    saveMutation.mutate(
      {
        criteriaScores: criteria.map((c) => {
          const v = scores[c.criteriaPublicId]?.trim()
          return { criteriaPublicId: c.criteriaPublicId, score: v ? Number(v) : null }
        }),
        generalComment: comment.trim() || null,
        submit,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <>
      <div className="px-7 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1565C0] flex items-center justify-center shrink-0 border border-blue-100/80">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[15px] font-bold text-slate-800">
                Bảng điểm: <span className="text-[#1565C0]">{evaluation.studentName}</span>
              </h3>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[11px] font-semibold">
                MSV: {evaluation.studentCode}
              </span>
              {sheet.status && (
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    sheet.status === 'SUBMITTED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {sheet.status === 'SUBMITTED' ? 'Đã lưu chính thức' : 'Lưu nháp'}
                </span>
              )}
            </div>
            <p className="text-[12px] text-slate-500 mt-0.5 max-w-[620px] truncate" title={evaluation.topicName ?? ''}>
              Đề tài: {evaluation.topicName || '—'} · {sheet.templateName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#0D47A1] text-white flex items-baseline gap-1 shadow-xs">
            <span className="text-[17px] font-extrabold leading-none tracking-tight">{total.toFixed(1)}</span>
            <span className="text-[11.5px] font-semibold text-blue-200">/10.0</span>
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

      <div className="overflow-y-auto px-7 py-4 flex-1 space-y-3">
        {locked && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-start gap-2">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {!evaluation.editable
                ? 'Đề tài không còn ở giai đoạn được chấm điểm hướng dẫn – bảng điểm chỉ xem.'
                : `Ngoài thời gian chấm (cùng hạn nộp báo cáo & phiếu theo dõi tiến độ${
                    evaluation.gradingStartAt && evaluation.gradingEndAt
                      ? `: ${formatDate(evaluation.gradingStartAt, 'full')} – ${formatDate(evaluation.gradingEndAt, 'full')}`
                      : ''
                  }) – không thể lưu.`}
            </span>
          </div>
        )}

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
            {sheet.groups.map((grp, gIdx) => {
              const groupWeight = grp.criteria.reduce((s, c) => s + c.weight, 0)
              const groupTotal = grp.criteria.reduce((s, c) => s + weighted(c.criteriaPublicId, c.weight), 0)
              return (
                <React.Fragment key={grp.groupPublicId}>
                  <tr className="bg-white hover:bg-slate-50/50 transition font-bold text-slate-800">
                    <td className="px-3 py-2.5 text-center">{gIdx + 1}</td>
                    <td className="px-4 py-2.5">{grp.name}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11.5px] font-bold bg-blue-50 text-blue-700">
                        {groupWeight}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-slate-300 font-bold">—</td>
                    <td className="px-4 py-2.5 text-center font-bold text-blue-700 text-[13.5px]">{groupTotal.toFixed(1)}</td>
                  </tr>
                  {grp.criteria.map((c, cIdx) => (
                    <tr key={c.criteriaPublicId} className="hover:bg-slate-50/40 transition">
                      <td className="px-3 py-2 text-center text-slate-400 text-[12.5px]">
                        {gIdx + 1}.{cIdx + 1}
                      </td>
                      <td className="px-4 py-2 text-slate-700">{c.name}</td>
                      <td className="px-4 py-2 text-center text-slate-600 font-medium text-[12.5px]">{c.weight}%</td>
                      <td className="px-4 py-2 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            disabled={locked}
                            value={scores[c.criteriaPublicId] ?? ''}
                            onChange={(e) => setScores((prev) => ({ ...prev, [c.criteriaPublicId]: e.target.value }))}
                            className={`w-16 h-8 text-center font-bold text-[13px] border rounded-lg outline-none focus:border-blue-600 bg-white disabled:bg-slate-50 transition shadow-2xs text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              errors[c.criteriaPublicId] ? 'border-[#DC2626]' : 'border-slate-200'
                            }`}
                          />
                          <span className="text-slate-400 text-[12px] font-medium">/10</span>
                        </div>
                        {errors[c.criteriaPublicId] && (
                          <div className="text-[10.5px] font-bold text-[#DC2626] mt-0.5">{errors[c.criteriaPublicId]}</div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center font-bold text-emerald-600 text-[13px]">
                        {weighted(c.criteriaPublicId, c.weight).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              )
            })}
            <tr className="bg-blue-50/30 border-t-2 border-slate-200">
              <td colSpan={2} className="px-4 py-3.5 text-center font-bold text-slate-800 uppercase tracking-wide text-[12.5px]">
                TỔNG CỘNG ĐIỂM HƯỚNG DẪN ĐỒ ÁN
              </td>
              <td className="px-4 py-3.5 text-center font-bold text-blue-700 text-[13px]">
                {criteria.reduce((s, c) => s + c.weight, 0)}%
              </td>
              <td className="px-4 py-3.5 text-center text-slate-300 font-bold">—</td>
              <td className="px-4 py-3.5 text-center font-extrabold text-blue-700 text-[16px]">{total.toFixed(1)}</td>
            </tr>
          </tbody>
        </table>

        <div>
          <label className="block text-[12.5px] font-bold text-slate-700 mb-1">Nhận xét của GVHD</label>
          <textarea
            rows={3}
            disabled={locked}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-300 text-[12.5px] outline-none focus:border-blue-500 disabled:bg-slate-50"
          />
        </div>
      </div>

      {!locked && (
        <div className="px-7 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => save(false)}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span>{saveMutation.isPending ? 'Đang lưu...' : 'Lưu nháp'}</span>
          </button>
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => save(true)}
            className="h-10 px-5 rounded-xl bg-[#0D47A1] hover:bg-blue-800 text-white text-[13px] font-bold transition cursor-pointer shadow-xs inline-flex items-center gap-2 disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Lưu bảng điểm</span>
          </button>
        </div>
      )}
    </>
  )
}

// ==========================================
// 3. XEM TRƯỚC PHIẾU THEO DÕI TIẾN ĐỘ (file thật trên Cloudinary)
// ==========================================
interface PreviewTrackingModalProps {
  item: AdvisorEvaluation | null
  onClose: () => void
  onReUpload: (item: AdvisorEvaluation) => void
}

export const PreviewTrackingModal: React.FC<PreviewTrackingModalProps> = ({ item, onClose, onReUpload }) => {
  useEffect(() => {
    if (!item) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [item, onClose])

  if (!item || !item.progressFileUrl) return null
  const url = item.progressFileUrl
  const fileName = fileNameFromUrl(url) || `Phieu_tiendo_${item.studentCode}`
  const isPdf = fileName.toLowerCase().endsWith('.pdf')

  return (
    <div className="fixed inset-0 z-50 bg-[#202124] flex flex-col overflow-hidden animate-in fade-in duration-200">
      <header className="h-14 sm:h-16 bg-[#202124] border-b border-[#3c4043] flex items-center justify-between px-3 sm:px-6 shrink-0 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="px-2 py-0.5 rounded bg-[#EA4335] text-white text-[11px] font-extrabold tracking-wider shrink-0">
            {isPdf ? 'PDF' : 'DOC'}
          </span>
          <div className="min-w-0">
            <h2 className="text-white text-[14px] font-bold truncate max-w-[200px] sm:max-w-[420px]">{fileName}</h2>
            <div className="text-[11.5px] text-slate-400">
              {item.studentName} ({item.studentCode})
              {item.progressSubmittedAt && ` · Nộp lúc ${formatDate(item.progressSubmittedAt, 'full')}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {item.editable && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onReUpload(item)
              }}
              className="h-8.5 px-3 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nộp lại file</span>
            </button>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8.5 px-3 rounded-lg border border-[#5f6368] text-slate-200 hover:bg-white/10 text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tải xuống</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>
      <div className="flex-1 min-h-0 flex items-center justify-center p-4">
        {isPdf ? (
          <iframe title={fileName} src={url} className="w-full h-full max-w-[1000px] bg-white rounded-lg" />
        ) : (
          <div className="text-center text-slate-300 text-sm space-y-3">
            <p>Không xem trước được file Word trong trình duyệt.</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#1565C0] text-white text-xs font-bold"
            >
              <Download className="w-4 h-4" /> Tải file về để xem
            </a>
          </div>
        )}
      </div>
      {item.progressNote && (
        <div className="px-6 py-3 bg-[#303134] text-slate-200 text-xs border-t border-[#3c4043]">
          <b>Nhận xét tiến độ:</b> {item.progressNote}
        </div>
      )}
    </div>
  )
}
