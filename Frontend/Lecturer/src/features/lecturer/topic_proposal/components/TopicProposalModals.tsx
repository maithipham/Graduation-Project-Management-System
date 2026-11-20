import React from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  User,
  X,
  XCircle,
} from 'lucide-react'
import { formatDate } from '@/shared/utils'
import { useTopicTitleHistory } from '../hooks/useTopicProposals'
import type { TopicTitleHistoryResponse } from '../types/topicProposal.types'

interface ApproveTopicModalProps {
  item: TopicTitleHistoryResponse | null
  onClose: () => void
  onConfirm: (publicId: string) => void
  isPending?: boolean
}

export const ApproveTopicModal: React.FC<ApproveTopicModalProps> = ({
  item,
  onClose,
  onConfirm,
  isPending = false,
}) => {
  if (!item) return null

  const isInitialConfirm = item.oldName === null

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[580px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            {isInitialConfirm
              ? 'Xác nhận chốt tên đề tài lần đầu'
              : 'Xác nhận phê duyệt đổi tên đề tài'}
          </h3>
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-4 text-[13.5px]">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-slate-800 leading-relaxed space-y-2">
            <div>Bạn có chắc chắn muốn phê duyệt đề tài của sinh viên:</div>
            <div className="text-[15px] font-bold text-emerald-950 flex items-center gap-2">
              <span>{item.studentName}</span>
              <span className="text-[12px] font-mono text-emerald-700 font-semibold">
                ({item.studentCode})
              </span>
            </div>
            <div className="text-[12.5px] text-slate-600 pt-2 border-t border-emerald-200/60 space-y-1">
              <div>
                <span className="text-slate-500 font-medium">Tên mới:</span>{' '}
                <b className="text-slate-900 font-bold">{item.newName}</b>
              </div>
              <div className="text-[12px]">
                <span className="text-slate-500 font-medium">Tên cũ:</span>{' '}
                {item.oldName ? (
                  <span className="text-slate-700 font-medium">{item.oldName}</span>
                ) : (
                  <span className="text-slate-400 italic">Chưa có (Chốt lần đầu)</span>
                )}
              </div>
            </div>
          </div>

          {isInitialConfirm ? (
            <div className="flex items-start gap-2 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-blue-900 text-[12.5px] leading-relaxed">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Đề tài sẽ được chính thức chuyển sang giai đoạn Chốt tên đề tài (
                <b>STAGE_2_TOPIC_CONFIRMED</b>) để sẵn sàng thẩm định đề cương.
              </span>
            </div>
          ) : (
            <p className="text-slate-500 text-[12.5px] italic">
              Sau khi duyệt, tên đề tài mới sẽ chính thức được cập nhật cho sinh viên.
            </p>
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onConfirm(item.publicId)}
            className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isPending ? 'Đang duyệt...' : 'Xác nhận duyệt'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface RejectTopicModalProps {
  item: TopicTitleHistoryResponse | null
  onClose: () => void
  onConfirm: (publicId: string) => void
  isPending?: boolean
}

export const RejectTopicModal: React.FC<RejectTopicModalProps> = ({
  item,
  onClose,
  onConfirm,
  isPending = false,
}) => {
  if (!item) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[580px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Xác nhận từ chối yêu cầu tên đề tài
          </h3>
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-4 text-[13.5px]">
          <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-xl text-slate-700 leading-relaxed">
            Bạn có chắc muốn từ chối yêu cầu tên đề tài này của sinh viên{' '}
            <b className="text-rose-950 font-bold">{item.studentName}</b> (
            <span className="font-mono text-rose-800">{item.studentCode}</span>)?
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-[13px] leading-snug space-y-1">
            <div>
              <span className="text-slate-500 font-medium">Tên đề xuất:</span>{' '}
              <b className="text-slate-900 font-bold">{item.newName}</b>
            </div>
            <div className="text-[12px]">
              <span className="text-slate-500 font-medium">Tên hiện tại:</span>{' '}
              {item.oldName ? (
                <span className="text-slate-700 font-medium">{item.oldName}</span>
              ) : (
                <span className="text-slate-400 italic">Chưa có (Chốt lần đầu)</span>
              )}
            </div>
          </div>

          <p className="text-slate-500 text-[12.5px] italic">
            Tên đề tài của sinh viên sẽ giữ nguyên tên cũ và sinh viên sẽ nhận được thông báo về kết quả từ chối.
          </p>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onConfirm(item.publicId)}
            className="h-8 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isPending ? 'Đang từ chối...' : 'Xác nhận từ chối'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface TopicTitleHistoryModalProps {
  item: TopicTitleHistoryResponse | null
  onClose: () => void
}

export const TopicTitleHistoryModal: React.FC<TopicTitleHistoryModalProps> = ({
  item,
  onClose,
}) => {
  if (!item) return null

  return <TopicTitleHistoryModalContent item={item} onClose={onClose} />
}

const TopicTitleHistoryModalContent: React.FC<{
  item: TopicTitleHistoryResponse
  onClose: () => void
}> = ({ item, onClose }) => {
  const { data: historyList = [], isLoading, isError } = useTopicTitleHistory(
    item.topicPublicId,
  )

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[680px] max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Lịch sử thay đổi tên đề tài
              </h3>
              <p className="text-xs text-slate-500">
                Sinh viên: <span className="font-semibold text-slate-700">{item.studentName}</span> ({item.studentCode})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {isLoading ? (
            <div className="space-y-3 py-6">
              <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-rose-500">
              <p className="font-semibold">Không thể tải lịch sử tên đề tài.</p>
              <p className="text-slate-400 mt-1">Vui lòng thử lại sau.</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Chưa có bản ghi lịch sử nào cho đề tài này.
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 my-2">
              {historyList.map((h, idx) => {
                const isInitial = h.oldName === null
                const isPending = h.status === 'PENDING'
                const isApproved = h.status === 'APPROVED'
                const isRejected = h.status === 'REJECTED'

                return (
                  <div key={h.publicId} className="relative group">
                    {/* Dot on timeline */}
                    <div
                      className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${
                        isApproved
                          ? 'bg-emerald-500'
                          : isRejected
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                      }`}
                    />

                    <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                              isInitial
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {isInitial ? 'Chốt tên lần đầu' : 'Xin đổi tên'}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            #{historyList.length - idx}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-1.5">
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              Đã duyệt
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-100 text-rose-800">
                              <XCircle size={12} className="text-rose-600" />
                              Đã từ chối
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-800">
                              <Clock size={12} className="text-amber-600" />
                              Chờ duyệt
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Topic Names */}
                      <div className="space-y-1 pt-1">
                        <div>
                          <span className="text-slate-500 font-medium">Tên đề xuất:</span>{' '}
                          <span className="font-bold text-slate-900">{h.newName}</span>
                        </div>
                        {h.oldName && (
                          <div className="text-[11.5px] text-slate-500">
                            <span>Tên trước đó:</span>{' '}
                            <span className="line-through text-slate-600">{h.oldName}</span>
                          </div>
                        )}
                      </div>

                      {/* Metadata: Requested at & Reviewed at */}
                      <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          <span>Gửi lúc: {formatDate(h.requestedAt, 'full')}</span>
                        </div>
                        {h.reviewedAt && (
                          <div className="flex items-center gap-1">
                            <User size={12} className="text-slate-400" />
                            <span>
                              {h.reviewerName ?? 'Giảng viên'}{' '}
                              ({formatDate(h.reviewedAt, 'full')})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

/** Giữ lại TopicDetailModal để tương thích nếu có import */
interface TopicDetailModalProps {
  item: TopicTitleHistoryResponse | null
  onClose: () => void
}

export const TopicDetailModal: React.FC<TopicDetailModalProps> = ({ item, onClose }) => {
  if (!item) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[560px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Chi tiết yêu cầu tên đề tài</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500">Họ và tên:</span>{' '}
              <b className="text-slate-800">{item.studentName}</b>
            </div>
            <div>
              <span className="text-slate-500">MSSV:</span>{' '}
              <b className="font-mono text-slate-800">{item.studentCode}</b>
            </div>
            <div>
              <span className="text-slate-500">Ngày gửi đơn:</span>{' '}
              <b className="text-slate-800">{formatDate(item.requestedAt, 'full')}</b>
            </div>
            <div>
              <span className="text-slate-500">Trạng thái:</span>{' '}
              <b
                className={
                  item.status === 'APPROVED'
                    ? 'text-emerald-600'
                    : item.status === 'REJECTED'
                      ? 'text-rose-600'
                      : 'text-amber-600'
                }
              >
                {item.statusDescription || item.status}
              </b>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <span className="block text-slate-500 font-semibold mb-1 text-[11px]">Tên mới:</span>
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl font-bold text-slate-900 leading-snug">
                {item.newName}
              </div>
            </div>
            <div>
              <span className="block text-slate-500 font-semibold mb-1 text-[11px]">Tên cũ:</span>
              <div
                className={`p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium leading-snug ${
                  item.oldName ? 'text-slate-700' : 'text-slate-400 italic'
                }`}
              >
                {item.oldName ?? 'Chưa có (Chốt lần đầu)'}
              </div>
            </div>
          </div>

          {item.reviewerName && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
              <span className="font-semibold text-slate-700">Người xử lý:</span> {item.reviewerName}
              {item.reviewedAt && (
                <span className="ml-2 text-slate-400">
                  ({formatDate(item.reviewedAt, 'full')})
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
