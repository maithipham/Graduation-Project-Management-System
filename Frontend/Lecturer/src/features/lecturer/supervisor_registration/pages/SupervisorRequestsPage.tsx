import { useRef } from 'react'
import { Clock, Inbox, Search } from 'lucide-react'
import {
  ApproveSupervisorModal,
  RejectSupervisorModal,
} from '../components/SupervisorRequestModals'
import { useSupervisorRequests } from '../hooks/useSupervisorRequests'
import type { SupervisorTabStatus } from '../types/supervisorRegistration.types'

function formatSubmittedDate(dateStr: string): string {
  if (!dateStr) return '—'
  if (/\d{1,2}:\d{2}/.test(dateStr)) return dateStr
  return `${dateStr} 09:15`
}

export default function SupervisorRequestsPage() {
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
    handleConfirmApprove,
    handleConfirmReject,
  } = useSupervisorRequests()

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const showStatusCol = tabStatus === 'approved' || tabStatus === 'rejected' || tabStatus === ''
  const showActionCol = tabStatus === 'pending' || tabStatus === ''

  return (
    <div
      className="h-full flex flex-col min-h-0 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden select-none"
      style={{
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ========================================================
          1. HEADER THANH ĐIỀU HƯỚNG TABS & Ô TÌM KIẾM
          ======================================================== */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 shrink-0 bg-white">
        {/* Tabs chuyển trạng thái */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl shrink-0 overflow-x-auto">
          {(
            [
              { key: 'pending', label: 'Chưa duyệt', count: counts.pending },
              { key: 'approved', label: 'Đã nhận', count: counts.approved },
              { key: 'rejected', label: 'Đã từ chối', count: counts.rejected },
              { key: '', label: 'Tất cả', count: counts.all },
            ] as const
          ).map((tab) => {
            const active = tabStatus === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setTabStatus(tab.key as SupervisorTabStatus)
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

        {/* Ô Tìm kiếm MSSV, tên, đề tài */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Tìm theo tên, MSSV, đề tài..."
            className="w-full text-xs pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] transition"
          />
        </div>

        {/* Hạn đăng ký GVHD */}
        <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold shrink-0 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>
            Hạn đăng ký GVHD: <b className="font-bold text-amber-900">15/11/2026 23:59</b>
          </span>
        </div>
      </div>

      {/* ========================================================
          2. NỘI DUNG BẢNG DANH SÁCH SINH VIÊN
          ======================================================== */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200"
      >
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Inbox size={28} />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Không có yêu cầu đăng ký nào
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
                <th className="py-3 px-4 min-w-[200px]">Sinh viên</th>
                <th className="py-3 px-4 min-w-[220px]">Đề tài nguyện vọng</th>
                <th className="py-3 px-4 min-w-[130px]">Thời gian nộp</th>
                {showStatusCol && (
                  <th className="py-3 px-4 min-w-[140px] text-center">Trạng thái</th>
                )}
                {showActionCol && (
                  <th className="py-3 px-4 min-w-[160px] text-right">Thao tác</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageData.map((item, idx) => {
                const globalIndex = (currentPage - 1) * 15 + idx + 1
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* STT */}
                    <td className="py-3 px-4 text-center font-medium text-slate-400 text-xs">
                      {globalIndex}
                    </td>

                    {/* Thông tin Sinh viên */}
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

                    {/* Đề tài đăng ký */}
                    <td className="py-3 px-4">
                      <div className="text-slate-800 line-clamp-2 leading-relaxed" title={item.topic}>
                        {item.topic}
                      </div>
                    </td>

                    {/* Ngày nộp */}
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-400" />
                        <span>{formatSubmittedDate(item.submittedDate)}</span>
                      </div>
                    </td>

                    {/* Trạng thái duyệt */}
                    {showStatusCol && (
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {item.status === 'approved' && (
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Đã duyệt
                            </span>
                            {item.approvedAt && (
                              <span className="text-[11px] text-slate-400 font-medium">
                                {item.approvedAt}
                              </span>
                            )}
                          </div>
                        )}
                        {item.status === 'rejected' && (
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Đã từ chối
                            </span>
                            {item.rejectedAt && (
                              <span className="text-[11px] text-slate-400 font-medium">
                                {item.rejectedAt}
                              </span>
                            )}
                          </div>
                        )}
                        {item.status === 'pending' && null}
                      </td>
                    )}

                    {/* Cột Thao tác */}
                    {showActionCol && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {item.status === 'pending' ? (
                          <div className="inline-flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setApproveTarget(item)}
                              className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-[#1565C0] text-white hover:bg-[#0D47A1] transition shadow-xs cursor-pointer active:scale-95"
                            >
                              Duyệt
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectTarget(item)}
                              className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer active:scale-95"
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : null}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ========================================================
          3. FOOTER PHÂN TRANG
          ======================================================== */}
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
            <span className="font-semibold text-slate-800">{filtered.length}</span> sinh viên
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1))
                scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-[12px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Trước
            </button>
            <span className="px-3 py-1 text-slate-700 font-bold text-[12px]">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1))
                scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-[12px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Modals Popup xác nhận duyệt / từ chối */}
      <ApproveSupervisorModal
        item={approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleConfirmApprove}
      />
      <RejectSupervisorModal
        item={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
      />
    </div>
  )
}
