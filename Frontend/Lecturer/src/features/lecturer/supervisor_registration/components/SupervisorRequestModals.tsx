import React from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@/shared/components/ui'
import { formatDate } from '@/shared/utils'
import type {
  AdvisorRegistrationResponse,
  SupervisorRequestItem,
} from '../types/supervisorRegistration.types'

interface ApproveSupervisorModalProps {
  item: SupervisorRequestItem | null
  isPending?: boolean
  onClose: () => void
  onConfirm: (id: string) => void
}

export const ApproveSupervisorModal: React.FC<ApproveSupervisorModalProps> = ({
  item,
  isPending = false,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open && !isPending) onClose()
      }}
    >
      <DialogContent className="max-w-[560px] p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <DialogTitle className="text-[16px] font-bold text-slate-900">
            Xác nhận phê duyệt đơn đăng ký
          </DialogTitle>
          <DialogDescription className="sr-only">
            Xác nhận tiếp nhận hướng dẫn đồ án cho sinh viên
          </DialogDescription>
        </DialogHeader>

        {item && (
          <div className="p-6 space-y-4 text-[13.5px]">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-slate-800 leading-relaxed space-y-1.5">
              <div>
                Bạn có chắc chắn muốn phê duyệt đơn đăng ký hướng dẫn của sinh
                viên:
              </div>
              <div className="text-[15px] font-bold text-emerald-950 flex items-center gap-2">
                <span>{item.name}</span>
                <span className="text-[12px] font-mono text-emerald-700 font-semibold">
                  ({item.mssv})
                </span>
              </div>
              <div className="text-[12.5px] text-slate-600 pt-1 border-t border-emerald-200/60">
                Đề tài:{' '}
                <span className="font-medium text-slate-800">
                  {item.topic || 'Chưa có tên đề tài cụ thể'}
                </span>
              </div>
            </div>
            <p className="text-slate-500 text-[12.5px] italic">
              Sau khi duyệt, sinh viên sẽ được ghi nhận vào danh sách hướng dẫn
              của bạn trong học kỳ này (chờ Trưởng bộ môn chốt phân công).
            </p>
          </div>
        )}

        <DialogFooter className="mt-0 px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex-row justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            type="button"
            id="btnConfirmApprove"
            variant="success"
            size="sm"
            disabled={isPending || !item}
            onClick={() => item && onConfirm(item.id)}
          >
            {isPending ? 'Đang duyệt...' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface RejectSupervisorModalProps {
  item: SupervisorRequestItem | null
  isPending?: boolean
  onClose: () => void
  onConfirm: (id: string) => void
}

export const RejectSupervisorModal: React.FC<RejectSupervisorModalProps> = ({
  item,
  isPending = false,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open && !isPending) onClose()
      }}
    >
      <DialogContent className="max-w-[560px] p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <DialogTitle className="text-[16px] font-bold text-slate-900">
            Xác nhận từ chối đơn đăng ký
          </DialogTitle>
          <DialogDescription className="sr-only">
            Xác nhận từ chối đơn đăng ký hướng dẫn của sinh viên
          </DialogDescription>
        </DialogHeader>

        {item && (
          <div className="p-6 space-y-4 text-[13.5px]">
            <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-xl text-slate-800 leading-relaxed space-y-1.5">
              <div>
                Bạn có chắc chắn muốn từ chối đơn đăng ký hướng dẫn của sinh
                viên:
              </div>
              <div className="text-[15px] font-bold text-rose-950 flex items-center gap-2">
                <span>{item.name}</span>
                <span className="text-[12px] font-mono text-rose-700 font-semibold">
                  ({item.mssv})
                </span>
              </div>
              <div className="text-[12.5px] text-slate-600 pt-1 border-t border-rose-200/60">
                Đề tài:{' '}
                <span className="font-medium text-slate-800">
                  {item.topic || 'Chưa có tên đề tài cụ thể'}
                </span>
              </div>
            </div>
            <p className="text-slate-500 text-[12.5px] italic">
              Sau khi từ chối, hệ thống sẽ gửi thông báo để sinh viên chọn lại
              nguyện vọng hướng dẫn khác.
            </p>
          </div>
        )}

        <DialogFooter className="mt-0 px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex-row justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            type="button"
            id="btnConfirmReject"
            variant="destructive"
            size="sm"
            disabled={isPending || !item}
            onClick={() => item && onConfirm(item.id)}
          >
            {isPending ? 'Đang từ chối...' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface SupervisorDetailModalProps {
  open: boolean
  data?: AdvisorRegistrationResponse
  isPending: boolean
  error: string | null
  canProcess: boolean
  isActionPending?: boolean
  onClose: () => void
  onApprove?: (detail: AdvisorRegistrationResponse) => void
  onReject?: (detail: AdvisorRegistrationResponse) => void
}

export const SupervisorDetailModal: React.FC<SupervisorDetailModalProps> = ({
  open,
  data,
  isPending,
  error,
  canProcess,
  isActionPending = false,
  onClose,
  onApprove,
  onReject,
}) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isActionPending) onClose()
      }}
    >
      <DialogContent className="max-w-[580px] p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <DialogTitle className="text-[16px] font-bold text-slate-900">
            Chi tiết đơn đăng ký giảng viên hướng dẫn
          </DialogTitle>
          <DialogDescription className="sr-only">
            Thông tin chi tiết đơn đăng ký của sinh viên
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 text-[13.5px]">
          {isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : data ? (
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <dt className="text-xs font-medium text-slate-500">
                  Sinh viên
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {data.studentName}
                </dd>
                <dd className="font-mono text-xs text-slate-500">
                  {data.studentCode}
                </dd>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <dt className="text-xs font-medium text-slate-500">
                  Bộ môn / Chuyên ngành
                </dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {data.majorName || '—'}
                </dd>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 sm:col-span-2">
                <dt className="text-xs font-medium text-slate-500">
                  Đề tài đăng ký
                </dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {data.topicName?.trim() || 'Sinh viên chưa đăng ký tên đề tài'}
                </dd>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <dt className="text-xs font-medium text-slate-500">
                  Ngày gửi đơn
                </dt>
                <dd className="mt-1 text-slate-800">
                  {data.submittedAt ? formatDate(data.submittedAt, 'full') : '—'}
                </dd>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <dt className="text-xs font-medium text-slate-500">
                  Thời gian xử lý
                </dt>
                <dd className="mt-1 text-slate-800">
                  {data.processedAt
                    ? formatDate(data.processedAt, 'full')
                    : 'Chưa xử lý'}
                </dd>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 sm:col-span-2">
                <dt className="text-xs font-medium text-slate-500">
                  Trạng thái hiện tại
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {data.statusDescription}
                </dd>
              </div>
            </dl>
          ) : null}
        </div>

        <DialogFooter className="mt-0 px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex-row justify-end gap-2.5">
          {data?.status === 'PENDING' && canProcess && onApprove && onReject && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                disabled={isActionPending}
                onClick={() => onReject(data)}
              >
                Từ chối
              </Button>
              <Button
                type="button"
                variant="success"
                size="sm"
                disabled={isActionPending}
                onClick={() => onApprove(data)}
              >
                Duyệt
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isActionPending}
            onClick={onClose}
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
