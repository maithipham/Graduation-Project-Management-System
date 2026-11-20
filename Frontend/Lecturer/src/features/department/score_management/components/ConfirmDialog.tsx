import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  /** 'destructive' cho thao tác xóa / hủy, 'default' cho thao tác thường (VD tải lại) */
  confirmVariant?: 'destructive' | 'default'
  /** Đang gọi API → khóa nút, đổi chữ */
  isPending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Hộp xác nhận thay cho `window.confirm()` của mockup */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Xóa',
  confirmVariant = 'destructive',
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && !isPending && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="pr-6 text-slate-900!">{title}</DialogTitle>
          <DialogDescription className="leading-relaxed">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button type="button" variant="ghost" disabled={isPending} onClick={onCancel}>
            Hủy
          </Button>
          <Button type="button" variant={confirmVariant} disabled={isPending} onClick={onConfirm}>
            {isPending ? 'Đang xử lý...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
