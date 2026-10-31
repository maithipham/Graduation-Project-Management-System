import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { SlidersHorizontal, X, Check, Loader2 } from 'lucide-react'
import { Button, Dialog, DialogContent } from '@/shared/components/ui'
import { toast } from '@/shared/components/feedback'
import { supervisorService } from '../services/supervisor.service'
import type { TitleQuotaConfig } from '../types'

interface QuotaConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
  semesterId?: string
}

export function QuotaConfigModal({
  open,
  onOpenChange,
  onSaved,
  semesterId,
}: QuotaConfigModalProps) {
  const queryClient = useQueryClient()
  const { data: serverQuotas, isLoading } = useQuery({
    queryKey: ['advisor-quotas', semesterId],
    queryFn: () => supervisorService.getAdvisorQuotas(semesterId),
    enabled: open,
  })

  const [quotas, setQuotas] = useState<TitleQuotaConfig[]>(() =>
    supervisorService.getTitleQuotas(),
  )
  const [prevServerQuotas, setPrevServerQuotas] = useState<TitleQuotaConfig[] | undefined>()
  const [isSaving, setIsSaving] = useState(false)

  if (serverQuotas && serverQuotas !== prevServerQuotas) {
    setPrevServerQuotas(serverQuotas)
    setQuotas(serverQuotas)
  }

  const handleOpen = (nextOpen: boolean) => {
    if (isSaving) return
    onOpenChange(nextOpen)
  }

  const handleChange = (
    id: string | number,
    field: 'internal' | 'external',
    rawVal: string,
  ) => {
    const trimmed = rawVal.trim()
    const val = trimmed === '' ? null : parseInt(trimmed)
    setQuotas((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: isNaN(val as number) ? null : val } : item,
      ),
    )
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await supervisorService.saveAdvisorQuotas(quotas, semesterId)
      queryClient.invalidateQueries({ queryKey: ['advisor-quotas'] })
      queryClient.invalidateQueries({ queryKey: ['supervisors'] })
      toast.success('Lưu thiết lập hạn mức theo chức danh thành công')
      onSaved?.()
      onOpenChange(false)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Lưu thiết lập hạn mức thất bại'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-[620px] p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-slate-800">
                Thiết lập hạn mức theo chức danh
              </h3>
              <p className="text-xs text-slate-500">
                Quy định số lượng SV nhận hướng dẫn cho GV Trong trường & Ngoài trường
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Học hàm / Học vị</th>
                  <th className="py-2.5 px-4 text-center">Trong trường (SV)</th>
                  <th className="py-2.5 px-4 text-center">Ngoài trường (SV)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {quotas.map((item) => {
                  const displayName = item.titleName || item.title || ''
                  const displayShort = item.academicTitle || item.shortTitle || ''
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {displayName || displayShort || `Chức danh #${item.academicTitleId || item.id}`}
                        {displayShort && displayShort !== displayName && (
                          <span className="text-slate-400 font-normal"> ({displayShort})</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="1"
                          max="50"
                          placeholder="Chưa đặt"
                          value={item.internal ?? ''}
                          onChange={(e) =>
                            handleChange(item.id, 'internal', e.target.value)
                          }
                          className="w-20 h-8 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition shadow-2xs placeholder:font-normal placeholder:text-slate-300"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="1"
                          max="50"
                          placeholder="Chưa đặt"
                          value={item.external ?? ''}
                          onChange={(e) =>
                            handleChange(item.id, 'external', e.target.value)
                          }
                          className="w-20 h-8 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition shadow-2xs placeholder:font-normal placeholder:text-slate-300"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/50">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
            className="font-medium text-slate-700"
          >
            Hủy
          </Button>
          <Button
            type="button"
            disabled={isSaving || isLoading}
            onClick={handleSave}
            className="bg-[#1565C0] hover:bg-blue-700 text-white font-medium"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-1.5" />
            )}
            {isSaving ? 'Đang lưu...' : 'Lưu thiết lập'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

