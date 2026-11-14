import { useState } from 'react'
import { Eye, CheckCircle2, AlertTriangle, Calendar, Award } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/shared/components/ui/table'
import type { DefenseCouncil } from '../types'
import { formatDefenseDateRange } from '../utils/councilFormatters'
import { useUpdateCouncilLocation } from '../hooks/useDefenseCouncils'

interface CouncilTableProps {
  councils: DefenseCouncil[]
  isLoading?: boolean
  onViewDetail: (council: DefenseCouncil) => void
}

export function CouncilTable({ councils, isLoading, onViewDetail }: CouncilTableProps) {
  const updateLocationMutation = useUpdateCouncilLocation()
  const [editingLocations, setEditingLocations] = useState<Record<string, string>>({})

  const handleLocationChange = (publicId: string, val: string) => {
    setEditingLocations((prev) => ({ ...prev, [publicId]: val }))
  }

  const handleSaveLocation = (council: DefenseCouncil) => {
    const newVal = editingLocations[council.publicId]
    if (newVal === undefined) return
    const trimmed = newVal.trim()
    if (trimmed === (council.location || '')) return

    updateLocationMutation.mutate({
      councilPublicId: council.publicId,
      data: { location: trimmed },
    })
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
        <div className="inline-flex items-center gap-2 text-slate-500 text-xs font-semibold">
          <div className="w-4 h-4 border-2 border-[#1565C0] border-t-transparent rounded-full animate-spin" />
          <span>Đang tải danh sách hội đồng...</span>
        </div>
      </div>
    )
  }

  if (councils.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Award className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Chưa có hội đồng bảo vệ nào</h3>
        <p className="text-xs text-slate-500 mt-1">
          Bấm nút <strong>"+ Tạo hội đồng"</strong> phía trên để khởi tạo danh sách hội đồng cho bộ
          môn.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full text-left border-collapse">
          <TableHeader className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <TableRow>
              <TableHead className="py-3.5 px-4 w-12 text-center">STT</TableHead>
              <TableHead className="py-3.5 px-4">Hội đồng</TableHead>
              <TableHead className="py-3.5 px-4">Ngày bảo vệ</TableHead>
              <TableHead className="py-3.5 px-4 w-60">Phòng</TableHead>
              <TableHead className="py-3.5 px-4 w-28 text-center">Số SV</TableHead>
              <TableHead className="py-3.5 px-4 w-32 text-center">TV</TableHead>
              <TableHead className="py-3.5 px-4 text-right w-24">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-xs">
            {councils.map((c, index) => {
              const memberCount = (c.members || []).length
              const isComplete = memberCount >= 5
              const currentInputVal =
                editingLocations[c.publicId] !== undefined
                  ? editingLocations[c.publicId]
                  : c.location || ''

              return (
                <TableRow
                  key={c.publicId}
                  className="hover:bg-slate-50/70 transition-colors border-b border-slate-100"
                >
                  <TableCell className="py-3.5 px-4 text-center font-medium text-slate-400">
                    {index + 1}
                  </TableCell>
                  <TableCell className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#E3F2FD] text-[#1565C0] border border-blue-200">
                        {c.code}
                      </span>
                      <span className="font-bold text-slate-800 text-[13px]">
                        {c.name || `Hội đồng ${c.code}`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDefenseDateRange(c.defenseStartTime, c.defenseEndTime)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5 px-4">
                    <input
                      type="text"
                      value={currentInputVal}
                      onChange={(e) => handleLocationChange(c.publicId, e.target.value)}
                      onBlur={() => handleSaveLocation(c)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          ;(e.target as HTMLInputElement).blur()
                        }
                      }}
                      placeholder="Nhập phòng..."
                      title="Nhập tên phòng và nhấn Enter hoặc rời chuột để tự động lưu"
                      className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition shadow-2xs placeholder:text-slate-400"
                    />
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                        c.studentCount > 0
                          ? 'bg-sky-50 text-[#1565C0] border-sky-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {c.studentCount} SV
                    </span>
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-center">
                    {isComplete ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>5/5 TV</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>{memberCount}/5 TV</span>
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetail(c)}
                      className="h-8 w-8 p-0 text-slate-500 hover:text-[#1565C0] hover:bg-blue-50/80 rounded-lg"
                      title="Xem chi tiết hội đồng"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
