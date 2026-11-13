import { useRef } from 'react'
import {
  AlertCircle,
  Clock,
  Download,
  Eye,
  History,
  Inbox,
  MessageSquare,
  Search,
  User,
  UserCheck,
} from 'lucide-react'
import { formatDate } from '@/shared/utils'
import { OutlineClassroomPreviewModal } from '../components/OutlineClassroomPreviewModal'
import {
  ApproveOutlineModal,
  OutlineFeedbackModal,
  OutlineHistoryModal,
  RejectOutlineModal,
} from '../components/OutlineReviewModals'
import { useOutlineReview } from '../hooks/useOutlineReview'
import type {
  OutlineTabStatus,
  ThesisOutlineResponse,
} from '../types/outlineReview.types'
import {
  getFileNameFromUrl,
  getOutlineStatusBadgeClass,
  getOutlineStatusLabel,
} from '../utils/outlineReview.utils'

export default function OutlineReviewPage() {
  const {
    semesters,
    semestersLoading,
    selectedSemesterId,
    setSelectedSemesterId,
    deadlineInfo,
    activeRole,
    setActiveRole,
    tabStatus,
    setTabStatus,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    counts,
    badges,
    filtered,
    pageData,
    isLoading,
    readOutlineIds,
    previewItem,
    setPreviewItem,
    approveItem,
    setApproveItem,
    rejectItem,
    setRejectItem,
    feedbackItem,
    setFeedbackItem,
    historyItem,
    setHistoryItem,
    handleOpenPreview,
    handleUnlockRead,
    handleClickApprove,
    handleClickReject,
    handleConfirmApprove,
    handleConfirmReject,
    handleSaveFeedback,
    isReviewing,
    isSubmittingFeedback,
  } = useOutlineReview()

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handlePageChange = (nextPage: number) => {
    setCurrentPage(nextPage)
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const statusTabs: Array<{
    status: OutlineTabStatus
    label: string
    count: number
    badgeClass: string
  }> = [
    {
      status: 'PENDING',
      label: 'Chờ duyệt',
      count: counts.pending,
      badgeClass: 'bg-amber-100 text-amber-800',
    },
    {
      status: 'APPROVED',
      label: 'Đã duyệt',
      count: counts.approved,
      badgeClass: 'bg-emerald-100 text-emerald-800',
    },
    {
      status: 'REQUEST_CHANGES',
      label: 'Yêu cầu sửa',
      count: counts.requestChanges,
      badgeClass: 'bg-sky-100 text-sky-800',
    },
    {
      status: 'REJECTED',
      label: 'Không đạt',
      count: counts.rejected,
      badgeClass: 'bg-rose-100 text-rose-800',
    },
    {
      status: '',
      label: 'Tất cả',
      count: counts.all,
      badgeClass: 'bg-slate-100 text-slate-600',
    },
  ]

  return (
    <div
      className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex-1 min-h-0 flex flex-col select-none"
      style={{
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 1. Cụm Tab Vai trò chính: GVHD / GVNX */}
      <div className="shrink-0 border-b border-slate-200/80 px-5 py-2.5 bg-slate-50/70 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5" id="roleTabs">
          <button
            type="button"
            data-role="guide"
            onClick={() => {
              setActiveRole('guide')
              setCurrentPage(1)
            }}
            className={`role-tab px-4 py-2 rounded-xl text-[13.5px] transition flex items-center gap-2 cursor-pointer ${
              activeRole === 'guide'
                ? 'active font-bold bg-white text-[#1565C0] shadow-2xs border border-blue-200'
                : 'font-semibold bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent'
            }`}
          >
            <UserCheck
              className={`w-4 h-4 ${activeRole === 'guide' ? 'text-[#1565C0]' : 'text-slate-400'}`}
            />
            <span>Sinh viên đang hướng dẫn</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeRole === 'guide'
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
              setActiveRole('reviewer')
              setCurrentPage(1)
            }}
            className={`role-tab px-4 py-2 rounded-xl text-[13.5px] transition flex items-center gap-2 cursor-pointer ${
              activeRole === 'reviewer'
                ? 'active font-bold bg-white text-[#1565C0] shadow-2xs border border-blue-200'
                : 'font-semibold bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent'
            }`}
          >
            <MessageSquare
              className={`w-4 h-4 ${activeRole === 'reviewer' ? 'text-[#1565C0]' : 'text-slate-400'}`}
            />
            <span>Sinh viên được phân công nhận xét</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeRole === 'reviewer'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
              id="roleCountReviewer"
            >
              {badges.reviewerTotal}
            </span>
          </button>
        </div>

        {/* Học kỳ Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Học kỳ:
          </span>
          <select
            value={selectedSemesterId}
            onChange={(e) => {
              setSelectedSemesterId(e.target.value)
              setCurrentPage(1)
            }}
            disabled={semestersLoading}
            className="text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] cursor-pointer shadow-2xs"
          >
            {semesters.map((sem) => (
              <option key={sem.publicId} value={sem.publicId}>
                {sem.name} {sem.academicYear ? `(${sem.academicYear})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Toolbar Header: Tabs trạng thái + Tìm kiếm + Mốc thời hạn */}
      <div className="shrink-0 border-b border-slate-200/80 px-5 flex items-center justify-between gap-4 bg-white flex-wrap xl:flex-nowrap">
        {/* Tabs trạng thái */}
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
                  setTabStatus(tab.status)
                  setCurrentPage(1)
                }}
                className={`tab-btn px-4 py-3 border-b-2 text-[13.5px] transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'active font-bold border-[#1565C0] text-[#1565C0]'
                    : 'font-semibold border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`tab-badge px-2 py-0.5 rounded-full text-[11px] font-bold ${tab.badgeClass}`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Ô tìm kiếm sinh viên, đề tài */}
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

        {/* Mốc thời hạn lấy động từ BE (SV_CHINH_SUA_NOP_LAI_DE_CUONG) */}
        <div className="flex items-center shrink-0 my-1.5">
          {deadlineInfo.status === 'NOT_CONFIGURED' && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[12px] font-medium shadow-2xs"
              title="Chưa cấu hình thời hạn nộp & duyệt đề cương cho học kỳ này"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Thời hạn: Chưa cấu hình</span>
            </div>
          )}
          {deadlineInfo.status === 'OPEN' && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[12px] font-semibold shadow-2xs"
              title={`Thời hạn mở đến ${formatDate(deadlineInfo.endDate, 'full')}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{deadlineInfo.label} (Đang mở)</span>
            </div>
          )}
          {deadlineInfo.status === 'EXTENDED' && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 text-[12px] font-semibold shadow-2xs"
              title="Đang trong thời gian gia hạn chấm của giảng viên"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>{deadlineInfo.label}</span>
            </div>
          )}
          {deadlineInfo.status === 'CLOSED' && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-800 text-[12px] font-semibold shadow-2xs"
              title="Đã hết hạn thẩm định đề cương. Vui lòng liên hệ Trưởng bộ môn để được gia hạn chấm"
            >
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              <span>{deadlineInfo.label}</span>
            </div>
          )}
          {deadlineInfo.status === 'NOT_STARTED' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-800 text-[12px] font-semibold shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{deadlineInfo.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Table Duyệt đề cương */}
      <div id="tableScrollContainer" ref={scrollContainerRef} className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-left text-[13px] border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 shadow-2xs">
            <tr>
              <th className="px-5 py-3.5 w-14 text-slate-400 bg-slate-50 text-center">STT</th>
              <th className="px-5 py-3.5 min-w-[200px] bg-slate-50">SINH VIÊN</th>
              <th className="px-5 py-3.5 min-w-[260px] bg-slate-50">ĐỀ TÀI</th>
              <th className="px-5 py-3.5 min-w-[220px] bg-slate-50">
                FILE ĐỀ CƯƠNG &amp; THỜI GIAN NỘP
              </th>
              <th className="px-5 py-3.5 min-w-[150px] bg-slate-50">TRẠNG THÁI</th>
              <th className="px-5 py-3.5 min-w-[200px] bg-slate-50">
                {activeRole === 'reviewer' ? 'GÓP Ý GVHD & NHẬN XÉT GVNX' : 'NHẬN XÉT GVNX & GÓP Ý GVHD'}
              </th>
              <th className="px-5 py-3.5 min-w-[180px] text-right bg-slate-50">THAO TÁC</th>
            </tr>
          </thead>
          <tbody id="tableBody" className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-6">
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
                    ))}
                  </div>
                </td>
              </tr>
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-14 text-center text-slate-400 text-[13px]">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                    <Inbox className="w-6 h-6" />
                  </div>
                  Không tìm thấy đề cương nào trong mục này.
                </td>
              </tr>
            ) : (
              pageData.map((item: ThesisOutlineResponse, idx) => {
                const rowNumber = (currentPage - 1) * 15 + idx + 1
                const isPending = item.status === 'PENDING'
                const isRead = readOutlineIds.includes(item.publicId)
                const fileName = getFileNameFromUrl(item.outlineFile)

                const isMainSupervisor = item.canWriteAdvisorFeedback === true
                const canReviewerAction =
                  activeRole === 'reviewer' &&
                  isPending &&
                  item.canReview &&
                  deadlineInfo.canReview
                const canSupervisorAction =
                  activeRole === 'guide' &&
                  isMainSupervisor &&
                  deadlineInfo.canWriteFeedback

                return (
                  <tr
                    key={item.publicId}
                    data-id={item.publicId}
                    className="hover:bg-slate-50/70 transition border-b border-slate-100"
                  >
                    <td className="px-5 py-4 text-[13px] font-semibold text-slate-400 text-center">
                      {rowNumber}
                    </td>

                    {/* SINH VIÊN */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-[13.5px] text-slate-900 leading-snug">
                        {item.studentName}
                      </div>
                      <div className="text-[12px] text-slate-500 font-mono mt-0.5">
                        {item.studentCode}
                      </div>
                      {activeRole === 'reviewer' && item.lecturerName && (
                        <div className="inline-flex items-center gap-1 text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md mt-1 border border-blue-200/60">
                          <User className="w-3 h-3" /> GVHD: {item.lecturerName}
                        </div>
                      )}
                      {activeRole === 'guide' && item.reviewerName && (
                        <div className="inline-flex items-center gap-1 text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md mt-1 border border-indigo-200/60">
                          <MessageSquare className="w-3 h-3" /> GVNX: {item.reviewerName}
                        </div>
                      )}
                    </td>

                    {/* ĐỀ TÀI */}
                    <td className="px-5 py-4 max-w-[280px]">
                      <div
                        className="text-[13px] font-medium text-slate-800 line-clamp-2 leading-snug"
                        title={item.topicName || item.title || ''}
                      >
                        {item.topicName || item.title || '—'}
                      </div>
                      <div className="mt-1">
                        {item.currentStage === 'STAGE_2_TOPIC_CONFIRMED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Đã chốt tên GĐ 2
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Chưa chốt tên GĐ 2
                          </span>
                        )}
                      </div>
                    </td>

                    {/* FILE ĐỀ CƯƠNG & THỜI GIAN NỘP */}
                    <td className="px-5 py-4 min-w-[220px]">
                      {item.outlineFile ? (
                        <div>
                          <div className="file-name-cell-wrap inline-flex items-center gap-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenPreview(item)}
                              className="font-bold text-[12px] text-blue-600 hover:text-blue-800 hover:underline leading-snug cursor-pointer text-left flex items-center gap-1"
                              title="Xem trước đề cương"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-500" />
                              <span className="truncate max-w-[150px]">{fileName}</span>
                            </button>
                            <a
                              href={item.outlineFile}
                              target="_blank"
                              rel="noreferrer"
                              title="Tải xuống tệp đính kèm"
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          <div className="text-[11.5px] text-slate-600 mt-1">
                            Nộp:{' '}
                            <span className="font-semibold text-slate-800 font-mono">
                              {formatDate(item.submittedAt, 'full')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa nộp file</span>
                      )}
                    </td>

                    {/* TRẠNG THÁI */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-bold border ${getOutlineStatusBadgeClass(
                          item.status,
                        )}`}
                      >
                        {item.statusDescription || getOutlineStatusLabel(item.status)}
                      </span>
                      {item.reviewedAt && (
                        <div className="text-[10.5px] text-slate-400 font-mono mt-1">
                          Duyệt: {formatDate(item.reviewedAt, 'full')}
                        </div>
                      )}
                    </td>

                    {/* GÓP Ý & NHẬN XÉT */}
                    <td className="px-5 py-4 max-w-[220px]">
                      <div className="space-y-1.5 text-xs">
                        {item.advisorFeedback && (
                          <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-200/60 text-blue-950">
                            <div className="font-bold text-[11px] text-blue-700 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> Góp ý GVHD:
                            </div>
                            <div className="line-clamp-2 mt-0.5 leading-snug" title={item.advisorFeedback}>
                              {item.advisorFeedback}
                            </div>
                          </div>
                        )}
                        {item.reviewFeedback && (
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800">
                            <div className="font-bold text-[11px] text-slate-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Nhận xét GVNX:
                            </div>
                            <div className="line-clamp-2 mt-0.5 leading-snug" title={item.reviewFeedback}>
                              {item.reviewFeedback}
                            </div>
                          </div>
                        )}
                        {!item.advisorFeedback && !item.reviewFeedback && (
                          <span className="text-slate-400 text-[12px] italic">Chưa có nhận xét</span>
                        )}
                      </div>
                    </td>

                    {/* THAO TÁC */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        {/* Nút Xem Lịch Sử */}
                        <button
                          type="button"
                          onClick={() => setHistoryItem(item)}
                          title={`Xem chi tiết lịch sử nộp đề cương của ${item.studentName}`}
                          className="btn-history h-8 px-2.5 rounded-lg border border-slate-200 text-slate-700 hover:border-[#1565C0] hover:text-[#1565C0] hover:bg-blue-50/50 text-[11.5px] font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Lịch sử</span>
                        </button>

                        {/* Thao tác cho GVNX (Thẩm định đề cương) */}
                        {activeRole === 'reviewer' && (
                          <>
                            {isPending ? (
                              canReviewerAction ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleClickApprove(item)}
                                    title={
                                      isRead
                                        ? 'Phê duyệt đề cương'
                                        : 'Vui lòng xem qua đề cương để mở khóa phê duyệt'
                                    }
                                    className="btn-approve h-8 px-3 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-[12px] font-bold transition cursor-pointer shadow-xs active:scale-95"
                                  >
                                    Duyệt
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleClickReject(item)}
                                    title={
                                      isRead
                                        ? 'Từ chối / Yêu cầu chỉnh sửa đề cương'
                                        : 'Vui lòng xem qua đề cương để mở khóa từ chối'
                                    }
                                    className="btn-reject h-8 px-2.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-[12px] font-bold transition cursor-pointer shadow-2xs active:scale-95"
                                  >
                                    Yêu cầu sửa
                                  </button>
                                </div>
                              ) : (
                                <span
                                  className="text-[11px] text-slate-400 italic px-2"
                                  title={
                                    !deadlineInfo.canReview
                                      ? deadlineInfo.label
                                      : 'Chưa đủ điều kiện thẩm định'
                                  }
                                >
                                  {deadlineInfo.status === 'CLOSED'
                                    ? 'Đã hết hạn thẩm định'
                                    : 'Không thể thao tác'}
                                </span>
                              )
                            ) : null}
                          </>
                        )}

                        {/* Thao tác cho GVHD (Gửi nhận xét góp ý) */}
                        {activeRole === 'guide' && (
                          <>
                            {!isMainSupervisor ? (
                              <span
                                className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200"
                                title="Giảng viên đồng hướng dẫn chỉ có quyền xem đề cương."
                              >
                                Đồng GVHD (Chỉ xem)
                              </span>
                            ) : canSupervisorAction ? (
                              <button
                                type="button"
                                onClick={() => setFeedbackItem(item)}
                                className="h-8 px-3 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-[12px] font-bold transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>{item.advisorFeedback ? 'Sửa góp ý' : 'Góp ý'}</span>
                              </button>
                            ) : (
                              <span
                                className="text-[11px] text-slate-400 italic px-2"
                                title={deadlineInfo.label}
                              >
                                Đã khóa góp ý
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Footer Phân trang */}
      {filtered.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3 bg-slate-50/60 shrink-0">
          <p className="text-[12.5px] text-slate-500" id="paginationInfo">
            Hiển thị{' '}
            <b className="text-slate-800">
              {(currentPage - 1) * 15 + 1}–{Math.min(currentPage * 15, filtered.length)}
            </b>{' '}
            trên <b className="text-slate-800">{filtered.length}</b> đề cương
          </p>

          <div className="flex items-center gap-1.5" id="paginationControls">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              className="btn-prev px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-[12px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Trước
            </button>
            <span className="px-3 py-1 text-slate-700 font-bold text-[12px]">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              className="btn-next px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-[12px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Modals Popup */}
      <OutlineClassroomPreviewModal
        key={`preview-${previewItem?.publicId ?? 'closed'}`}
        item={previewItem}
        isAlreadyRead={previewItem ? readOutlineIds.includes(previewItem.publicId) : false}
        onUnlockRead={handleUnlockRead}
        onClose={() => setPreviewItem(null)}
      />

      <ApproveOutlineModal
        key={`approve-${approveItem?.publicId ?? 'closed'}`}
        item={approveItem}
        onClose={() => setApproveItem(null)}
        onConfirm={handleConfirmApprove}
        isPending={isReviewing}
      />

      <RejectOutlineModal
        key={`reject-${rejectItem?.publicId ?? 'closed'}`}
        item={rejectItem}
        deadlineStatus={deadlineInfo.rawStatus}
        onClose={() => setRejectItem(null)}
        onConfirm={handleConfirmReject}
        isPending={isReviewing}
      />

      <OutlineFeedbackModal
        key={`feedback-${feedbackItem?.publicId ?? 'closed'}`}
        item={feedbackItem}
        initialValue={feedbackItem?.advisorFeedback || ''}
        onClose={() => setFeedbackItem(null)}
        onSave={handleSaveFeedback}
        isPending={isSubmittingFeedback}
      />

      <OutlineHistoryModal
        key={`history-${historyItem?.publicId ?? 'closed'}`}
        item={historyItem}
        onClose={() => setHistoryItem(null)}
        onPreviewFile={(target) => setPreviewItem(target)}
      />
    </div>
  )
}
