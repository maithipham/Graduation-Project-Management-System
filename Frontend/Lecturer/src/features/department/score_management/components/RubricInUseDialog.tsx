import { Copy, ShieldAlert } from 'lucide-react'
import { Button, Dialog, DialogContent } from '@/shared/components/ui'

export interface RubricInUseInfo {
  semesterName: string
  /** null = học kỳ chưa có rubric loại này (vẫn bị khóa) → ẩn nút Nhân bản */
  templatePublicId: string | null
  templateName: string | null
}

interface RubricInUseDialogProps {
  info: RubricInUseInfo | null
  onClone: (publicId: string, name: string) => void
  onClose: () => void
}

/** Cảnh báo không đổi được rubric của học kỳ: BE trả canChange = false (đã có phiếu chấm / học kỳ đã khóa) */
export function RubricInUseDialog({ info, onClone, onClose }: RubricInUseDialogProps) {
  return (
    <Dialog open={info !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[460px] gap-0 overflow-hidden p-0">
        {info && (
          <>
            <div className="border-b border-rose-100 bg-rose-50/80 px-6 py-4 pr-12">
              <h2 className="flex items-center gap-2 text-[15px] font-bold text-rose-900!">
                <ShieldAlert className="h-4.5 w-4.5" />
                Không thể đổi rubric
              </h2>
            </div>
            <div className="space-y-3 px-6 py-4 text-[13px] text-slate-700">
              <p>
                <b>{info.semesterName}</b> đã có phiếu chấm hoặc đã khóa nên không thể đổi rubric
                {info.templateName ? (
                  <>
                    {' '}
                    <b>{info.templateName}</b>
                  </>
                ) : null}
                . Đổi rubric lúc này sẽ làm điểm đã chấm không khớp tiêu chí.
              </p>
              {info.templatePublicId && (
                <p className="text-[12.5px] text-slate-500">
                  Nếu cần điều chỉnh tiêu chí, hãy nhân bản rubric này để tạo phiên bản mới và áp dụng cho học kỳ sau.
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Đóng
              </Button>
              {info.templatePublicId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onClone(info.templatePublicId as string, info.templateName ?? '')}
                >
                  <Copy className="h-4 w-4" />
                  Nhân bản để áp dụng kỳ sau
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
