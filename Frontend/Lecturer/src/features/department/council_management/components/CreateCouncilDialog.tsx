import { useState, useId, useEffect } from 'react'
import { Award, ArrowRight, Save } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { useCreateCouncilBatch } from '../hooks/useDefenseCouncils'
import { generateCouncilCodes } from '../utils/councilFormatters'

interface CreateCouncilDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  semesterId: number | string
  majorId: number | string
  majorCode?: string
  academicYear?: string
  existingCouncilCount?: number
  onSuccessAndGoToAssign?: (firstCouncilId?: string) => void
}

export function CreateCouncilDialog({
  open,
  onOpenChange,
  semesterId,
  majorId,
  majorCode = 'KTPM',
  academicYear,
  existingCouncilCount = 0,
  onSuccessAndGoToAssign,
}: CreateCouncilDialogProps) {
  const quantityInputId = useId()
  const startDateInputId = useId()
  const endDateInputId = useId()

  const [quantity, setQuantity] = useState<number>(3)
  const [defenseStartTime, setDefenseStartTime] = useState<string>('')
  const [defenseEndTime, setDefenseEndTime] = useState<string>('')

  const createBatchMutation = useCreateCouncilBatch()

  // Default dates: 7 days from now, 08:00 to +2 days 17:00
  useEffect(() => {
    if (open) {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 8, 0)
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 9, 17, 0)

      const toLocalISO = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      }

      setDefenseStartTime(toLocalISO(start))
      setDefenseEndTime(toLocalISO(end))
      setQuantity(3)
    }
  }, [open])

  const previewCodes = generateCouncilCodes(
    majorCode,
    Math.max(0, Math.min(quantity || 0, 20)),
    existingCouncilCount,
    academicYear,
  )

  const handleSubmit = (andAssign: boolean) => {
    if (!quantity || quantity <= 0) return
    if (!defenseStartTime || !defenseEndTime) return

    createBatchMutation.mutate(
      {
        semesterId,
        majorId,
        quantity,
        defenseStartTime,
        defenseEndTime,
      },
      {
        onSuccess: (data) => {
          onOpenChange(false)
          if (andAssign && onSuccessAndGoToAssign) {
            const firstId = Array.isArray(data) && data[0]?.publicId ? data[0].publicId : undefined
            onSuccessAndGoToAssign(firstId)
          }
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] p-0 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-200/90 flex flex-row items-start gap-3 bg-slate-50/70">
          <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] text-[#1565C0] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <DialogTitle className="text-base font-bold tracking-tight text-slate-800">
              Tạo hội đồng bảo vệ
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Thiết lập số lượng hội đồng và lịch bảo vệ chung cho bộ môn
            </p>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4 text-left">
          {/* Quantity Input */}
          <div>
            <label
              htmlFor={quantityInputId}
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Số lượng hội đồng <span className="text-rose-500">*</span>
            </label>
            <input
              id={quantityInputId}
              type="number"
              min={1}
              max={20}
              value={quantity || ''}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
              placeholder="VD: 3"
              className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition"
            />
            <div className="mt-2.5">
              <div className="text-[11.5px] font-medium text-slate-500 mb-1.5">
                Mã hội đồng dự kiến tự sinh theo mã bộ môn (
                <span className="font-bold text-[#1565C0]">{majorCode}</span>):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {previewCodes.map((code) => (
                  <span
                    key={code}
                    className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#E3F2FD] text-[#1565C0] border border-blue-200"
                  >
                    {code}
                  </span>
                ))}
                {quantity > 20 && (
                  <span className="text-xs text-slate-400 self-center">...tối đa 20</span>
                )}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor={startDateInputId}
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Từ ngày (Ngày bảo vệ chung) <span className="text-rose-500">*</span>
              </label>
              <input
                id={startDateInputId}
                type="datetime-local"
                value={defenseStartTime}
                onChange={(e) => setDefenseStartTime(e.target.value)}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
            <div>
              <label
                htmlFor={endDateInputId}
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Đến ngày <span className="text-rose-500">*</span>
              </label>
              <input
                id={endDateInputId}
                type="datetime-local"
                value={defenseEndTime}
                onChange={(e) => setDefenseEndTime(e.target.value)}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
          >
            Hủy
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => handleSubmit(false)}
            disabled={createBatchMutation.isPending || quantity < 1}
            className="h-9 px-4 rounded-lg bg-[#1565C0] text-white text-xs font-semibold hover:bg-[#0D47A1] inline-flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => handleSubmit(true)}
            disabled={createBatchMutation.isPending || quantity < 1}
            className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 inline-flex items-center gap-1.5"
          >
            <span>Lưu &amp; Gán giảng viên</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
