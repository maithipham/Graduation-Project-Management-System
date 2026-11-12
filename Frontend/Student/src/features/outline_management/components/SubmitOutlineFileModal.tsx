import React, { useRef, useState } from 'react'
import { FileCheck2, FileUp, UploadCloud, X } from 'lucide-react'
import { validateOutlineFile } from '../services/outline.service'
import type { SubmitOutlineRequest } from '../types/outline.types'

interface SubmitOutlineFileModalProps {
  open: boolean
  isSubmitting?: boolean
  defaultTitle?: string
  onClose: () => void
  onSubmitFile: (payload: SubmitOutlineRequest) => void
}

export const SubmitOutlineFileModal: React.FC<SubmitOutlineFileModalProps> = ({
  open,
  isSubmitting = false,
  defaultTitle,
  onClose,
  onSubmitFile,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [submissionNote, setSubmissionNote] = useState<string>('')
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      setSelectedFile(null)
      setSubmissionNote('')
      setFileError(null)
    }
  }

  if (!open) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (!f) return

    const validationError = validateOutlineFile(f)
    if (validationError) {
      setSelectedFile(null)
      setFileError(validationError)
      e.target.value = ''
      return
    }

    setFileError(null)
    setSelectedFile(f)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileUp size={20} className="text-[#1565C0]" />
            <h3 className="text-base font-bold text-slate-900">Tải lên tệp đề cương</h3>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed p-1 rounded-md cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-xs text-slate-500 space-y-1 bg-blue-50/60 p-3.5 rounded-lg border border-blue-100">
            <p className="font-semibold text-slate-800">Quy định tải lên:</p>
            <p>
              • Định dạng được hỗ trợ:{' '}
              <strong className="font-bold text-slate-700">.pdf, .doc, .docx</strong>
            </p>
            <p>
              • Dung lượng tối đa: <strong className="font-bold text-slate-700">nhỏ hơn 10 MB</strong>
            </p>
            <p>
              • Vui lòng đặt tên tệp theo cú pháp:{' '}
              <em className="text-slate-600">De_cuong_MSSV_HoTen.pdf</em>
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            disabled={isSubmitting}
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="text-center py-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-[#1565C0] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 hover:text-[#1565C0] bg-slate-50/50 hover:bg-blue-50/40 transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <UploadCloud size={16} />
              <span>Chọn tệp từ máy tính</span>
            </button>

            {fileError && (
              <p role="alert" className="text-xs font-semibold text-[#DC2626] mt-2">
                {fileError}
              </p>
            )}

            {selectedFile && (
              <div className="mt-3 flex justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                  <FileCheck2 size={16} className="text-emerald-600 shrink-0" />
                  <span className="font-semibold text-emerald-800 max-w-[260px] truncate">
                    {selectedFile.name}
                  </span>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setSelectedFile(null)
                      setFileError(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="text-emerald-600 hover:text-rose-600 disabled:opacity-40 cursor-pointer"
                    title="Bỏ tệp"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-400 mt-3">
              Bạn chưa có file? Hãy dùng{' '}
              <strong className="font-bold text-slate-600">Soạn trực tuyến</strong> để nhập nội dung
              theo mẫu và xuất ra Word.
            </p>
          </div>

          <div>
            <label
              htmlFor="outlineSubmissionNoteInput"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Ghi chú khi nộp <span className="text-slate-400 font-normal">(không bắt buộc)</span>
            </label>
            <textarea
              id="outlineSubmissionNoteInput"
              rows={2}
              disabled={isSubmitting}
              value={submissionNote}
              onChange={(e) => setSubmissionNote(e.target.value)}
              placeholder="Ví dụ: Em nộp bản đề cương lần 1 / Em đã chỉnh sửa theo góp ý..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] disabled:bg-slate-50 disabled:text-slate-400 resize-y"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!selectedFile || isSubmitting}
              onClick={() => {
                if (selectedFile) {
                  onSubmitFile({
                    file: selectedFile,
                    submissionNote: submissionNote.trim() || undefined,
                    title: defaultTitle?.trim() || undefined,
                  })
                }
              }}
              className={
                selectedFile && !isSubmitting
                  ? 'px-5 py-2 rounded-lg text-xs font-bold uppercase transition-colors bg-[#1565C0] text-white hover:bg-[#0D47A1] shadow-xs cursor-pointer'
                  : 'px-5 py-2 rounded-lg text-xs font-bold uppercase transition-colors bg-slate-200 text-slate-400 cursor-not-allowed select-none'
              }
            >
              {isSubmitting ? 'Đang nộp...' : 'Nộp đề cương'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
