import React, { useEffect, useState } from 'react'
import { Edit3, X } from 'lucide-react'
import type { GuidingScoreItem } from '../types/guidingScore.types'

interface GradingModalProps {
  item: GuidingScoreItem | null
  onClose: () => void
  onSave: (id: string, score: number, comment: string) => void
}

export const GradingModal: React.FC<GradingModalProps> = ({ item, onClose, onSave }) => {
  const [scoreVal, setScoreVal] = useState('')
  const [commentVal, setCommentVal] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (item) {
      setScoreVal(item.score !== null && item.score !== undefined ? String(item.score) : '')
      setCommentVal(item.comment || '')
      setErrorMsg('')
    }
  }, [item])

  if (!item) return null

  const hasScore =
    item.score !== null && item.score !== undefined && item.score !== ('' as unknown as number)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = scoreVal.trim().replace(',', '.')
    if (trimmed === '' || Number.isNaN(Number(trimmed))) {
      setErrorMsg('Vui lòng nhập điểm hợp lệ từ 0.0 đến 10.0!')
      return
    }

    const num = Number(trimmed)
    if (num < 0 || num > 10) {
      setErrorMsg('Vui lòng nhập điểm hợp lệ từ 0.0 đến 10.0!')
      return
    }

    const rounded = Math.round(num * 10) / 10
    onSave(item.id, rounded, commentVal.trim())
    onClose()
  }

  return (
    <div
      id="gradingModal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[520px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-600" />
            <span id="modalTitle">{hasScore ? 'Sửa điểm hướng dẫn' : 'Chấm điểm hướng dẫn'}</span>
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
            {/* Box thông tin sinh viên */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div>
                <span className="text-slate-500">Sinh viên:</span>{' '}
                <b id="modalStudentName" className="text-slate-900">
                  {item.name}
                </b>
              </div>
              <div className="text-[12px] text-slate-600" id="modalStudentMajor">
                <span className="font-mono">{item.mssv}</span>
                <span className="text-slate-300 mx-1">·</span>
                <span>{item.major || 'Công nghệ thông tin'}</span>
              </div>
              <div
                className="text-[12px] text-slate-700 font-medium pt-1 border-t border-slate-200/80 mt-1"
                id="modalTopicName"
              >
                Đề tài: {item.topic}
              </div>
            </div>

            {/* Điểm hướng dẫn */}
            <div>
              <label htmlFor="scoreInput" className="block text-slate-700 font-semibold mb-1.5">
                Điểm hướng dẫn (Hệ 10): <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="scoreInput"
                  min="0"
                  max="10"
                  step="0.1"
                  value={scoreVal}
                  onChange={(e) => {
                    setScoreVal(e.target.value)
                    if (errorMsg) setErrorMsg('')
                  }}
                  placeholder="VD: 8.2"
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-[13px] font-bold text-slate-900 outline-none focus:bg-white transition ${
                    errorMsg
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-200'
                      : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
              </div>
              {errorMsg ? (
                <div className="text-[11.5px] text-rose-600 font-semibold mt-1">{errorMsg}</div>
              ) : (
                <div className="text-[11px] text-slate-400 mt-1">
                  Nhập số từ 0.0 đến 10.0 (chấm cách nhau 0.1)
                </div>
              )}
            </div>

            {/* Nhận xét */}
            <div>
              <label htmlFor="commentInput" className="block text-slate-700 font-semibold mb-1.5">
                Nhận xét của Giảng viên hướng dẫn:
              </label>
              <textarea
                id="commentInput"
                rows={3}
                value={commentVal}
                onChange={(e) => setCommentVal(e.target.value)}
                placeholder="VD: Tiến độ tốt, cần bổ sung đánh giá kết quả..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-[13px] outline-none focus:border-blue-500 focus:bg-white transition resize-none"
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
              id="btnSaveGrading"
              className="h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition cursor-pointer shadow-xs"
            >
              Lưu điểm & Nhận xét
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GradingModal
