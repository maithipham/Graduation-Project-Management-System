import { useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Clock,
  Eye,
  Filter,
  Inbox,
  MessageSquare,
  Search,
  User,
  UserCheck,
} from 'lucide-react'
import { toast } from '@/shared/components/feedback/toast.store'
import { useLecturerPortalStore } from '@/features/lecturer/lecturer_portal_storage'
import { OutlineClassroomPreviewModal } from '../components/OutlineClassroomPreviewModal'
import {
  ApproveOutlineModal,
  OutlineFeedbackModal,
  OutlineHistoryModal,
  RejectOutlineModal,
} from '../components/OutlineReviewModals'
import type {
  OutlineReviewItem,
  OutlineRole,
  OutlineTabStatus,
  RejectedSubTab,
} from '../types/outlineReview.types'
import { getOutlineCategory, parseDateVi } from '../utils/outlineReview.utils'

const PAGE_SIZE = 15

export default function OutlineReviewPage() {
  const outlines = useLecturerPortalStore((s) => s.outlines)
  const readOutlineIds = useLecturerPortalStore((s) => s.readOutlineIds)
  const markOutlineAsRead = useLecturerPortalStore((s) => s.markOutlineAsRead)
  const approveOutline = useLecturerPortalStore((s) => s.approveOutline)
  const rejectOutline = useLecturerPortalStore((s) => s.rejectOutline)
  const updateOutlineFeedback = useLecturerPortalStore((s) => s.updateOutlineFeedback)

  const [currentRole, setCurrentRole] = useState<OutlineRole>('guide')
  const [tabStatus, setOutlineTabStatus] = useState<OutlineTabStatus>('pending')
  const [rejectedSubTab, setRejectedSubTab] = useState<RejectedSubTab>('rejected_resubmitted')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [previewTarget, setPreviewTarget] = useState<OutlineReviewItem | null>(null)
  const [approveTarget, setApproveTarget] = useState<OutlineReviewItem | null>(null)
  const [rejectTarget, setRejectTarget] = useState<OutlineReviewItem | null>(null)
  const [feedbackTarget, setFeedbackTarget] = useState<OutlineReviewItem | null>(null)
  const [historyTarget, setHistoryTarget] = useState<OutlineReviewItem | null>(null)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const badges = useMemo(() => {
    let guideTotal = 0
    let reviewerTotal = 0
    let pendingCount = 0
    let approvedCount = 0
    let resubmittedCount = 0
    let unsubmittedCount = 0
    let allCount = 0

    for (const item of outlines) {
      if (item.role === 'reviewer') reviewerTotal++
      else guideTotal++

      const matchRole =
        currentRole === 'reviewer' ? item.role === 'reviewer' : item.role !== 'reviewer'
      if (!matchRole) continue

      allCount++
      const cat = getOutlineCategory(item)
      if (cat === 'pending') pendingCount++
      else if (cat === 'approved') approvedCount++
      else if (cat === 'resubmitted') resubmittedCount++
      else if (cat === 'rejected') unsubmittedCount++
    }

    return {
      guideTotal,
      reviewerTotal,
      pendingCount,
      approvedCount,
      rejectedTotal: unsubmittedCount + resubmittedCount,
      resubmittedCount,
      unsubmittedCount,
      allCount,
    }
  }, [outlines, currentRole])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const matched = outlines.filter((item) => {
      const matchRole =
        currentRole === 'reviewer' ? item.role === 'reviewer' : item.role !== 'reviewer'
      if (!matchRole) return false

      const matchQ =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.mssv.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.fileName.toLowerCase().includes(q) ||
        Boolean(item.supervisorName && item.supervisorName.toLowerCase().includes(q))

      const cat = getOutlineCategory(item)
      let matchSt = true
      if (tabStatus === 'pending') {
        matchSt = cat === 'pending'
      } else if (tabStatus === 'approved') {
        matchSt = cat === 'approved'
      } else if (tabStatus === 'rejected') {
        if (rejectedSubTab === 'rejected_unsubmitted') {
          matchSt = cat === 'rejected'
        } else if (rejectedSubTab === 'rejected_resubmitted') {
          matchSt = cat === 'resubmitted'
        } else {
          matchSt = cat === 'rejected' || cat === 'resubmitted'
        }
      }

      return matchQ && matchSt
    })

    matched.sort((a, b) => {
      if (tabStatus === 'approved') {
        return (
          parseDateVi(b.approvedAt || b.submittedDate) -
          parseDateVi(a.approvedAt || a.submittedDate)
        )
      }
      return parseDateVi(b.submittedDate) - parseDateVi(a.submittedDate)
    })

    return matched
  }, [outlines, currentRole, searchQuery, tabStatus, rejectedSubTab])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startIdx = (safePage - 1) * PAGE_SIZE
  const endIdx = Math.min(startIdx + PAGE_SIZE, filtered.length)
  const pageData = filtered.slice(startIdx, endIdx)

  const showFeedbackCol = tabStatus === 'rejected'
  const colSpan = showFeedbackCol ? 7 : 6

  const handlePageChange = (nextPage: number) => {
    setCurrentPage(nextPage)
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClickApprove = (item: OutlineReviewItem) => {
    if (!readOutlineIds.includes(item.id)) {
      setPreviewTarget(item)
      toast.info(
        `Vui lòng cuộn đọc đến hết đề cương của ${item.name} để mở khóa phê duyệt!`,
      )
      return
    }
    setApproveTarget(item)
  }

  const handleClickReject = (item: OutlineReviewItem) => {
    if (!readOutlineIds.includes(item.id)) {
      setPreviewTarget(item)
      toast.info(`Vui lòng cuộn đọc đến hết đề cương của ${item.name} để mở khóa từ chối!`)
      return
    }
    setRejectTarget(item)
  }

  const handleUnlockRead = (item: OutlineReviewItem) => {
    if (readOutlineIds.includes(item.id)) return
    markOutlineAsRead(item.id)
    toast.success(
      `Đã đọc hết đề cương! Đã mở khóa quyền duyệt đề cương cho sinh viên ${item.name}`,
    )
  }

  const handleConfirmApprove = (id: string) => {
    const studentName = approveTarget?.name ?? ''
    approveOutline(id)
    setApproveTarget(null)
    setPreviewTarget(null)
    toast.success(`Đã phê duyệt đề cương của sinh viên ${studentName} thành công!`)
  }

  const handleConfirmReject = (id: string, feedback: string) => {
    const studentName = rejectTarget?.name ?? ''
    rejectOutline(id, feedback)
    setRejectTarget(null)
    setPreviewTarget(null)
    toast.info(`Đã từ chối đề cương và gửi yêu cầu sửa cho sinh viên ${studentName}.`)
  }

  const handleSaveFeedback = (id: string, feedback: string) => {
    const studentName = feedbackTarget?.name ?? ''
    updateOutlineFeedback(id, feedback)
    setFeedbackTarget(null)
    toast.success(`Đã cập nhật lý do từ chối cho sinh viên ${studentName} thành công!`)
  }

  const getInitialFeedbackValue = (item: OutlineReviewItem | null): string => {
    if (!item) return ''
    return (
      item.feedback ||
      item.previousRejectReason ||
      item.history.find((h) => h.status === 'Từ chối' || h.status === 'Đã từ chối')?.note ||
      ''
    )
  }

  const statusTabs: Array<{
    status: OutlineTabStatus
    label: string
    count: number
    badgeId: string
    badgeClass: string
  }> = [
    {
      status: 'pending',
      label: 'Chưa duyệt',
      count: badges.pendingCount,
      badgeId: 'tabCountPending',
      badgeClass: 'tab-badge-pending bg-amber-100 text-amber-800',
    },
    {
      status: 'approved',
      label: 'Đã duyệt',
      count: badges.approvedCount,
      badgeId: 'tabCountApproved',
      badgeClass: 'tab-badge-default bg-slate-100 text-slate-600',
    },
    {
      status: 'rejected',
      label: 'Đã từ chối',
      count: badges.rejectedTotal,
      badgeId: 'tabCountRejected',
      badgeClass: 'tab-badge px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800',
    },
    {
      status: '',
      label: 'Tất cả',
      count: badges.allCount,
      badgeId: 'tabCountAll',
      badgeClass: 'tab-badge-default bg-slate-100 text-slate-600',
    },
  ]

  return (
    <div
      className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex-1 min-h-0 flex flex-col"
      style={{
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Cụm Tab Vai trò chính: Sinh viên đang hướng dẫn / Sinh viên được phân công nhận xét */}
      <div className="shrink-0 border-b border-slate-200/80 px-5 py-2 bg-slate-50/70 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5" id="roleTabs">
          <button
            type="button"
            data-role="guide"
            onClick={() => {
              setCurrentRole('guide')
              setCurrentPage(1)
            }}
            className={`role-tab px-4 py-2 rounded-xl text-[13.5px] transition flex items-center gap-2 cursor-pointer ${
              currentRole === 'guide'
                ? 'active font-bold bg-white text-[#1565C0] shadow-2xs border border-blue-200'
                : 'font-semibold bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent'
            }`}
          >
            <UserCheck
              className={`w-4 h-4 ${currentRole === 'guide' ? 'text-[#1565C0]' : 'text-slate-400'}`}
            />
            <span>Sinh viên đang hướng dẫn</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                currentRole === 'guide'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
              id="roleCountGuide"
            >
              {badges.guideTotal}
            </span>
          </button>

          <button
            type="button"
            data-role="reviewer"
            onClick={() => {
              setCurrentRole('reviewer')
              setCurrentPage(1)
            }}
            className={`role-tab px-4 py-2 rounded-xl text-[13.5px] transition flex items-center gap-2 cursor-pointer ${
              currentRole === 'reviewer'
                ? 'active font-bold bg-white text-[#1565C0] shadow-2xs border border-blue-200'
                : 'font-semibold bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent'
            }`}
          >
            <MessageSquare
              className={`w-4 h-4 ${currentRole === 'reviewer' ? 'text-[#1565C0]' : 'text-slate-400'}`}
            />
            <span>Sinh viên được phân công nhận xét</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                currentRole === 'reviewer'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
              id="roleCountReviewer"
            >
              {badges.reviewerTotal}
            </span>
          </button>
        </div>
      </div>

      {/* Toolbar Header: Tabs + Tìm kiếm + Hạn review */}
      <div className="shrink-0 border-b border-slate-200/80 px-5 flex items-center justify-between gap-4 bg-white flex-wrap xl:flex-nowrap">
        {/* 1. Tabs trạng thái */}
        <div className="flex items-center gap-1 sm:gap-2 -mb-px shrink-0 overflow-x-auto" id="statusTabs">
          {statusTabs.map((tab) => {
            const isActive = tabStatus === tab.status
            return (
              <button
                key={tab.label}
                type="button"
                data-status={tab.status}
                data-active={isActive ? 'true' : 'false'}
                onClick={() => {
                  setOutlineTabStatus(tab.status)
                  setCurrentPage(1)
                  if (tab.status === 'rejected') {
                    setRejectedSubTab('rejected_resubmitted')
                  }
                }}
                className={`tab-btn px-4 py-3 border-b-2 text-[13.5px] transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'active font-bold border-[#1565C0] text-[#1565C0]'
                    : 'font-semibold border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={
                    tab.status === 'rejected'
                      ? 'tab-badge px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800'
                      : tab.status === 'pending'
                        ? 'tab-badge px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800'
                        : 'tab-badge px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600'
                  }
                  id={tab.badgeId}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* 2. Ô tìm kiếm sinh viên, đề tài */}
        <div className="flex items-center gap-2 h-9 flex-1 min-w-[200px] max-w-[480px] xl:max-w-[560px] px-3 bg-slate-50 border border-slate-200 rounded-lg focus-within:border-[#1565C0] focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition shadow-2xs my-1.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            id="searchInput"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Tìm theo mã sinh viên, tên hoặc đề tài..."
            className="w-full bg-transparent outline-none text-[13px] text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* 3. Hạn review */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 text-[12px] font-semibold shrink-0 my-1.5 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>
            Hạn review: <b className="font-bold text-amber-900">05/11/2026 23:59</b>
          </span>
        </div>
      </div>

      {/* 2 Nhánh con khi vào Tab 'Đã từ chối' (Chưa nộp lại / Đã nộp lại) */}
      {tabStatus === 'rejected' && (
        <div
          id="rejectedSubTabs"
          className="shrink-0 px-5 py-2.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-2 animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Phân loại:
            </span>
            <button
              type="button"
              data-substatus="rejected_resubmitted"
              onClick={() => {
                setRejectedSubTab('rejected_resubmitted')
                setCurrentPage(1)
              }}
              className={`subtab-btn px-3.5 py-1.5 rounded-xl text-[12px] font-bold transition flex items-center gap-2 cursor-pointer ${
                rejectedSubTab === 'rejected_resubmitted'
                  ? 'active bg-white text-sky-800 shadow-2xs border border-sky-300'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
              }`}
            >
              <span>Đã nộp lại</span>
              <span
                id="subCountResubmitted"
                className="px-2 py-0.5 rounded-full text-[12px] font-bold bg-sky-100 text-sky-800"
              >
                {badges.resubmittedCount}
              </span>
            </button>
            <button
              type="button"
              data-substatus="rejected_unsubmitted"
              onClick={() => {
                setRejectedSubTab('rejected_unsubmitted')
                setCurrentPage(1)
              }}
              className={`subtab-btn px-3.5 py-1.5 rounded-xl text-[12px] font-bold transition flex items-center gap-2 cursor-pointer ${
                rejectedSubTab === 'rejected_unsubmitted'
                  ? 'active bg-white text-rose-700 shadow-2xs border border-rose-200'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
              }`}
            >
              <span>Chưa nộp lại</span>
              <span
                id="subCountUnsubmitted"
                className="px-2 py-0.5 rounded-full text-[12px] font-bold bg-rose-100 text-rose-800"
              >
                {badges.unsubmittedCount}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Table Duyệt đề cương */}
      <div id="tableScrollContainer" ref={scrollContainerRef} className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-left text-[13px] border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 shadow-2xs">
            <tr>
              <th className="px-5 py-3.5 w-16 text-slate-400 bg-slate-50">STT</th>
              <th className="px-5 py-3.5 min-w-[190px] bg-slate-50">SINH VIÊN</th>
              <th className="px-5 py-3.5 min-w-[260px] bg-slate-50">ĐỀ TÀI</th>
              <th className="px-5 py-3.5 min-w-[220px] bg-slate-50">
                FILE ĐỀ CƯƠNG &amp; THỜI GIAN NỘP
              </th>
              <th className="px-5 py-3.5 min-w-[170px] bg-slate-50">TRẠNG THÁI</th>
              {showFeedbackCol && (
                <th className="px-5 py-3.5 min-w-[210px] bg-slate-50" id="thFeedback">
                  LÝ DO TỪ CHỐI
                </th>
              )}
              <th className="px-5 py-3.5 w-32 text-center bg-slate-50">LỊCH SỬ NỘP</th>
            </tr>
          </thead>
          <tbody id="tableBody" className="divide-y divide-slate-100 bg-white">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-12 text-center text-slate-400 text-[13px]">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                    <Inbox className="w-6 h-6" />
                  </div>
                  Không tìm thấy đề cương nào trong mục này.
                </td>
              </tr>
            ) : (
              pageData.map((item, idx) => {
                const rowNumber = startIdx + idx + 1
                const cat = getOutlineCategory(item)
                const isResubmitted = cat === 'resubmitted'
                const isPending = cat === 'pending'
                const isApproved = cat === 'approved'
                const isRejected = cat === 'rejected'
                const isRead = readOutlineIds.includes(item.id)
                const histCount =
                  item.history && item.history.length > 0
                    ? item.history.length
                    : item.submitCount || 1
                const rejectReason =
                  item.previousRejectReason ||
                  item.feedback ||
                  item.history.find((h) => h.status === 'Từ chối' || h.status === 'Đã từ chối')
                    ?.note ||
                  ''

                return (
                  <tr
                    key={item.id}
                    data-id={item.id}
                    className="hover:bg-slate-50/70 transition border-b border-slate-100"
                  >
                    <td className="px-5 py-4 text-[13px] font-semibold text-slate-400">
                      {rowNumber}
                    </td>

                    {/* SINH VIÊN */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-[13.5px] text-slate-900 leading-snug">
                        {item.name}
                      </div>
                      <div className="text-[12px] text-slate-500 font-mono mt-0.5">{item.mssv}</div>
                      {currentRole === 'reviewer' && item.supervisorName && (
                        <div className="inline-flex items-center gap-1 text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md mt-1 border border-blue-200/60">
                          <User className="w-3 h-3" /> GVHD: {item.supervisorName}
                        </div>
                      )}
                    </td>

                    {/* ĐỀ TÀI */}
                    <td className="px-5 py-4 max-w-[260px]">
                      <div
                        className="text-[13px] font-medium text-slate-800 line-clamp-2"
                        title={item.topic}
                      >
                        {item.topic}
                      </div>
                    </td>

                    {/* FILE ĐỀ CƯƠNG & THỜI GIAN NỘP */}
                    <td className="px-5 py-4 min-w-[220px]">
                      {item.fileName ? (
                        <div>
                          <div className="file-name-cell-wrap inline-flex items-center gap-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              data-id={item.id}
                              data-file={item.fileName}
                              onClick={() => setPreviewTarget(item)}
                              className="btn-preview-file font-bold text-[12px] text-blue-600 hover:text-blue-800 hover:underline leading-snug cursor-pointer text-left"
                            >
                              {item.fileName}
                            </button>
                            <button
                              type="button"
                              data-id={item.id}
                              data-file={item.fileName}
                              onClick={() => setPreviewTarget(item)}
                              title="Xem trước tài liệu (Google Classroom Preview)"
                              aria-label="Xem trước tài liệu"
                              className="btn-preview-eye p-0.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-[12px] text-slate-600 mt-1">
                            Thời gian nộp:{' '}
                            <span className="font-semibold text-slate-800">
                              {item.submittedDate || '—'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Lần nộp thứ {histCount}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa nộp</span>
                      )}
                    </td>

                    {/* TRẠNG THÁI */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {isResubmitted || isPending ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            data-id={item.id}
                            onClick={() => handleClickApprove(item)}
                            title={
                              isRead
                                ? 'Phê duyệt đề cương'
                                : 'Kéo đọc hết đề cương trong bản xem trước để mở khóa phê duyệt'
                            }
                            className="btn-approve h-8 px-3.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-[12px] font-bold transition cursor-pointer shadow-xs"
                          >
                            Duyệt
                          </button>
                          <button
                            type="button"
                            data-id={item.id}
                            onClick={() => handleClickReject(item)}
                            title={
                              isRead
                                ? 'Từ chối đề cương (yêu cầu sửa)'
                                : 'Kéo đọc hết đề cương trong bản xem trước để mở khóa từ chối'
                            }
                            className="btn-reject h-8 px-3 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-[12px] font-bold transition cursor-pointer shadow-2xs"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : isApproved ? (
                        <div className="flex flex-col items-start">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Đã duyệt
                          </span>
                          {item.approvedAt && (
                            <span className="text-[11px] text-slate-400 font-mono mt-1">
                              {item.approvedAt}
                            </span>
                          )}
                        </div>
                      ) : isRejected ? (
                        <div className="flex flex-col items-start">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Chưa nộp lại
                          </span>
                          {item.rejectedAt && (
                            <span className="text-[11px] text-slate-400 font-mono mt-1">
                              {item.rejectedAt}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11.5px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          Chưa nộp
                        </span>
                      )}
                    </td>

                    {/* LÝ DO TỪ CHỐI */}
                    {showFeedbackCol && (
                      <td className="px-5 py-4 max-w-[220px]">
                        {isResubmitted || isRejected ? (
                          rejectReason ? (
                            <div className="space-y-1">
                              <div className="text-[12px] font-bold text-rose-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Lý do từ chối lần trước:
                              </div>
                              <div
                                className="text-[12px] text-slate-700 line-clamp-2 leading-snug"
                                title={rejectReason}
                              >
                                {rejectReason}
                              </div>
                              <button
                                type="button"
                                data-id={item.id}
                                onClick={() => setFeedbackTarget(item)}
                                className="btn-edit-feedback text-[12px] font-bold text-blue-600 hover:underline cursor-pointer"
                              >
                                Sửa lý do
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              data-id={item.id}
                              onClick={() => setFeedbackTarget(item)}
                              className="btn-edit-feedback text-[12px] font-bold text-rose-600 hover:underline cursor-pointer"
                            >
                              Nhập lý do từ chối
                            </button>
                          )
                        ) : item.feedback ? (
                          <div className="space-y-1">
                            <div className="text-[12px] text-slate-700 line-clamp-2 leading-snug">
                              {item.feedback}
                            </div>
                            <button
                              type="button"
                              data-id={item.id}
                              onClick={() => setFeedbackTarget(item)}
                              className="btn-edit-feedback text-[12px] font-bold text-blue-600 hover:underline cursor-pointer"
                            >
                              Sửa lý do
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    )}

                    {/* LỊCH SỬ NỘP */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-center">
                        <button
                          type="button"
                          data-id={item.id}
                          onClick={() => setHistoryTarget(item)}
                          title={`Xem chi tiết lịch sử nộp đề cương của ${item.name}`}
                          className="btn-history h-8 px-3 rounded-lg border border-slate-200 text-slate-700 hover:border-[#1565C0] hover:text-[#1565C0] hover:bg-blue-50/50 text-[12px] font-bold transition cursor-pointer"
                        >
                          Nộp lần {histCount || 1}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar (15 phần tử / trang) */}
      <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3 bg-slate-50/60 shrink-0">
        <p className="text-[12.5px] text-slate-500" id="paginationInfo">
          {filtered.length === 0 ? (
            <>
              Hiển thị <b className="text-slate-800">0</b> đề cương
            </>
          ) : (
            <>
              Hiển thị{' '}
              <b className="text-slate-800">
                {startIdx + 1}–{endIdx}
              </b>{' '}
              trên <b className="text-slate-800">{filtered.length}</b> đề cương
            </>
          )}
        </p>

        {filtered.length > 0 && (
          <div className="flex items-center gap-1.5" id="paginationControls">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => handlePageChange(Math.max(1, safePage - 1))}
              className="btn-prev px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-[12px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Trước
            </button>
            <span className="px-3 py-1 text-slate-700 font-bold text-[12px]">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => handlePageChange(Math.min(totalPages, safePage + 1))}
              className="btn-next px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-[12px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      <OutlineClassroomPreviewModal
        item={previewTarget}
        isAlreadyRead={previewTarget ? readOutlineIds.includes(previewTarget.id) : false}
        onUnlockRead={handleUnlockRead}
        onClose={() => setPreviewTarget(null)}
      />

      <ApproveOutlineModal
        item={approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleConfirmApprove}
      />

      <RejectOutlineModal
        item={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
      />

      <OutlineFeedbackModal
        key={feedbackTarget?.id ?? 'closed'}
        item={feedbackTarget}
        initialValue={getInitialFeedbackValue(feedbackTarget)}
        onClose={() => setFeedbackTarget(null)}
        onSave={handleSaveFeedback}
      />

      <OutlineHistoryModal
        item={historyTarget}
        showReasonColumn={tabStatus !== 'pending'}
        onClose={() => setHistoryTarget(null)}
        onPreviewFile={(target: any) => setPreviewTarget(target)}
      />
    </div>
  )
}
