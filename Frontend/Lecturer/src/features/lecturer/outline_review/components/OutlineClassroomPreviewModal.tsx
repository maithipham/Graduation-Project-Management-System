import React, { useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Minus,
  Plus,
  Printer,
  X,
} from 'lucide-react'
import { toast } from '@/shared/components/feedback/toast.store'
import type { ThesisOutlineResponse } from '../types/outlineReview.types'
import { getFileNameFromUrl } from '../utils/outlineReview.utils'

interface OutlineClassroomPreviewModalProps {
  item: ThesisOutlineResponse | null
  isAlreadyRead: boolean
  onUnlockRead: (item: ThesisOutlineResponse) => void
  onClose: () => void
}

const TOTAL_PAGES = 3

export const OutlineClassroomPreviewModal: React.FC<OutlineClassroomPreviewModalProps> = ({
  item,
  isAlreadyRead,
  onUnlockRead,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [prevItemId, setPrevItemId] = useState<string | null>(item?.publicId ?? null)

  if ((item?.publicId ?? null) !== prevItemId) {
    setPrevItemId(item?.publicId ?? null)
    setCurrentPage(1)
    setZoom(100)
  }

  const scrollAreaRef = useRef<HTMLElement>(null)
  const page1Ref = useRef<HTMLElement>(null)
  const page2Ref = useRef<HTMLElement>(null)
  const page3Ref = useRef<HTMLElement>(null)

  const goToPage = (pageNum: number) => {
    const next = Math.max(1, Math.min(TOTAL_PAGES, Number(pageNum) || 1))
    setCurrentPage(next)
    const refMap = { 1: page1Ref, 2: page2Ref, 3: page3Ref } as const
    const targetEl = refMap[next as 1 | 2 | 3]?.current
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  useEffect(() => {
    if (!item) return
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [item])

  useEffect(() => {
    if (!item) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        setCurrentPage((prev) => {
          const next = Math.max(1, prev - 1)
          const refMap = { 1: page1Ref, 2: page2Ref, 3: page3Ref } as const
          refMap[next as 1 | 2 | 3]?.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
          return next
        })
      } else if (e.key === 'ArrowRight') {
        setCurrentPage((prev) => {
          const next = Math.min(TOTAL_PAGES, prev + 1)
          const refMap = { 1: page1Ref, 2: page2Ref, 3: page3Ref } as const
          refMap[next as 1 | 2 | 3]?.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
          return next
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [item, onClose])

  if (!item) return null

  const studentName = item.studentName || 'Sinh viên'
  const studentCode = item.studentCode || ''
  const topicName = item.topicName || item.title || 'Đề tài Đồ án Tốt nghiệp'
  const supervisorName = item.lecturerName || 'Giảng viên hướng dẫn'
  const docTitle = getFileNameFromUrl(item.outlineFile, `De-cuong-${studentName}.pdf`)

  const handleDownload = () => {
    if (item.outlineFile) {
      window.open(item.outlineFile, '_blank')
    } else {
      toast.info('Sinh viên chưa đính kèm tệp đề cương.')
    }
  }

  const handleScroll = () => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return

    const scrollPos = scrollArea.scrollTop + 140
    let activePage = 1
    const pages = [
      { num: 1, el: page1Ref.current },
      { num: 2, el: page2Ref.current },
      { num: 3, el: page3Ref.current },
    ]
    for (const p of pages) {
      if (p.el && p.el.offsetTop <= scrollPos) {
        activePage = p.num
      }
    }
    if (activePage !== currentPage) {
      setCurrentPage(activePage)
    }

    if (!isAlreadyRead) {
      const threshold = 60
      const isAtBottom =
        scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - threshold
      if (isAtBottom) {
        onUnlockRead(item)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#202124] flex flex-col select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Bar Toolbar */}
      <header className="h-14 sm:h-16 bg-[#202124] border-b border-[#3c4043] flex items-center justify-between px-3 sm:px-6 shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded bg-[#EA4335] text-white text-[11px] font-extrabold tracking-wider shrink-0 shadow-xs">
              PDF
            </span>
            <div className="min-w-0">
              <h2 className="text-white text-[13.5px] sm:text-[14.5px] font-bold truncate tracking-wide max-w-[180px] sm:max-w-[420px]">
                {docTitle}
              </h2>
              <div className="hidden md:flex items-center gap-4 text-[11.5px] text-slate-400 mt-0.5 font-medium">
                <span>{studentName} ({studentCode})</span>
                {item.outlineFile && (
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" /> Mở tệp gốc
                  </button>
                )}
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
            max={TOTAL_PAGES}
            value={currentPage}
            onChange={(e) => goToPage(Number(e.target.value))}
            aria-label="Trang hiện tại"
            className="w-10 h-7 bg-[#303134] border border-[#5f6368] rounded text-center text-xs font-bold text-white outline-none focus:border-blue-400 transition"
          />
          <span className="text-slate-400">
            / <span className="text-slate-300 font-bold">{TOTAL_PAGES}</span>
          </span>

          <div className="h-4 w-px bg-[#5f6368] mx-1 sm:mx-2" />

          <button
            type="button"
            onClick={() => window.print()}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
            title="In tài liệu"
            aria-label="In tài liệu"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(70, z - 10))}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
            title="Thu nhỏ"
            aria-label="Thu nhỏ"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-[11.5px] font-bold text-slate-300 w-12 text-center font-mono">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(150, z + 10))}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
            title="Phóng to"
            aria-label="Phóng to"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Download & Close */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="w-8 sm:w-9 h-8 sm:h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
            title="Tải xuống tệp đính kèm"
            aria-label="Tải xuống tài liệu"
          >
            <Download className="w-4.5 h-4.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer ml-0.5"
            title="Đóng xem trước (Phím Esc)"
            aria-label="Đóng xem trước"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Viewer Body: Thumbnails on Left + Main Canvas on Right */}
      <div className="flex flex-1 overflow-hidden relative bg-[#3c4043]">
        {/* Left Thumbnail Drawer */}
        <aside className="w-40 sm:w-52 bg-[#282a2d] border-r border-[#3c4043] p-3 overflow-y-auto shrink-0 flex flex-col gap-3 select-none">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Các trang đề cương
          </div>

          {/* Thumbnail Page 1 */}
          <div
            onClick={() => goToPage(1)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                goToPage(1)
              }
            }}
            className={`p-2 rounded-xl cursor-pointer transition hover:bg-[#3c4043] ${
              currentPage === 1
                ? 'border-2 border-blue-500 ring-2 ring-blue-500/40 bg-[#3c4043]/80'
                : 'border border-transparent hover:border-slate-500 bg-[#303134]'
            }`}
          >
            <div className="text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
              <span>Trang 1</span>
              <span className="text-[10px] text-blue-400 font-semibold">Bìa &amp; Đặt vấn đề</span>
            </div>
            <div className="w-full h-32 bg-white rounded shadow-xs p-2 text-[6px] text-slate-400 overflow-hidden leading-tight flex flex-col items-center">
              <div className="font-bold text-slate-800 text-[6.5px] uppercase text-center">
                ĐH THỦY LỢI - KHOA CNTT
              </div>
              <div className="font-bold text-blue-800 text-[7px] uppercase mt-2 text-center">
                ĐỀ CƯƠNG ĐỒ ÁN TỐT NGHIỆP
              </div>
              <div className="w-16 h-0.5 bg-slate-300 my-1" />
              <div className="w-full space-y-1 mt-2 text-slate-500">
                <div className="h-1 bg-slate-200 rounded w-full" />
                <div className="h-1 bg-slate-200 rounded w-5/6" />
                <div className="h-1 bg-slate-200 rounded w-4/6" />
              </div>
            </div>
          </div>

          {/* Thumbnail Page 2 */}
          <div
            onClick={() => goToPage(2)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                goToPage(2)
              }
            }}
            className={`p-2 rounded-xl cursor-pointer transition hover:bg-[#3c4043] ${
              currentPage === 2
                ? 'border-2 border-blue-500 ring-2 ring-blue-500/40 bg-[#3c4043]/80'
                : 'border border-transparent hover:border-slate-500 bg-[#303134]'
            }`}
          >
            <div className="text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
              <span>Trang 2</span>
              <span className="text-[10px] text-slate-400 font-semibold">
                Kiến trúc &amp; Phương pháp
              </span>
            </div>
            <div className="w-full h-32 bg-white rounded shadow-xs p-2 text-[6px] text-slate-400 overflow-hidden leading-tight">
              <div className="font-bold text-slate-800 text-[6.5px]">
                III. PHƯƠNG PHÁP &amp; CÔNG NGHỆ
              </div>
              <div className="w-full h-10 border border-dashed border-slate-300 rounded my-1.5 flex items-center justify-center text-[7px] text-slate-400 font-mono">
                [Architecture Diagram]
              </div>
              <div className="space-y-1">
                <div className="h-1 bg-slate-200 rounded w-full" />
                <div className="h-1 bg-slate-200 rounded w-full" />
                <div className="h-1 bg-slate-200 rounded w-3/4" />
              </div>
            </div>
          </div>

          {/* Thumbnail Page 3 */}
          <div
            onClick={() => goToPage(3)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                goToPage(3)
              }
            }}
            className={`p-2 rounded-xl cursor-pointer transition hover:bg-[#3c4043] ${
              currentPage === 3
                ? 'border-2 border-blue-500 ring-2 ring-blue-500/40 bg-[#3c4043]/80'
                : 'border border-transparent hover:border-slate-500 bg-[#303134]'
            }`}
          >
            <div className="text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
              <span>Trang 3</span>
              <span className="text-[10px] text-slate-400 font-semibold">
                Kế hoạch 15 tuần
              </span>
            </div>
            <div className="w-full h-32 bg-white rounded shadow-xs p-2 text-[6px] text-slate-400 overflow-hidden leading-tight">
              <div className="font-bold text-slate-800 text-[6.5px]">V. TIẾN ĐỘ 15 TUẦN</div>
              <div className="w-full space-y-1 my-1">
                <div className="h-1.5 bg-blue-100 rounded w-full" />
                <div className="h-1.5 bg-blue-100 rounded w-full" />
                <div className="h-1.5 bg-blue-100 rounded w-full" />
              </div>
              <div className="flex justify-between items-end mt-4 pt-2 border-t border-slate-200">
                <div className="text-[5.5px] font-bold text-slate-600">SINH VIÊN KÝ</div>
                <div className="text-[5.5px] font-bold text-slate-600">GVHD KÝ</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Document Viewing Canvas */}
        <main
          ref={scrollAreaRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-10 flex justify-center items-start relative select-text"
        >
          {/* Floating Navigation Arrows */}
          <button
            type="button"
            onClick={() => {
              if (currentPage > 1) goToPage(currentPage - 1)
            }}
            className="fixed left-48 sm:left-60 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#202124]/90 hover:bg-[#303134] text-white shadow-2xl flex items-center justify-center transition cursor-pointer z-20 backdrop-blur-xs border border-white/15"
            title="Trang trước (Phím Mũi tên Trái)"
            aria-label="Trang trước"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (currentPage < TOTAL_PAGES) goToPage(currentPage + 1)
            }}
            className="fixed right-6 sm:right-10 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#202124]/90 hover:bg-[#303134] text-white shadow-2xl flex items-center justify-center transition cursor-pointer z-20 backdrop-blur-xs border border-white/15"
            title="Trang sau (Phím Mũi tên Phải)"
            aria-label="Trang sau"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Document Paper Canvas Wrapper */}
          <div
            className="transition-transform duration-200 origin-top"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            {/* PAGE 1 */}
            <article
              ref={page1Ref}
              className="w-[780px] min-h-[1100px] bg-white text-slate-800 shadow-2xl rounded-xs p-12 sm:p-16 mb-10 transition-all font-serif"
            >
              <div className="text-center space-y-1 pb-6 border-b-2 border-slate-900">
                <div className="text-[13px] font-bold uppercase tracking-wider text-slate-900">
                  BỘ GIÁO DỤC VÀ ĐÀO TẠO — TRƯỜNG ĐẠI HỌC THỦY LỢI
                </div>
                <div className="text-[14px] font-extrabold uppercase tracking-wide text-blue-900">
                  KHOA CÔNG NGHỆ THÔNG TIN — BỘ MÔN KỸ THUẬT PHẦN MỀM
                </div>
                <div className="w-24 h-0.5 bg-slate-900 mx-auto my-2" />
              </div>

              <div className="text-center my-8 space-y-2">
                <h1 className="text-[20px] font-black uppercase text-slate-900 tracking-wide">
                  BÁO CÁO ĐỀ CƯƠNG ĐỒ ÁN TỐT NGHIỆP
                </h1>
                <p className="text-[13.5px] italic text-slate-600 font-sans">
                  Chương trình đào tạo Kỹ sư / Cử nhân Công nghệ Thông tin
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-300 rounded-lg p-5 my-6 space-y-3 font-sans text-[13px]">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-700 min-w-[150px] shrink-0">
                    1. Tên đề tài đồ án:
                  </span>
                  <span className="font-bold text-blue-900 text-[14px] leading-snug">
                    {topicName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 min-w-[150px] shrink-0">
                    2. Sinh viên thực hiện:
                  </span>
                  <span className="font-bold text-slate-900">{studentName}</span>
                  <span className="text-slate-400 mx-1">•</span>
                  <span>
                    MSSV: <b className="font-mono text-slate-800">{studentCode}</b>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 min-w-[150px] shrink-0">
                    3. Giảng viên hướng dẫn:
                  </span>
                  <span className="font-bold text-slate-900">
                    {supervisorName}
                  </span>
                  <span className="text-slate-500 text-[12px]">(Khoa CNTT - ĐH Thủy Lợi)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 min-w-[150px] shrink-0">
                    4. Thời gian thực hiện:
                  </span>
                  <span className="font-medium text-slate-800">
                    15 tuần theo kế hoạch đào tạo
                  </span>
                </div>
              </div>

              <div className="space-y-3 my-6 font-sans">
                <h2 className="text-[14.5px] font-bold uppercase text-slate-900 border-b border-slate-200 pb-1">
                  I. ĐẶT VẤN ĐỀ VÀ TÍNH CẤP THIẾT CỦA ĐỀ TÀI
                </h2>
                <p className="text-[13px] text-slate-700 text-justify leading-relaxed">
                  Đề tài <b>&ldquo;{topicName}&rdquo;</b> hướng đến nghiên cứu lý thuyết, phân tích nghiệp vụ và xây dựng giải pháp công nghệ đáp ứng chuẩn đầu ra của đồ án tốt nghiệp đại học.
                </p>
                <p className="text-[13px] text-slate-700 text-justify leading-relaxed">
                  Bản đề cương chi tiết này xác định rõ mục tiêu, phạm vi nghiên cứu, kiến trúc giải pháp và lộ trình thực nghiệm cụ thể qua từng tuần làm việc dưới sự hướng dẫn của cán bộ giảng dạy.
                </p>
              </div>

              <div className="space-y-3 my-6 font-sans">
                <h2 className="text-[14.5px] font-bold uppercase text-slate-900 border-b border-slate-200 pb-1">
                  II. MỤC TIÊU VÀ PHẠM VI NGHIÊN CỨU
                </h2>
                <ul className="list-disc pl-5 text-[13px] text-slate-700 space-y-1.5 leading-relaxed">
                  <li>
                    <b>Mục tiêu tổng quát:</b> Thiết kế, xây dựng và hoàn thiện giải pháp phần mềm hoặc mô hình công nghệ theo đúng yêu cầu đã đăng ký.
                  </li>
                  <li>
                    <b>Mục tiêu cụ thể:</b> Hoàn thành khảo sát hiện trạng, thiết kế hệ thống, lập trình thử nghiệm và viết toàn văn báo cáo tốt nghiệp.
                  </li>
                  <li>
                    <b>Phạm vi nghiên cứu:</b> Triển khai thử nghiệm trong môi trường ứng dụng thực tế.
                  </li>
                </ul>
              </div>

              <div className="pt-8 text-center text-[12px] font-mono text-slate-400 border-t border-slate-200">
                — Trang 1 / 3 —
              </div>
            </article>

            {/* PAGE 2 */}
            <article
              ref={page2Ref}
              className="w-[780px] min-h-[1100px] bg-white text-slate-800 shadow-2xl rounded-xs p-12 sm:p-16 mb-10 transition-all font-sans"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-200 pb-2 mb-6">
                <span>ĐỀ CƯƠNG ĐỒ ÁN TỐT NGHIỆP — ĐẠI HỌC THỦY LỢI</span>
                <span>{studentName}</span>
              </div>

              <div className="space-y-4 my-6">
                <h2 className="text-[14.5px] font-bold uppercase text-slate-900 border-b border-slate-200 pb-1">
                  III. PHƯƠNG PHÁP TIẾP CẬN VÀ CÔNG NGHỆ SỬ DỤNG
                </h2>
                <p className="text-[13px] text-slate-700 text-justify leading-relaxed">
                  Đề tài áp dụng các công nghệ tiêu chuẩn, kiến trúc phân tầng rõ ràng giữa tầng dữ liệu, tầng logic nghiệp vụ và tầng giao diện:
                </p>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl my-4 text-center">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-3">
                    Sơ đồ tổng quan kiến trúc (System Overview)
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-[12px]">
                    <div className="p-3 bg-white border border-blue-200 rounded-lg shadow-2xs font-bold text-blue-900">
                      <div>Presentation Layer</div>
                      <div className="text-[10.5px] font-normal text-slate-500 mt-1">
                        Web / Mobile Interface
                      </div>
                    </div>
                    <div className="p-3 bg-white border border-indigo-200 rounded-lg shadow-2xs font-bold text-indigo-900">
                      <div>Business Logic</div>
                      <div className="text-[10.5px] font-normal text-slate-500 mt-1">
                        API &amp; Processing Services
                      </div>
                    </div>
                    <div className="p-3 bg-white border border-emerald-200 rounded-lg shadow-2xs font-bold text-emerald-900">
                      <div>Data Storage</div>
                      <div className="text-[10.5px] font-normal text-slate-500 mt-1">
                        Database &amp; Storage
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 my-6">
                <h2 className="text-[14.5px] font-bold uppercase text-slate-900 border-b border-slate-200 pb-1">
                  IV. NỘI DUNG NGHIÊN CỨU DỰ KIẾN
                </h2>
                <ul className="list-decimal pl-5 text-[13px] text-slate-700 space-y-1.5 leading-relaxed">
                  <li>
                    <b>Chương 1:</b> Tổng quan lý thuyết và cơ sở nghiên cứu của đề tài.
                  </li>
                  <li>
                    <b>Chương 2:</b> Phân tích yêu cầu và thiết kế kiến trúc hệ thống.
                  </li>
                  <li>
                    <b>Chương 3:</b> Cài đặt, triển khai và lập trình giải pháp.
                  </li>
                  <li>
                    <b>Chương 4:</b> Đánh giá thực nghiệm, kết luận và hướng phát triển.
                  </li>
                </ul>
              </div>

              <div className="pt-12 text-center text-[12px] font-mono text-slate-400 border-t border-slate-200">
                — Trang 2 / 3 —
              </div>
            </article>

            {/* PAGE 3 */}
            <article
              ref={page3Ref}
              className="w-[780px] min-h-[1100px] bg-white text-slate-800 shadow-2xl rounded-xs p-12 sm:p-16 mb-10 transition-all font-sans"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-200 pb-2 mb-6">
                <span>ĐỀ CƯƠNG ĐỒ ÁN TỐT NGHIỆP — ĐẠI HỌC THỦY LỢI</span>
                <span>{studentName}</span>
              </div>

              <div className="space-y-4 my-6">
                <h2 className="text-[14.5px] font-bold uppercase text-slate-900 border-b border-slate-200 pb-1">
                  V. KẾ HOẠCH TRIỂN KHAI CHI TIẾT (15 TUẦN)
                </h2>

                <div className="border border-slate-200 rounded-lg overflow-hidden text-[12px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                      <tr>
                        <th className="p-2.5 border-b border-slate-200 w-24">Giai đoạn</th>
                        <th className="p-2.5 border-b border-slate-200">Nội dung công việc</th>
                        <th className="p-2.5 border-b border-slate-200 w-28">Thời gian</th>
                        <th className="p-2.5 border-b border-slate-200 w-32">Kết quả đầu ra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 font-bold text-blue-900">Giai đoạn 1</td>
                        <td className="p-2.5">
                          Khảo sát lý thuyết, nghiên cứu tài liệu &amp; xây dựng đề cương.
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">Tuần 1 - 3</td>
                        <td className="p-2.5 font-medium text-emerald-700">Đề cương chi tiết</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-blue-900">Giai đoạn 2</td>
                        <td className="p-2.5">
                          Thiết kế kiến trúc hệ thống và xây dựng cơ sở dữ liệu.
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">Tuần 4 - 7</td>
                        <td className="p-2.5 font-medium text-emerald-700">Tài liệu thiết kế</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-blue-900">Giai đoạn 3</td>
                        <td className="p-2.5">
                          Lập trình module cốt lõi, tích hợp các chức năng chính.
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">Tuần 8 - 11</td>
                        <td className="p-2.5 font-medium text-emerald-700">Bản thử nghiệm</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-blue-900">Giai đoạn 4</td>
                        <td className="p-2.5">
                          Kiểm thử, viết toàn văn báo cáo và chuẩn bị bảo vệ.
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">Tuần 12 - 15</td>
                        <td className="p-2.5 font-medium text-emerald-700">Báo cáo hoàn chỉnh</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-8 my-6 flex justify-between items-start text-center text-[13px] font-sans">
                <div className="w-60 space-y-1">
                  <div className="font-bold text-slate-800 uppercase">Giảng viên hướng dẫn</div>
                  <div className="text-[11.5px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
                  <div className="h-16 flex items-center justify-center font-serif italic text-blue-800 text-lg">
                    {supervisorName}
                  </div>
                  <div className="font-bold text-slate-900">{supervisorName}</div>
                </div>

                <div className="w-60 space-y-1">
                  <div className="text-[11.5px] text-slate-500 italic">Hà Nội</div>
                  <div className="font-bold text-slate-800 uppercase">Sinh viên thực hiện</div>
                  <div className="text-[11.5px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
                  <div className="h-16 flex items-center justify-center font-serif italic text-slate-700 text-lg">
                    {studentName}
                  </div>
                  <div className="font-bold text-slate-900">{studentName}</div>
                </div>
              </div>

              <div className="pt-8 text-center text-[12px] font-mono text-slate-400 border-t border-slate-200">
                — Trang 3 / 3 (Hết) —
              </div>
            </article>
          </div>
        </main>
      </div>
    </div>
  )
}
