import React, { useState } from 'react'
import { FileText, FileUp, Printer, UploadCloud } from 'lucide-react'
import type {
  ReportCheckItem,
  ReportPreviewDocState,
} from '../types/reportCheck.types'

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
  const [selectedFile, setSelectedFile] = useState('')
  const [rate, setRate] = useState<string>(
    item?.plagiarismRate !== null && item?.plagiarismRate !== undefined
      ? String(item.plagiarismRate)
      : '15',
  )
  const [rateError, setRateError] = useState('')

  if (!item) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedRate = Number(rate)
    if (rate.trim() === '' || Number.isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
      setRateError('Vui lòng nhập tỷ lệ trùng lặp hợp lệ từ 0% đến 100%.')
      return
    }
    const finalFileName =
      selectedFile || item.plagiarismFile || `Ket-qua-trung-lap-${item.mssv}.pdf`
    onSave(item.id, finalFileName, parsedRate)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form
        noValidate
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl w-full max-w-[520px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
            <FileUp className="w-4 h-4 text-blue-600" /> Cập nhật kết quả kiểm tra trùng lặp
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer text-lg font-light leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 text-[13px]">
          <div>
            <span className="text-slate-500">Sinh viên:</span>{' '}
            <b className="text-slate-800">
              {item.name} ({item.mssv})
            </b>
            <div className="text-[12px] text-slate-600 mt-0.5">{item.topic}</div>
          </div>

          <div>
            <span className="block text-slate-700 font-semibold mb-1.5">
              Tải lên file kết quả Turnitin / DoIT (.pdf):
            </span>
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center bg-slate-50 cursor-pointer">
              <input
                type="file"
                id="plagiarismFileInput"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setSelectedFile(file.name)
                }}
              />
              <label htmlFor="plagiarismFileInput" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className="w-8 h-8 text-blue-600 mb-1" />
                <span className="text-slate-700 font-medium text-xs">
                  {selectedFile
                    ? `Tệp đã chọn: ${selectedFile}`
                    : 'Bấm để chọn file kết quả (.pdf)'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">Dung lượng tối đa 15MB</span>
              </label>
            </div>
          </div>

          <div>
            <label
              htmlFor="plagiarismRateInput"
              className="block text-slate-700 font-semibold mb-1.5"
            >
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
                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                    : 'border-slate-300 focus:border-blue-500'
                }`}
              />
              <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
            </div>
            {rateError ? (
              <p className="text-[11.5px] text-[#DC2626] font-semibold mt-1">{rateError}</p>
            ) : (
              <p className="text-[11.5px] text-slate-500 mt-1">
                Quy định chuẩn: ≤ 35% là hợp lệ để bảo vệ.
              </p>
            )}
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="h-8 px-4 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-[12px] font-bold transition cursor-pointer shadow-xs"
          >
            Lưu kết quả
          </button>
        </div>
      </form>
    </div>
  )
}

interface RejectReportModalProps {
  item: ReportCheckItem | null
  onClose: () => void
  onConfirm: (id: string, comment: string) => void
}

export const RejectReportModal: React.FC<RejectReportModalProps> = ({
  item,
  onClose,
  onConfirm,
}) => {
  const [comment, setComment] = useState('')

  if (!item) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(item.id, comment)
    setComment('')
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setComment('')
          onClose()
        }
      }}
    >
      <form
        noValidate
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl w-full max-w-[480px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-slate-900">
            Từ chối duyệt báo cáo đồ án
          </h3>
          <button
            type="button"
            onClick={() => {
              setComment('')
              onClose()
            }}
            aria-label="Đóng"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer text-lg font-light leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 text-[13px]">
          <p className="text-slate-600">
            Xác nhận từ chối báo cáo của sinh viên <b className="text-slate-900">{item.name}</b>?
          </p>
          <div>
            <label htmlFor="rejectReportCommentInput" className="block text-slate-700 font-semibold mb-1">
              Nhận xét lý do chưa đạt:
            </label>
            <textarea
              id="rejectReportCommentInput"
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
            onClick={() => {
              setComment('')
              onClose()
            }}
            className="h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="h-8 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold transition cursor-pointer shadow-xs"
          >
            Xác nhận
          </button>
        </div>
      </form>
    </div>
  )
}



interface ReportDocumentPreviewModalProps {
  preview: ReportPreviewDocState | null
  onClose: () => void
}

export const ReportDocumentPreviewModal: React.FC<ReportDocumentPreviewModalProps> = ({
  preview,
  onClose,
}) => {
  if (!preview) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col">
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between text-white shrink-0 shadow-lg select-none">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate text-slate-100 flex items-center gap-2">
              <span>{preview.fileName}</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {preview.docType}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Sinh viên: {preview.studentName || 'Đinh Gia Huy'} • Hệ thống TLU Capstone
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 hover:bg-slate-800 text-slate-300 rounded-lg transition cursor-pointer"
            title="In"
            aria-label="In tài liệu"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-lg transition cursor-pointer ml-1 text-lg font-light leading-none"
            title="Đóng"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-900/90 p-4 sm:p-8 flex justify-center items-start">
        <div className="bg-white text-slate-900 rounded-xl shadow-2xl p-8 sm:p-12 w-full max-w-3xl space-y-6 font-serif">
          <div className="text-center border-b border-slate-200 pb-6 font-sans">
            <div className="text-xs uppercase tracking-widest font-bold text-slate-500">
              TRƯỜNG ĐẠI HỌC THỦY LỢI — KHOA CÔNG NGHỆ THÔNG TIN
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-4 uppercase">
              {preview.docType.toUpperCase()}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Tệp tài liệu: <strong>{preview.fileName}</strong>
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 font-sans grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500">Sinh viên:</span>
              <div className="font-bold text-slate-800 mt-0.5">
                {preview.studentName || 'Đinh Gia Huy'}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Thời gian:</span>
              <div className="font-bold text-slate-800 mt-0.5">18/10/2026 14:30 (GMT+07)</div>
            </div>
          </div>

          <div className="space-y-4 text-sm leading-relaxed text-slate-800 font-sans">
            <p className="text-justify indent-8">
              Tài liệu đính kèm phục vụ quá trình kiểm tra tiến độ và giám sát chất lượng đồ án tốt
              nghiệp khóa 2026-2027. Đảm bảo tuân thủ đầy đủ quy định về liêm chính học thuật và cấu
              trúc báo cáo chuẩn của Trường Đại học Thủy Lợi.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-200 flex justify-between font-sans text-xs text-slate-500">
            <div>TLU Document Viewer</div>
            <div>Trang 1 / 1</div>
          </div>
        </div>
      </div>
    </div>
  )
}

