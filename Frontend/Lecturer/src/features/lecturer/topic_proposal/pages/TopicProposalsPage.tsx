import { useRef } from 'react'
import { Clock, Inbox, Search } from 'lucide-react'
import {
  ApproveTopicModal,
  RejectTopicModal,
  TopicDetailModal,
} from '../components/TopicProposalModals'
import { useTopicProposals } from '../hooks/useTopicProposals'
import type { TopicProposalTabStatus } from '../types/topicProposal.types'

export default function TopicProposalsPage() {
  const {
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
    rejectTarget,
    setRejectTarget,
    detailTarget,
    setDetailTarget,
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
      {/* 1. HEADER: TABS VÀ TÌM KIẾM */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 shrink-0 bg-white">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl shrink-0 overflow-x-auto">
          {(
            [
              { key: 'pending', label: 'Chờ duyệt', count: counts.pending },
              { key: 'approved', label: 'Đã duyệt', count: counts.approved },
              { key: 'rejected', label: 'Từ chối', count: counts.rejected },
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
                      ? tab.key === 'pending' && tab.count > 0
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

        <div className="relative w-full sm:w-80">
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

      {/* 2. BẢNG DANH SÁCH */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200"
      >
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Inbox size={28} />
            </div>
            <p className="text-sm font-semibold text-slate-700">Không có đề xuất đề tài nào</p>
            <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 min-w-[200px]">Sinh viên</th>
                <th className="py-3 px-4 min-w-[260px]">Tên đề tài đề xuất</th>
                <th className="py-3 px-4 min-w-[130px]">Thời gian nộp</th>
                <th className="py-3 px-4 min-w-[120px] text-center">Trạng thái</th>
                <th className="py-3 px-4 min-w-[170px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageData.map((item, idx) => {
                const globalIndex = (currentPage - 1) * 15 + idx + 1
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-3 px-4 text-center font-medium text-slate-400 text-xs">
                      {globalIndex}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-[#1565C0] transition-colors">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-slate-600 font-semibold">{item.mssv}</span>
                        <span>·</span>
                        <span>{item.major}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {item.isRename ? (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Đổi tên đề tài
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-[#1565C0] border border-blue-200">
                            Đề tài mới
                          </span>
                        )}
                      </div>
                      <div className="text-slate-800 font-medium line-clamp-2 leading-relaxed" title={item.topic}>
                        {item.topic}
                      </div>
                      {item.isRename && item.oldTopic && (
                        <div className="text-[11px] text-slate-400 line-through line-clamp-1 mt-0.5">
                          Tên cũ: {item.oldTopic}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-400" />
                        <span>{item.submittedDate}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Chờ duyệt
                        </span>
                      )}
                      {item.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Đã duyệt
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Từ chối
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setDetailTarget(item)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#1565C0] hover:bg-blue-50 transition cursor-pointer"
                        >
                          Chi tiết
                        </button>
                        {item.status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setApproveTarget(item)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1565C0] text-white hover:bg-[#0D47A1] transition shadow-xs cursor-pointer active:scale-95"
                            >
                              Duyệt
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectTarget(item)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer active:scale-95"
                            >
                              Từ chối
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {item.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                          </span>
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
            <span className="font-semibold text-slate-800">{filtered.length}</span> đề tài
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1))
                scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
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
              className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
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
      />
      <RejectTopicModal
        item={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
      />
      <TopicDetailModal
        item={detailTarget}
        onClose={() => setDetailTarget(null)}
      />
    </div>
  )
}
