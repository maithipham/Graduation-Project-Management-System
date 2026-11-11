import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  FileX,
  Minus,
  Plus,
  Printer,
} from 'lucide-react'
import { useMyInfo } from '@/features/auth'
import { toast } from '@/shared/components/feedback/toast.store'
import { Skeleton } from '@/shared/components/ui'
import { cn, formatDate } from '@/shared/utils'
import { useMyOutline } from '../hooks/useOutlineManagement'
import { useMyTopicOverview } from '../hooks/useTopicTitle'
import { extractOutlineFileName, isSafeFileUrl } from '../services/outline.service'
import { getOutlineDeadlineDisplay } from '../utils/outlineDeadline'

export default function StudentOutlinePreviewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: user } = useMyInfo()
  const {
    data: outlineData,
    isPending: isOutlineLoading,
    isError: isOutlineError,
  } = useMyOutline()
  const {
    data: topicOverview,
    isPending: isTopicLoading,
    isError: isTopicError,
  } = useMyTopicOverview()

  const deadlineSource = outlineData ?? topicOverview
  const isMetaLoading = isOutlineLoading && isTopicLoading
  const isMetaError = isOutlineError && isTopicError
  const deadlineDisplay = getOutlineDeadlineDisplay(deadlineSource)

  const fileUrl = searchParams.get('url') || outlineData?.outlineFile || ''
  const hasValidFileUrl = isSafeFileUrl(fileUrl)
  const fileName =
    searchParams.get('file') ||
    (fileUrl ? extractOutlineFileName(fileUrl) : outlineData?.title || 'Đề cương đồ án tốt nghiệp')
  const isPdfUrl = hasValidFileUrl && /\.pdf(?:$|\?)/i.test(fileUrl)

  const [scale, setScale] = useState<number>(1.0)

  useEffect(() => {
    document.title = `${fileName} - Xem trước`
  }, [fileName])

  const handleBack = () => {
    if (window.opener) {
      window.close()
    } else {
      navigate('/student/outline')
    }
  }

  const handleDownload = () => {
    if (!hasValidFileUrl) {
      toast.warning('Chưa có tệp đề cương để tải xuống.')
      return
    }
    window.open(fileUrl, '_blank', 'noopener,noreferrer')
  }

  const studentName =
    outlineData?.studentName ||
    user?.name?.trim() ||
    topicOverview?.histories?.[0]?.studentName ||
    'Sinh viên'
  const studentCode =
    outlineData?.studentCode || topicOverview?.histories?.[0]?.studentCode || ''
  const topicName =
    outlineData?.topicName ||
    topicOverview?.officialName ||
    topicOverview?.provisionalName ||
    'Chưa cập nhật tên đề tài'
  const mentorName = deadlineSource?.lecturerName || 'Chưa phân công'
  const reviewerName = outlineData?.reviewerName || 'Chưa phân công'

  return (
    <div className="bg-slate-700 text-slate-800 min-h-screen flex flex-col">
      {/* Document Viewer Header */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft size={16} />
            <span>Quay lại</span>
          </button>
          <div className="h-4 w-px bg-slate-700 mx-1 shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={16} className="text-rose-400 shrink-0" />
            <span className="text-sm font-semibold text-white tracking-wide truncate max-w-xs md:max-w-md">
              {fileName}
            </span>
          </div>
          {outlineData?.statusDescription && (
            <span className="hidden sm:inline-block rounded bg-emerald-500/20 text-emerald-300 text-[11px] px-2 py-0.5 font-medium border border-emerald-500/30 shrink-0">
              {outlineData.statusDescription}
            </span>
          )}
        </div>

        {/* Viewer Tools */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setScale((prev) => Math.max(0.6, +(prev - 0.1).toFixed(1)))}
              className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 cursor-pointer"
              title="Thu nhỏ"
            >
              <Minus size={14} />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-300">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setScale((prev) => Math.min(1.6, +(prev + 0.1).toFixed(1)))}
              className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 cursor-pointer"
              title="Phóng to"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
            title="In tài liệu"
          >
            <Printer size={14} />
            <span className="hidden md:inline">In</span>
          </button>

          <button
            type="button"
            disabled={!hasValidFileUrl}
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Download size={14} />
            <span>Tải về</span>
          </button>
        </div>
      </header>

      {/* Preview Canvas */}
      <main className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center">
        <div
          style={{
            transform: `scale(${scale})`,
            width: '210mm',
            minHeight: '297mm',
            padding: '25mm 20mm',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          }}
          className="bg-white text-slate-900 transition-transform origin-top duration-150 mx-auto flex flex-col"
        >
          {/* Document Header */}
          <div className="text-center space-y-1 pb-6 border-b-2 border-slate-900">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-600">
              BỘ NÔNG NGHIỆP VÀ MÔI TRƯỜNG
            </p>
            <p className="text-sm font-bold uppercase tracking-wider">TRƯỜNG ĐẠI HỌC THỦY LỢI</p>
            <p className="text-xs font-semibold text-slate-700">KHOA CÔNG NGHỆ THÔNG TIN</p>
            <div className="w-24 h-0.5 bg-slate-800 mx-auto my-2" />
            <h1 className="text-xl font-extrabold uppercase tracking-wide pt-4 text-[#1565C0]">
              ĐỀ CƯƠNG ĐỒ ÁN TỐT NGHIỆP
            </h1>
          </div>

          {/* Document Metadata */}
          <div className="mt-8 space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-slate-700">Tên đề tài:</span>
              <span className="col-span-2 font-semibold text-slate-900">
                {isMetaLoading ? <Skeleton className="h-4 w-64" /> : topicName}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-slate-700">Sinh viên thực hiện:</span>
              <span className="col-span-2">
                {studentName} {studentCode ? `- MSSV: ${studentCode}` : ''}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-slate-700">Giảng viên hướng dẫn:</span>
              <span className="col-span-2 font-semibold text-[#1565C0]">{mentorName}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-slate-700">Giáo viên nhận xét:</span>
              <span className="col-span-2 font-semibold text-slate-900">{reviewerName}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-slate-700">Hạn nộp đề tài / đề cương:</span>
              <span className="col-span-2">
                {isMetaLoading ? (
                  <Skeleton className="h-4 w-56" />
                ) : isMetaError ? (
                  <span className="text-rose-600 font-medium">Không tải được thời hạn nộp.</span>
                ) : (
                  <span className={cn('font-semibold', deadlineDisplay.toneClassName)}>
                    {deadlineDisplay.text}
                  </span>
                )}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-slate-700">Trạng thái đề cương:</span>
              <span className="col-span-2 font-medium text-slate-800">
                {isOutlineLoading ? (
                  <Skeleton className="h-4 w-36" />
                ) : (
                  outlineData?.statusDescription || 'Chưa nộp đề cương'
                )}
              </span>
            </div>
            {outlineData?.submittedAt && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-bold text-slate-700">Thời gian nộp gần nhất:</span>
                <span className="col-span-2 text-slate-700">
                  {formatDate(outlineData.submittedAt, 'full')}
                </span>
              </div>
            )}
          </div>

          {/* Feedback Section */}
          {(outlineData?.reviewFeedback || outlineData?.advisorFeedback) && (
            <div className="mt-6 space-y-3 text-xs border-t border-slate-200 pt-5">
              {outlineData.reviewFeedback && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <div className="font-bold text-slate-800 mb-1">
                    Nhận xét của GV thẩm định ({reviewerName}):
                  </div>
                  <p className="text-slate-700 leading-relaxed">{outlineData.reviewFeedback}</p>
                </div>
              )}
              {outlineData.advisorFeedback && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <div className="font-bold text-slate-800 mb-1">
                    Nhận xét của GVHD ({mentorName}):
                  </div>
                  <p className="text-slate-700 leading-relaxed">{outlineData.advisorFeedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Embedded PDF or File Download Link */}
          <div className="mt-6 pt-5 border-t border-slate-200 flex-1 flex flex-col">
            {isOutlineLoading ? (
              <Skeleton className="h-96 w-full rounded-lg" />
            ) : isPdfUrl ? (
              <iframe
                src={fileUrl}
                title={fileName}
                className="w-full flex-1 min-h-[520px] border border-slate-200 rounded-lg"
              />
            ) : hasValidFileUrl ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center space-y-3">
                <FileText size={32} className="text-[#1565C0] mx-auto" />
                <p className="text-sm font-semibold text-slate-800">{fileName}</p>
                <p className="text-xs text-slate-500">
                  Trình duyệt không hỗ trợ xem trực tiếp định dạng tệp này. Vui lòng mở hoặc tải tệp về máy.
                </p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1565C0] text-white text-xs font-semibold hover:bg-[#0D47A1] transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>Mở tệp đề cương</span>
                </a>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500 text-xs space-y-2">
                <FileX size={32} className="text-slate-300 mx-auto" />
                <p>Chưa có tệp đề cương nào được nộp từ hệ thống.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
