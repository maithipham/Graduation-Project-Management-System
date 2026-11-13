import { useRef } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
  Inbox,
  Search,
  XCircle,
} from 'lucide-react'
import { formatDate } from '@/shared/utils'
import {
  ApproveTopicModal,
  RejectTopicModal,
  TopicTitleHistoryModal,
} from '../components/TopicProposalModals'
import { useTopicProposals } from '../hooks/useTopicProposals'
import type {
  TopicProposalTabStatus,
  TopicTitleHistoryResponse,
} from '../types/topicProposal.types'

export default function TopicProposalsPage() {
  const {
    semesters,
    semestersLoading,
    selectedSemesterId,
    setSelectedSemesterId,
    deadlineInfo,
    deadlineLoading,
    isLoading,
    tabStatus,
    setTabStatus,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    counts,
    filtered,
    pageData,
    approveTarget,
    setApproveTarget,
    isApproving,
    rejectTarget,
    setRejectTarget,
    isRejecting,
    historyTarget,
    setHistoryTarget,
    handleConfirmApprove,
    handleConfirmReject,
  } = useTopicProposals()

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className="h-full flex flex-col min-h-0 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden select-none"
      style={{
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 1. HEADER: HỌC KỲ, THỜI HẠN, TABS VÀ TÌM KIẾM */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col gap-4 shrink-0 bg-white">
        {/* Hàng trên: Bộ chọn học kỳ & Badge Thời hạn thực tế từ BE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] cursor-pointer"
            >
              {semesters.map((sem) => (
                <option key={sem.publicId} value={sem.publicId}>
                  {sem.name} {sem.academicYear ? `(${sem.academicYear})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Banner thời hạn lấy động từ BE (SV_CHINH_SUA_NOP_LAI_DE_CUONG) */}
          <div className="flex items-center">
            {deadlineLoading ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium animate-pulse">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Đang tải thời hạn...</span>
              </div>
            ) : deadlineInfo.status === 'NOT_CONFIGURED' ? (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium"
                title="Chưa cấu hình thời hạn nộp & duyệt tên đề tài cho học kỳ này"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Thời hạn: Chưa có</span>
              </div>
            ) : deadlineInfo.status === 'OPEN' ? (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold"
                title={`Thời hạn nộp đề cương & duyệt mở đến ${formatDate(deadlineInfo.endDate, 'full')}`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Thời hạn: {deadlineInfo.label} (Đang mở)</span>
              </div>
            ) : deadlineInfo.status === 'EXTENDED' ? (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold"
                title="Đang trong thời gian gia hạn chấm của giảng viên"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>{deadlineInfo.label}</span>
              </div>
            ) : deadlineInfo.status === 'CLOSED' ? (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs font-semibold"
                title="Đã hết hạn duyệt tên đề tài. Vui lòng liên hệ Trưởng bộ môn để được gia hạn chấm"
              >
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span>{deadlineInfo.label}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{deadlineInfo.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* Hàng dưới: Tabs trạng thái và Ô tìm kiếm */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl shrink-0 overflow-x-auto">
            {(
              [
                { key: 'PENDING', label: 'Chưa duyệt', count: counts.pending },
                { key: 'APPROVED', label: 'Đã duyệt', count: counts.approved },
                { key: 'REJECTED', label: 'Đã từ chối', count: counts.rejected },
                { key: '', label: 'Tất cả', count: counts.all },
              ] as const
            ).map((tab) => {
              const active = tabStatus === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setTabStatus(tab.key as TopicProposalTabStatus)
                    setCurrentPage(1)
                  }}
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-bold ${
                      active
                        ? tab.key === 'PENDING' && tab.count > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-800'
                        : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Tìm theo tên SV, MSSV, tên đề tài..."
              className="w-full text-xs pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] transition"
            />
          </div>
        </div>
      </div>

      {/* 2. BẢNG DANH SÁCH */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200"
      >
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Inbox size={28} />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Không có yêu cầu tên đề tài nào
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 min-w-[180px]">Sinh viên</th>
                <th className="py-3 px-4 w-32">Phân loại</th>
                <th className="py-3 px-4 min-w-[280px]">Tên đề tài</th>
                <th className="py-3 px-4 min-w-[130px]">Thời gian gửi</th>
                <th className="py-3 px-4 min-w-[150px] text-center">Trạng thái</th>
                <th className="py-3 px-4 min-w-[180px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageData.map((item: TopicTitleHistoryResponse, idx) => {
                const globalIndex = (currentPage - 1) * 15 + idx + 1
                const isInitial = item.oldName === null
                const isPending = item.status === 'PENDING'
                const isApproved = item.status === 'APPROVED'
                const isRejected = item.status === 'REJECTED'

                const isMainSupervisor = item.canReview === true
                const canReviewByDeadline = deadlineInfo.canTeacherReview === true
                const canAction = isPending && isMainSupervisor && canReviewByDeadline

                let disabledTooltip = ''
                if (!isMainSupervisor) {
                  disabledTooltip = 'Chỉ giảng viên hướng dẫn chính mới có quyền duyệt tên đề tài.'
                } else if (!canReviewByDeadline) {
                  disabledTooltip =
                    deadlineInfo.status === 'CLOSED'
                      ? 'Đã quá thời hạn duyệt tên đề tài. Vui lòng liên hệ Trưởng bộ môn để được gia hạn chấm.'
                      : 'Chưa tới thời hạn duyệt tên đề tài.'
                }

                return (
                  <tr
                    key={item.publicId}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    <td className="py-3 px-4 text-center font-medium text-slate-400 text-xs">
                      {globalIndex}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-[#1565C0] transition-colors">
                        {item.studentName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-slate-600 font-semibold">
                          {item.studentCode}
                        </span>
                      </div>
                    </td>

                    {/* Phân loại đơn: Chốt tên lần đầu vs Xin đổi tên */}
                    <td className="py-3 px-4">
                      {isInitial ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                          Chốt tên lần đầu
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
                          Xin đổi tên đề tài
                        </span>
                      )}
                    </td>

                    {/* Nội dung đề tài: Tên mới (bold) + Tên cũ */}
                    <td className="py-3 px-4">
                      <div
                        className="text-slate-900 font-bold line-clamp-2 leading-relaxed"
                        title={item.newName}
                      >
                        {item.newName}
                      </div>
                      <div
                        className="text-[11px] text-slate-500 mt-0.5 line-clamp-1"
                        title={item.oldName || 'Chưa có'}
                      >
                        <span className="text-slate-400">Tên cũ:</span>{' '}
                        {item.oldName ? (
                          <span className="text-slate-600">{item.oldName}</span>
                        ) : (
                          <span className="text-slate-400 italic">
                            Chưa có (Chốt lần đầu)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Thời gian gửi đơn */}
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-400" />
                        <span>{formatDate(item.requestedAt, 'full')}</span>
                      </div>
                    </td>

                    {/* Trạng thái đơn */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {isApproved && (
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            Đã duyệt
                          </span>
                          {item.reviewerName && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {item.reviewerName}
                            </span>
                          )}
                        </div>
                      )}
                      {isRejected && (
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                            <XCircle size={12} className="text-rose-500" />
                            Đã từ chối
                          </span>
                          {item.reviewerName && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {item.reviewerName}
                            </span>
                          )}
                        </div>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                          <Clock size={12} className="text-amber-500" />
                          Chờ duyệt
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 justify-end">
                        {/* Nút Xem lịch sử thay đổi tên của đề tài */}
                        <button
                          type="button"
                          onClick={() => setHistoryTarget(item)}
                          className="px-2.5 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 transition flex items-center gap-1 cursor-pointer"
                          title="Xem lịch sử thay đổi tên đề tài"
                        >
                          <History size={13} />
                          <span className="text-[11.5px] font-semibold">Lịch sử</span>
                        </button>

                        {/* Quyền Duyệt / Từ chối */}
                        {isPending && (
                          <>
                            {!isMainSupervisor ? (
                              <span
                                className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200"
                                title="Bạn là GVHD đồng hướng dẫn, chỉ có quyền xem."
                              >
                                Đồng hướng dẫn (Chỉ xem)
                              </span>
                            ) : canAction ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setApproveTarget(item)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1565C0] text-white hover:bg-[#0D47A1] transition shadow-xs cursor-pointer active:scale-95"
                                >
                                  Duyệt
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectTarget(item)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer active:scale-95"
                                >
                                  Từ chối
                                </button>
                              </>
                            ) : (
                              <div
                                className="inline-flex items-center gap-1.5"
                                title={disabledTooltip}
                              >
                                <button
                                  type="button"
                                  disabled
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                                >
                                  Duyệt
                                </button>
                                <button
                                  type="button"
                                  disabled
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                                >
                                  Từ chối
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 3. FOOTER PHÂN TRANG */}
      {filtered.length > 0 && (
        <div className="p-3.5 sm:px-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shrink-0 bg-white">
          <div>
            Hiển thị{' '}
            <span className="font-semibold text-slate-800">
              {filtered.length === 0 ? 0 : (currentPage - 1) * 15 + 1}
            </span>{' '}
            -{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(currentPage * 15, filtered.length)}
            </span>{' '}
            trong tổng số{' '}
            <span className="font-semibold text-slate-800">{filtered.length}</span> đơn
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1))
                scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Trước
            </button>
            <span className="px-3 py-1 text-slate-700 font-bold">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1))
                scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Modals Popup */}
      <ApproveTopicModal
        item={approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleConfirmApprove}
        isPending={isApproving}
      />
      <RejectTopicModal
        item={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
        isPending={isRejecting}
      />
      <TopicTitleHistoryModal
        item={historyTarget}
        onClose={() => setHistoryTarget(null)}
      />
    </div>
  )
}
