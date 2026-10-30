import React, { useRef, useState } from 'react'
import { FileText, FileUp, UploadCloud, X } from 'lucide-react'
import { formatReportFileSize } from '../services/reports.service'

interface SubmitReportModalProps {
  open: boolean
  onClose: () => void
  onSubmitReport: (file: File, note: string) => void
}

export const SubmitReportModal: React.FC<SubmitReportModalProps> = ({
  open,
  onClose,
  onSubmitReport,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [note, setNote] = useState<string>('')
  const [dragging, setDragging] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      setSelectedFile(null)
      setNote('')
      setDragging(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileUp size={20} className="text-[#1565C0]" />
            <h3 className="text-base font-bold text-slate-900">Nộp báo cáo tiến độ đồ án</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-xs text-slate-500 space-y-1 bg-blue-50/60 p-3.5 rounded-xl border border-blue-100">
            <p className="font-semibold text-slate-800">Quy định nộp báo cáo:</p>
            <p>
              • Định dạng được hỗ trợ:{' '}
              <strong className="text-slate-700">.pdf, .doc, .docx</strong>
            </p>
            <p>
              • Dung lượng tối đa: <strong className="text-slate-700">50MB</strong>
            </p>
            <p>
              • Cú pháp đặt tên:{' '}
              <em className="text-slate-600">Bao_cao_DATN_MSSV_HoTen.pdf</em>
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              if (file) setSelectedFile(file)
            }}
            className="hidden"
          />

          {/* Drag & Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const file = e.dataTransfer?.files?.[0] ?? null
              if (file) setSelectedFile(file)
            }}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
              dragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1565C0] flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <UploadCloud size={24} />
            </div>
            <div className="text-xs font-bold text-slate-800">
              Kéo thả tệp báo cáo vào đây, hoặc{' '}
              <span className="text-blue-600 hover:underline">duyệt từ thiết bị</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Hỗ trợ định dạng PDF, Word tối đa 50MB
            </p>
          </div>

          {/* Selected file indicator */}
          {selectedFile && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {selectedFile.name}
                  </div>
                  <div className="text-[10.5px] text-slate-400 mt-0.5">
                    {formatReportFileSize(selectedFile.size)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer shrink-0 ml-2"
              >
                Gỡ bỏ
              </button>
            </div>
          )}

          {/* Ghi chú tiến độ gửi GVHD */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Ghi chú gửi Giáo viên hướng dẫn:
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tóm tắt công việc đã hoàn thành hoặc khó khăn cần GVHD giải đáp..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!selectedFile}
            onClick={() => {
              if (selectedFile) {
                onSubmitReport(selectedFile, note.trim())
              }
            }}
            className={
              selectedFile
                ? 'px-5 py-2 rounded-xl text-xs font-bold uppercase transition-colors bg-[#1565C0] text-white hover:bg-[#0D47A1] cursor-pointer shadow-xs'
                : 'px-5 py-2 rounded-xl text-xs font-bold uppercase transition-colors bg-slate-200 text-slate-400 cursor-not-allowed'
            }
          >
            Xác nhận nộp
          </button>
        </div>
      </div>
    </div>
  )
}

