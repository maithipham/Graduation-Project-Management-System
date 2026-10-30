import React, { useState } from 'react'
import {
  FileDown,
  FilePenLine,
  FileText,
  Lock,
  PenLine,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { STUDENT_TOPIC_STORAGE_KEYS } from '@/shared/constants/studentProfile.mock'
import {
  OUTLINE_SECTIONS,
  buildDefaultDocxFileName,
  createEmptyOutlineEditorData,
  loadSavedOutlineDraft,
} from '../services/outline.service'
import type { OutlineEditorData, OutlinePlanRow, OutlineSectionKey } from '../types/outline.types'
import {
  buildOutlineBlocks,
  downloadOutlineDocx,
  type StudentOutlineMeta,
} from '../utils/docxBuilder'
import { OutlinePaperPreview } from './OutlinePaperPreview'

interface OnlineOutlineEditorModalProps {
  open: boolean
  defaultTopicVi: string
  termLabel: string
  studentMeta: StudentOutlineMeta
  onClose: () => void
  onSubmit: (payload: { fileName: string; data: OutlineEditorData }) => void
  onToast: (message: string, type?: 'success' | 'warning' | 'error') => void
}

const INPUT_BASE_CLS =
  'w-full text-sm px-3.5 py-2.5 rounded-lg border bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1565C0]/25 focus:border-[#1565C0] transition-colors'

export const OnlineOutlineEditorModal: React.FC<OnlineOutlineEditorModalProps> = ({
  open,
  defaultTopicVi,
  termLabel,
  studentMeta,
  onClose,
  onSubmit,
  onToast,
}) => {
  const [tab, setTab] = useState<'form' | 'preview'>('form')
  const [data, setData] = useState<OutlineEditorData>(() =>
    loadSavedOutlineDraft(defaultTopicVi),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [footerMsg, setFooterMsg] = useState<string>('')

  const [prevOpen, setPrevOpen] = useState<boolean>(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      setData(loadSavedOutlineDraft(defaultTopicVi))
      setErrors({})
      setFooterMsg('')
      setTab('form')
    }
  }

  if (!open) return null

  const defaultFileName = buildDefaultDocxFileName(studentMeta.mssv, studentMeta.name)

  const saveDraft = (silent = false) => {
    try {
      localStorage.setItem(STUDENT_TOPIC_STORAGE_KEYS.outlineDraft, JSON.stringify(data))
      if (!silent) onToast('Đã lưu nháp đề cương.', 'success')
    } catch {
      if (!silent) onToast('Không lưu được bản nháp.', 'error')
    }
  }

  const updateField = (key: keyof OutlineEditorData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const updatePlanCell = (index: number, key: keyof OutlinePlanRow, value: string) => {
    setData((prev) => {
      const nextPlan = prev.plan.map((row, idx) =>
        idx === index ? { ...row, [key]: value } : row,
      )
      return { ...prev, plan: nextPlan }
    })
    if (errors.plan) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.plan
        return next
      })
    }
  }

  const addPlanRow = () => {
    setData((prev) => ({
      ...prev,
      plan: [...prev.plan, { task: '', time: '', result: '' }],
    }))
  }

  const removePlanRow = (index: number) => {
    setData((prev) => {
      const nextPlan = prev.plan.filter((_, idx) => idx !== index)
      return {
        ...prev,
        plan: nextPlan.length > 0 ? nextPlan : [{ task: '', time: '', result: '' }],
      }
    })
  }

  const handleReset = () => {
    if (window.confirm('Xóa toàn bộ nội dung đã nhập và bản nháp đã lưu?')) {
      setData(createEmptyOutlineEditorData(defaultTopicVi))
      setErrors({})
      setFooterMsg('')
      try {
        localStorage.removeItem(STUDENT_TOPIC_STORAGE_KEYS.outlineDraft)
      } catch {
        // ignore
      }
    }
  }

  const handleExportWord = () => {
    saveDraft(true)
    downloadOutlineDocx(buildOutlineBlocks(data, studentMeta), defaultFileName)
    onToast(`Đã xuất file Word: ${defaultFileName}`, 'success')
  }

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {}
    if (!data.topicVi.trim()) {
      nextErrors.topicVi = 'Vui lòng nhập tên đề tài.'
    }
    OUTLINE_SECTIONS.forEach((s) => {
      if (s.required && !data[s.key].trim()) {
        nextErrors[s.key] = 'Vui lòng nhập nội dung mục này.'
      }
    })
    if (!data.plan.some((r) => r.task.trim())) {
      nextErrors.plan = 'Cần ít nhất một công việc trong kế hoạch thực hiện.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setTab('form')
      setFooterMsg('Còn thông tin bắt buộc chưa điền, vui lòng kiểm tra các mục báo đỏ.')
      return
    }

    setErrors({})
    setFooterMsg('')
    saveDraft(true)
    onSubmit({
      fileName: defaultFileName,
      data: JSON.parse(JSON.stringify(data)) as OutlineEditorData,
    })
    onClose()
  }

  const fieldCls = (key: string) =>
    `${INPUT_BASE_CLS} ${errors[key] ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'}`

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-lg bg-blue-50 text-[#1565C0] flex items-center justify-center shrink-0">
              <FilePenLine size={20} />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900">Soạn đề cương trực tuyến</h3>
              <p className="text-[11px] text-slate-500">
                Điền thông tin theo từng phần, hệ thống tự dàn trang theo mẫu và xuất ra file Word.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-slate-200/70">
            <button
              type="button"
              onClick={() => setTab('form')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                tab === 'form'
                  ? 'bg-white text-[#1565C0] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <PenLine size={14} />
              <span>Nhập thông tin</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('preview')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                tab === 'preview'
                  ? 'bg-white text-[#1565C0] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText size={14} />
              <span>Xem trước</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {tab === 'form' ? (
            <div className="max-w-3xl mx-auto p-6 space-y-6">
              <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Lock size={14} />
                  <span>Thông tin sinh viên (tự điền)</span>
                </h4>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Họ và tên
                    </dt>
                    <dd className="text-sm font-semibold text-slate-800 mt-0.5">
                      {studentMeta.name || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Mã số sinh viên
                    </dt>
                    <dd className="text-sm font-semibold text-slate-800 mt-0.5">
                      {studentMeta.mssv || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Lớp
                    </dt>
                    <dd className="text-sm font-semibold text-slate-800 mt-0.5">
                      {studentMeta.className || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Bộ môn
                    </dt>
                    <dd className="text-sm font-semibold text-slate-800 mt-0.5">
                      {studentMeta.department || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Giảng viên hướng dẫn
                    </dt>
                    <dd className="text-sm font-semibold text-slate-800 mt-0.5">
                      {studentMeta.mentor || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Kỳ nộp
                    </dt>
                    <dd className="text-sm font-semibold text-slate-800 mt-0.5">
                      {termLabel || '—'}
                    </dd>
                  </div>
                </dl>
              </section>

              <div>
                <label className="block text-sm font-bold text-slate-800">
                  Tên đề tài (tiếng Việt) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={data.topicVi}
                  onChange={(e) => updateField('topicVi', e.target.value)}
                  className={`${fieldCls('topicVi')} mt-1.5`}
                />
                {errors.topicVi && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.topicVi}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800">
                  Tên đề tài (tiếng Anh){' '}
                  <span className="text-slate-400 font-medium text-xs">(không bắt buộc)</span>
                </label>
                <input
                  type="text"
                  value={data.topicEn}
                  onChange={(e) => updateField('topicEn', e.target.value)}
                  className={`${fieldCls('topicEn')} mt-1.5`}
                />
              </div>

              {OUTLINE_SECTIONS.map((s) => (
                <div key={s.key}>
                  <label className="block text-sm font-bold text-slate-800">
                    {s.title}{' '}
                    {s.required ? (
                      <span className="text-rose-500">*</span>
                    ) : (
                      <span className="text-slate-400 font-medium text-xs">(không bắt buộc)</span>
                    )}
                  </label>
                  <p className="text-[11.5px] text-slate-400 mb-1.5">{s.hint}</p>
                  <textarea
                    rows={s.rows}
                    value={data[s.key as OutlineSectionKey]}
                    onChange={(e) => updateField(s.key, e.target.value)}
                    className={`${fieldCls(s.key)} resize-y leading-relaxed`}
                  />
                  {errors[s.key] && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">{errors[s.key]}</p>
                  )}
                </div>
              ))}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-bold text-slate-800">
                    8. Kế hoạch thực hiện <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addPlanRow}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1565C0] hover:text-[#0D47A1] cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Thêm dòng</span>
                  </button>
                </div>

                <table className="w-full">
                  <thead>
                    <tr className="text-[11px] font-bold text-slate-400 uppercase text-left">
                      <th className="pb-1 font-bold">#</th>
                      <th className="pb-1 font-bold">Công việc</th>
                      <th className="pb-1 font-bold">Thời gian</th>
                      <th className="pb-1 font-bold">Kết quả</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.plan.map((row, idx) => (
                      <tr key={idx} className="align-top">
                        <td className="py-2 pr-2 text-xs font-bold text-slate-400 w-8 pt-3.5">
                          {idx + 1}
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={row.task}
                            onChange={(e) => updatePlanCell(idx, 'task', e.target.value)}
                            placeholder="Ví dụ: Khảo sát và phân tích yêu cầu"
                            className={`${INPUT_BASE_CLS} border-slate-300 text-xs!`}
                          />
                        </td>
                        <td className="py-2 pr-2 w-36">
                          <input
                            type="text"
                            value={row.time}
                            onChange={(e) => updatePlanCell(idx, 'time', e.target.value)}
                            placeholder="Tuần 1 - 3"
                            className={`${INPUT_BASE_CLS} border-slate-300 text-xs!`}
                          />
                        </td>
                        <td className="py-2 pr-2 w-48">
                          <input
                            type="text"
                            value={row.result}
                            onChange={(e) => updatePlanCell(idx, 'result', e.target.value)}
                            placeholder="Tài liệu SRS"
                            className={`${INPUT_BASE_CLS} border-slate-300 text-xs!`}
                          />
                        </td>
                        <td className="py-2 w-8">
                          <button
                            type="button"
                            onClick={() => removePlanRow(idx)}
                            className="p-1.5 mt-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Xóa dòng"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {errors.plan && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.plan}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-100 min-h-full">
              <OutlinePaperPreview data={data} meta={studentMeta} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-xs font-medium text-rose-600">{footerMsg}</div>
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 cursor-pointer"
            >
              Xóa nội dung
            </button>
            <button
              type="button"
              onClick={() => saveDraft(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors"
            >
              <Save size={14} />
              <span>Lưu nháp</span>
            </button>
            <button
              type="button"
              onClick={handleExportWord}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-[#1565C0] bg-blue-50 border border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors"
            >
              <FileDown size={14} />
              <span>Xuất file Word</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 rounded-lg text-xs font-bold uppercase bg-[#1565C0] text-white hover:bg-[#0D47A1] shadow-xs cursor-pointer transition-colors"
            >
              Nộp đề cương
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface OutlineSubmittedPreviewModalProps {
  open: boolean
  fileName: string
  data: OutlineEditorData | null
  studentMeta: StudentOutlineMeta
  onClose: () => void
}

export const OutlineSubmittedPreviewModal: React.FC<OutlineSubmittedPreviewModalProps> = ({
  open,
  fileName,
  data,
  studentMeta,
  onClose,
}) => {
  if (!open || !data) return null

  return (
    <div
      className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[92vh] flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 truncate">{fileName}</div>
            <div className="text-[11px] text-slate-500">Đề cương soạn trực tuyến</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadOutlineDocx(buildOutlineBlocks(data, studentMeta), fileName)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-[#1565C0] bg-blue-50 border border-blue-200 hover:bg-blue-100 cursor-pointer"
            >
              <FileDown size={14} />
              <span>Tải file Word</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
          <OutlinePaperPreview data={data} meta={studentMeta} />
        </div>
      </div>
    </div>
  )
}

