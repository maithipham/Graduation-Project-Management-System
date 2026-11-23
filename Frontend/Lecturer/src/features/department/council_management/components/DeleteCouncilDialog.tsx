import { Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog'
import type { DefenseCouncil } from '../types'
import { useDeleteCouncil } from '../hooks/useDefenseCouncils'

interface DeleteCouncilDialogProps {
  council: DefenseCouncil | null
  onOpenChange: (open: boolean) => void
}

/** Xác nhận xóa hội đồng (BE chặn nếu hội đồng đã có sinh viên / phản biện / phiếu chấm) */
export function DeleteCouncilDialog({ council, onOpenChange }: DeleteCouncilDialogProps) {
  const mutation = useDeleteCouncil()

  return (
    <Dialog open={Boolean(council)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[460px] p-0 gap-0 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <div className="px-6 pt-5 pb-4 flex items-start gap-3 pr-12">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <DialogTitle className="text-[16px] font-bold tracking-tight text-slate-800">
              Xóa hội đồng
            </DialogTitle>
            <p className="text-[13px] text-slate-600 mt-1.5">
              Bạn có chắc muốn xóa <b>{council?.name || council?.code}</b>? Thao tác này sẽ xóa cả danh
              sách thành viên và không thể hoàn tác.
            </p>
          </div>
        </div>
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50"
          >
            Hủy
          </Button>
          <Button
            type="button"
            disabled={mutation.isPending}
            onClick={() => {
              if (!council) return
              mutation.mutate(council.publicId, { onSuccess: () => onOpenChange(false) })
            }}
            className="h-9 px-4 rounded-lg bg-rose-600 text-white text-[13px] font-semibold hover:bg-rose-700 shadow-sm"
          >
            {mutation.isPending ? 'Đang xóa...' : 'Xóa hội đồng'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
