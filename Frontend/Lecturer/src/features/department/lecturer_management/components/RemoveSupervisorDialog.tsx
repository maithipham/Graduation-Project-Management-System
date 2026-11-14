import { AlertTriangle, Trash2 } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
} from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import type { SupervisorLecturer } from '../types'
import { getAvatarColor, getAvatarInitials } from '../utils/teacherDisplay'

interface RemoveSupervisorDialogProps {
  lecturer: SupervisorLecturer | null
  semesterName?: string
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isPending?: boolean
}

export function RemoveSupervisorDialog({
  lecturer,
  semesterName,
  open,
  onClose,
  onConfirm,
  isPending = false,
}: RemoveSupervisorDialogProps) {
  if (!lecturer) return null

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !isPending && onClose()}>
      <DialogContent className="max-w-[480px] gap-0 p-0 overflow-hidden rounded-2xl">
        {/* Header Modal */}
        <div className="flex items-start gap-3.5 border-b border-slate-200 px-6 pt-5 pb-4 bg-white">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">
              Loại bỏ giảng viên hướng dẫn
            </h3>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              Xác nhận loại bỏ khỏi danh sách GVHD của học kỳ
            </p>
          </div>
        </div>

        {/* Nội dung xác nhận */}
        <div className="px-6 py-4 space-y-3.5 bg-white">
          {/* Card tóm tắt giảng viên */}
          <div className="flex items-center gap-3.5 rounded-xl border border-slate-200/90 bg-slate-50/80 p-3.5">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-2xs',
                getAvatarColor(lecturer.email || lecturer.name),
              )}
            >
              {getAvatarInitials(lecturer.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {lecturer.title && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-700 bg-white border border-slate-200">
                    {lecturer.title}
                  </span>
                )}
                <span className="text-[14px] font-bold text-slate-800 truncate">
                  {lecturer.name}
                </span>
                {lecturer.teacherCode && (
                  <span className="font-mono text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.2 rounded shadow-2xs">
                    {lecturer.teacherCode}
                  </span>
                )}
              </div>
              <div className="text-[12px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>{lecturer.department || lecturer.categoryLabel || '—'}</span>
                <span>·</span>
                <span className="text-slate-600">{lecturer.email}</span>
              </div>
            </div>
          </div>

          {/* Warning Callout */}
          <div className="rounded-xl border border-rose-200/80 bg-rose-50/70 p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div className="text-[12.5px] text-rose-900 leading-relaxed">
              Bạn có chắc chắn muốn loại bỏ giảng viên{' '}
              <strong className="text-rose-950 font-bold">
                {lecturer.title ? `${lecturer.title} ` : ''}{lecturer.name}
              </strong>{' '}
              khỏi danh sách giáo viên hướng dẫn trong{' '}
              <span className="font-semibold text-rose-950">
                {semesterName || 'học kỳ này'}
              </span>?
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="flex justify-end gap-2.5 border-t border-slate-200 bg-slate-50/70 px-6 py-3.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="h-9 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition shadow-none cursor-pointer"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-semibold transition shadow-sm shadow-rose-600/20 inline-flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            {isPending ? 'Đang loại bỏ...' : 'Xác nhận loại bỏ'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
