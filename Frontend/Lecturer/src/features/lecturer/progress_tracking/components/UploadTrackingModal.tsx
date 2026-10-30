import React, { useRef, useState } from 'react'
import { FileUp, UploadCloud, X } from 'lucide-react'
import type { TrackingSheetItem } from '../types/progressTracking.types'

interface UploadTrackingModalProps {
  item: TrackingSheetItem | null
  onClose: () => void
  onConfirm: (id: string, fileName?: string) => void
}

export const UploadTrackingModal: React.FC<UploadTrackingModalProps> = ({
  item,
  onClose,
  onConfirm,
}) => {
  const [selectedFileName, setSelectedFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!item) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFileName(file.name)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fileName =
      selectedFileName || `Phieu-theo-doi-${item.name.replace(/\s+/g, '-')}.pdf`
    onConfirm(item.id, fileName)
    onClose()
  }

  return (
    <div
      id="uploadTrackingModal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
            <FileUp className="w-4 h-4 text-blue-600" />
            <span>Nộp phiếu theo dõi tiến trình</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="modal-close-btn text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 text-[13px]">
            <div>
              <span className="text-slate-500">Sinh viên:</span>{' '}
              <b id="modalStudentName" className="text-slate-900">
                {item.name} ({item.mssv})
              </b>
              <div className="text-[12px] text-slate-600 mt-0.5" id="modalTopicName">
                Đề tài: {item.topic}
              </div>
            </div>

            <div>
              <label
                htmlFor="trackingFileInput"
                className="block text-slate-700 font-semibold mb-1.5"
              >
                Chọn file phiếu theo dõi (.pdf, .docx): <span className="text-rose-500">*</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 text-center bg-slate-50 transition cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="trackingFileInput"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center">
                  <UploadCloud className="w-8 h-8 text-blue-600 mb-1" />
                  <span className="text-slate-700 font-medium text-xs">
                    {selectedFileName ? (
                      <span className="text-blue-600 font-semibold">
                        Tệp đã chọn: {selectedFileName}
                      </span>
                    ) : (
                      'Bấm để chọn file tải lên'
                    )}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5" id="selectedFileName">
                    Định dạng hỗ trợ: .pdf, .docx (tối đa 10MB)
                  </span>
                </div>
              </div>
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
              id="btnConfirmSubmitTracking"
              className="h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition cursor-pointer shadow-xs"
            >
              Xác nhận nộp phiếu
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

