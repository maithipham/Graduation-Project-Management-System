import React, { useEffect } from 'react'
import {
  Download,
  ExternalLink,
  FileText,
  X,
} from 'lucide-react'
import { toast } from '@/shared/components/feedback/toast.store'
import { Button } from '@/shared/components/ui'
import { formatDate } from '@/shared/utils'
import type { ThesisOutlineResponse } from '../types/outlineReview.types'
import { downloadOutlineFile } from '../services/outlineReview.service'
import {
  getFileNameFromUrl,
  getOutlineFileExtensionLabel,
  getOutlineStatusBadgeClass,
  getOutlineStatusLabel,
  isPdfOutlineFileUrl,
  isSafeOutlineFileUrl,
} from '../utils/outlineReview.utils'

interface OutlineClassroomPreviewModalProps {
  item: ThesisOutlineResponse | null
  isAlreadyRead: boolean
  onUnlockRead: (item: ThesisOutlineResponse) => void
  onClose: () => void
}

export const OutlineClassroomPreviewModal: React.FC<OutlineClassroomPreviewModalProps> = ({
  item,
  isAlreadyRead,
  onUnlockRead,
  onClose,
}) => {
  useEffect(() => {
    if (!item) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    if (!isAlreadyRead) {
      onUnlockRead(item)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [item, isAlreadyRead, onClose, onUnlockRead])

  if (!item) return null

  const outlineUrl = item.outlineFile
  const studentName = item.studentName || 'Sinh viên'
  const studentCode = item.studentCode || ''
  const topicName = item.topicName || item.title || 'Đề tài Đồ án Tốt nghiệp'
  const supervisorName = item.lecturerName || 'Chưa phân công'
  const reviewerName = item.reviewerName || 'Chưa phân công'
  const docTitle = getFileNameFromUrl(outlineUrl, `De-cuong-${studentName}.pdf`)
  const extLabel = getOutlineFileExtensionLabel(outlineUrl)
  const canPreviewPdf = isSafeOutlineFileUrl(outlineUrl) && isPdfOutlineFileUrl(outlineUrl)

  const handleDownload = () => {
    if (outlineUrl && isSafeOutlineFileUrl(outlineUrl)) {
      void downloadOutlineFile(outlineUrl, docTitle)
    } else {
      toast.info('Sinh viên chưa đính kèm tệp đề cương.')
    }
  }

  return (
    <div
      id="outlineClassroomPreviewModal"
      className="fixed inset-0 z-50 bg-[#202124] flex flex-col overflow-hidden animate-in fade-in duration-200 select-none"
    >
      {/* Top Bar Toolbar */}
      <header className="h-14 sm:h-16 bg-[#202124] border-b border-[#3c4043] flex items-center justify-between px-3 sm:px-6 shrink-0 z-30 shadow-md gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="px-2 py-0.5 rounded bg-[#EA4335] text-white text-[11px] font-extrabold tracking-wider shrink-0 shadow-xs">
            {extLabel}
          </span>
          <div className="min-w-0">
            <h2
              className="text-white text-[13.5px] sm:text-[14.5px] font-bold truncate max-w-[220px] sm:max-w-[460px]"
              title={docTitle}
            >
              {docTitle}
            </h2>
            <p className="text-[11.5px] text-slate-400 truncate">
              {studentName} ({studentCode})
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {outlineUrl && isSafeOutlineFileUrl(outlineUrl) && (
            <>
              <a
                href={outlineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 sm:w-9 h-8 sm:h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition"
                title="Mở tệp trong tab mới"
                aria-label="Mở tệp trong tab mới"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={handleDownload}
                className="w-8 sm:w-9 h-8 sm:h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
                title="Tải xuống tệp đính kèm"
                aria-label="Tải xuống tài liệu"
              >
                <Download className="w-4.5 h-4.5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Đóng xem trước (Phím Esc)"
            aria-label="Đóng xem trước"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Viewer Body: Aside Metadata Panel on Left + Real Document Viewer on Right */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-[#2b2d30]">
        {/* Left Aside Metadata Panel */}
        <aside className="w-full lg:w-80 xl:w-96 bg-[#282a2d] border-b lg:border-b-0 lg:border-r border-[#3c4043] p-4 overflow-y-auto shrink-0 space-y-4 text-xs text-slate-200">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Thông tin đề cương & sinh viên
            </div>
            <div className="rounded-xl bg-[#303134] p-3.5 space-y-2 border border-[#3c4043]">
              <div>
                <div className="text-slate-400">Tên đề tài</div>
                <div className="font-semibold text-white mt-0.5 leading-snug">
                  {topicName}
                </div>
              </div>
              <div className="flex justify-between gap-2 pt-1 border-t border-[#3c4043]">
                <span className="text-slate-400">Sinh viên</span>
                <span className="font-semibold text-white text-right">
                  {studentName} ({studentCode})
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">GVHD</span>
                <span className="text-slate-100 text-right">{supervisorName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">GVNX</span>
                <span className="text-slate-100 text-right">{reviewerName}</span>
              </div>
              {item.submittedAt && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Thời gian nộp</span>
                  <span className="text-slate-100 text-right">
                    {formatDate(item.submittedAt, 'full')}
                  </span>
                </div>
              )}
              {item.status && (
                <div className="flex justify-between gap-2 items-center">
                  <span className="text-slate-400">Trạng thái</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${getOutlineStatusBadgeClass(
                      item.status,
                    )}`}
                  >
                    {item.statusDescription || getOutlineStatusLabel(item.status)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {item.reviewFeedback && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Ý kiến đánh giá của GVNX
              </div>
              <div className="rounded-xl bg-[#303134] p-3.5 border border-[#3c4043] text-slate-200 leading-relaxed whitespace-pre-wrap">
                {item.reviewFeedback}
              </div>
            </div>
          )}

          {item.advisorFeedback && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Góp ý của GVHD
              </div>
              <div className="rounded-xl bg-[#303134] p-3.5 border border-[#3c4043] text-slate-200 leading-relaxed whitespace-pre-wrap">
                {item.advisorFeedback}
              </div>
            </div>
          )}
        </aside>

        {/* Right Main Viewer (PDF Iframe or Download Card) */}
        <main className="flex-1 min-h-0 p-4 flex items-center justify-center">
          {canPreviewPdf && outlineUrl ? (
            <iframe
              src={outlineUrl}
              title={docTitle}
              className="w-full h-full rounded-xl border border-[#3c4043] bg-white"
            />
          ) : outlineUrl && isSafeOutlineFileUrl(outlineUrl) ? (
            <div className="max-w-md w-full rounded-2xl bg-[#303134] border border-[#3c4043] p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white break-all">{docTitle}</p>
                <p className="text-xs text-slate-400">
                  Trình duyệt không hỗ trợ xem trực tiếp định dạng {extLabel}. Vui lòng tải xuống hoặc mở trong tab mới.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 flex-wrap">
                <Button
                  type="button"
                  onClick={handleDownload}
                  className="bg-[#1565C0] hover:bg-[#0D47A1] text-white"
                >
                  <Download className="w-4 h-4" /> Tải xuống tệp
                </Button>
                <a
                  href={outlineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-500 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Mở tab mới
                </a>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400 italic">
              Sinh viên chưa đính kèm tệp đề cương.
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
