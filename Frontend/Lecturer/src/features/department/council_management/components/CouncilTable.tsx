import { useState } from 'react'
import { Eye, Award, MapPin, Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/shared/components/ui/table'
import type { DefenseCouncil } from '../types'
import {
  formatDefenseDateRange,
  getMemberCount,
  isCouncilMembersComplete,
} from '../utils/councilFormatters'
import { useUpdateCouncilLocation } from '../hooks/useDefenseCouncils'

interface CouncilTableProps {
  councils: DefenseCouncil[]
  isLoading?: boolean
  onViewDetail: (council: DefenseCouncil) => void
  onCreate: () => void
}

export function CouncilTable({ councils, isLoading, onViewDetail, onCreate }: CouncilTableProps) {
  const updateLocationMutation = useUpdateCouncilLocation()
  const [editingLocations, setEditingLocations] = useState<Record<string, string>>({})

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

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full text-left border-collapse">
          <TableHeader className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <TableRow>
              <TableHead className="py-3.5 px-4 w-12 text-center">STT</TableHead>
              <TableHead className="py-3.5 px-4">Hội đồng</TableHead>
              <TableHead className="py-3.5 px-4">Ngày bảo vệ</TableHead>
              <TableHead className="py-3.5 px-4">Phòng</TableHead>
              <TableHead className="py-3.5 px-4 w-[100px] text-center">Số SV</TableHead>
              <TableHead className="py-3.5 px-4 w-[130px]">TV</TableHead>
              <TableHead className="py-3.5 px-4 text-right w-[140px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-[13px]">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="py-3.5 px-4">
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : councils.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="text-[14px] font-bold text-slate-700">
                    Chưa có hội đồng nào phù hợp
                  </div>
                  <p className="text-[12.5px] text-slate-500 mt-1 mb-4">
                    Hãy nhấn nút "Tạo hội đồng" để khởi tạo hội đồng bảo vệ mới cho bộ môn.
                  </p>
                  <Button
                    type="button"
                    onClick={onCreate}
                    className="h-9 px-4 rounded-lg bg-[#1565C0] text-white text-[13px] font-semibold hover:bg-[#0D47A1] inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Tạo hội đồng đầu tiên
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              councils.map((c, index) => {
                const memberCount = getMemberCount(c)
                const isFull = isCouncilMembersComplete(c)
                const roomValue = editingLocations[c.publicId] ?? c.location ?? ''

                return (
                  <TableRow key={c.publicId} className="hover:bg-slate-50/80 transition">
                    <TableCell className="py-3.5 px-4 text-center font-semibold text-slate-500">
                      {index + 1}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onViewDetail(c)}
                          className="font-bold text-slate-800 hover:text-[#1565C0] text-left cursor-pointer"
                        >
                          {c.name || c.code}
                        </button>
                        {c.status === 'PUBLISHED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Đã công bố
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-700">
                        {formatDefenseDateRange(c.defenseStartTime, c.defenseEndTime)}
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 whitespace-nowrap">
                      <div className="relative inline-flex items-center">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                        <input
                          type="text"
                          value={roomValue}
                          onChange={(e) =>
                            setEditingLocations((prev) => ({
                              ...prev,
                              [c.publicId]: e.target.value,
                            }))
                          }
                          onBlur={() => handleSaveLocation(c)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              e.currentTarget.blur()
                            }
                          }}
                          aria-label={`Phòng bảo vệ của ${c.name || c.code}`}
                          placeholder="Nhập phòng..."
                          title="Nhập tên phòng bảo vệ và nhấn Enter để lưu"
                          className="w-44 h-8 pl-8 pr-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white text-[12px] font-semibold text-slate-700 outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-center">
                      <span
                        className={`font-bold text-[13.5px] ${c.studentCount > 0 ? 'text-[#1565C0]' : 'text-slate-400'}`}
                      >
                        {c.studentCount}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      {isFull ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 5/5 TV
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {memberCount}/5 TV
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewDetail(c)}
                          className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 inline-flex items-center justify-center transition cursor-pointer"
                          title="Xem chi tiết"
                          aria-label={`Xem chi tiết ${c.name || c.code}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
