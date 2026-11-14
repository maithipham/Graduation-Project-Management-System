import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Clock } from 'lucide-react'
import type { UserAccount } from '../types/account.types'

interface AccountActivityDialogProps {
  account: UserAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const AccountActivityDialog: React.FC<AccountActivityDialogProps> = ({
  account,
  open,
  onOpenChange,
}) => {
  if (!account) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lịch sử hoạt động - {account.name}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[360px] overflow-y-auto pr-1">
          {account.activities.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Chưa có lịch sử hoạt động nào được ghi nhận.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {account.activities.map((item) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-100 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-semibold text-slate-800">
                    {item.action}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
