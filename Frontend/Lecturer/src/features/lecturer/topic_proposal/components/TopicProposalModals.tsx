import React from 'react'
import { X } from 'lucide-react'
import type { TopicProposalItem } from '../types/topicProposal.types'

interface ApproveTopicModalProps {
  item: TopicProposalItem | null
  onClose: () => void
  onConfirm: (id: string) => void
}

export const ApproveTopicModal: React.FC<ApproveTopicModalProps> = ({
  item,
  onClose,
  onConfirm,
}) => {
  if (!item) return null

  const hasOld = Boolean(item.oldTopic && item.oldTopic.trim())
  const oldTopicText = hasOld ? item.oldTopic.trim() : 'không có'

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[580px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-slate-900">
            Xác nhận phê duyệt đề tài
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="modal-close-btn w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-4 text-[13.5px]">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-slate-800 leading-relaxed space-y-1.5">
            <div>Bạn có chắc chắn muốn phê duyệt đề tài của sinh viên:</div>
            <div className="text-[15px] font-bold text-emerald-950 flex items-center gap-2">
              <span id="approveStudentName">{item.name}</span>
              <span
                id="approveStudentMssv"
                className="text-[12px] font-mono text-emerald-700 font-semibold"
              >
                ({item.mssv})
              </span>
            </div>
            <div
              className="text-[12.5px] text-slate-600 pt-1 border-t border-emerald-200/60"
              id="approveStudentTopicWrap"
            >
              Đề tài:{' '}
              <span className="font-medium text-slate-800" id="approveStudentTopic">
                <div className="mt-1 space-y-1 text-[13px]">
                  <div>
                    <span className="text-slate-500 font-medium">Tên mới:</span>{' '}
                    <b className="text-slate-900 font-bold">
                      {item.topic || 'Chưa có tên đề tài'}
                    </b>
                  </div>
                  <div className="text-[12px]">
                    <span className="text-slate-500 font-medium">Tên cũ:</span>{' '}
                    <span className={hasOld ? 'text-slate-700 font-medium' : 'text-slate-400 italic'}>
                      {oldTopicText}
                    </span>
                  </div>
                </div>
              </span>
            </div>
          </div>
          <p className="text-slate-500 text-[12.5px] italic">
            Sau khi duyệt, đề tài sẽ được chấp thuận và chuyển sang giai đoạn thực hiện đề cương
            khóa luận tốt nghiệp.
          </p>
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
            type="button"
            id="btnConfirmApprove"
            onClick={() => onConfirm(item.id)}
            className="h-8 px-4 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-[12px] font-bold transition cursor-pointer shadow-xs"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  )
}

interface RejectTopicModalProps {
  item: TopicProposalItem | null
  onClose: () => void
  onConfirm: (id: string, reason?: string) => void
}

export const RejectTopicModal: React.FC<RejectTopicModalProps> = ({
  item,
  onClose,
  onConfirm,
}) => {
  if (!item) return null

  const hasOld = Boolean(item.oldTopic && item.oldTopic.trim())
  const oldTopicText = hasOld ? item.oldTopic.trim() : 'không có'

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[580px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-[17px] font-bold text-slate-900">
            Xác nhận từ chối đề tài
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-4 text-[13.5px]">
          <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-xl text-slate-700 leading-relaxed">
            Bạn có chắc muốn từ chối đề tài của sinh viên{' '}
            <b className="text-rose-950 font-bold">{item.name}</b>?
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-[13px] leading-snug space-y-1">
            <div>
              <span className="text-slate-500 font-medium">Tên mới:</span>{' '}
              <b className="text-slate-900 font-bold">{item.topic}</b>
            </div>
            <div className="text-[12px]">
              <span className="text-slate-500 font-medium">Tên cũ:</span>{' '}
              <span className={hasOld ? 'text-slate-700 font-medium' : 'text-slate-400 italic'}>
                {oldTopicText}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            id="btnConfirmReject"
            onClick={() => onConfirm(item.id)}
            className="h-8 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold transition cursor-pointer shadow-xs"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  )
}

interface TopicDetailModalProps {
  item: TopicProposalItem | null
  onClose: () => void
}

export const TopicDetailModal: React.FC<TopicDetailModalProps> = ({ item, onClose }) => {
  if (!item) return null

  const hasOld = Boolean(item.oldTopic && item.oldTopic.trim())
  const oldTopicText = hasOld ? item.oldTopic.trim() : 'không có'

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[560px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-slate-900">Chi tiết đơn đăng ký đề tài</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-[13px]">
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500">Họ và tên:</span>{' '}
              <b className="text-slate-800">{item.name}</b>
            </div>
            <div>
              <span className="text-slate-500">MSSV:</span>{' '}
              <b className="font-mono text-slate-800">{item.mssv}</b>
            </div>
            <div>
              <span className="text-slate-500">Ngày gửi đơn:</span>{' '}
              <b className="text-slate-800">{item.submittedDate}</b>
            </div>
            <div>
              <span className="text-slate-500">Trạng thái:</span>{' '}
              <b
                className={
                  item.status === 'approved'
                    ? 'text-emerald-600'
                    : item.status === 'rejected'
                      ? 'text-rose-600'
                      : 'text-amber-600'
                }
              >
                {item.status === 'approved'
                  ? 'Đã duyệt'
                  : item.status === 'rejected'
                    ? 'Đã từ chối'
                    : 'Chưa duyệt'}
              </b>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <span className="block text-slate-500 font-semibold mb-1 text-[12px]">Tên mới:</span>
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl font-bold text-slate-900 leading-snug">
                {item.topic}
              </div>
            </div>
            <div>
              <span className="block text-slate-500 font-semibold mb-1 text-[12px]">Tên cũ:</span>
              <div
                className={`p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium leading-snug ${
                  hasOld ? 'text-slate-700' : 'text-slate-400 italic'
                }`}
              >
                {oldTopicText}
              </div>
            </div>
          </div>

          <div>
            <span className="block text-slate-500 font-semibold mb-1">
              Mục tiêu &amp; Mô tả đề tài:
            </span>
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 leading-relaxed">
              {item.description || 'Chưa có mô tả chi tiết.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

