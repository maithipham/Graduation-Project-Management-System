import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, Check, X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { ReviewerLecturer } from '../types'

interface ReviewerComboboxProps {
  currentReviewerId: string | null
  currentReviewerName: string | null
  excludedGvhdNames: string[]
  lecturers: ReviewerLecturer[]
  onSelect: (lecturerId: string | null) => void
}

export function ReviewerCombobox({
  currentReviewerId,
  currentReviewerName,
  excludedGvhdNames,
  lecturers,
  onSelect,
}: ReviewerComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Loại trừ các giảng viên đang là GVHD của sinh viên này
  const eligibleLecturers = lecturers.filter((l) => {
    const isGvhd = excludedGvhdNames.some((gvName) =>
      l.name.toLowerCase().includes(gvName.toLowerCase()) || gvName.toLowerCase().includes(l.name.toLowerCase()),
    )
    if (isGvhd) return false

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const mName = l.name.toLowerCase().includes(q)
      const mDept = l.department.toLowerCase().includes(q)
      if (!mName && !mDept) return false
    }

    return true
  })

  return (
    <div ref={containerRef} className="relative w-full min-w-[210px]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'w-full h-8.5 px-2.5 rounded-lg border text-left text-xs transition flex items-center justify-between gap-1.5 bg-white cursor-pointer shadow-2xs',
          open
            ? 'border-[#1565C0] ring-2 ring-blue-100'
            : 'border-slate-300 hover:border-slate-400',
          currentReviewerName ? 'text-slate-900 font-semibold' : 'text-slate-400 italic font-normal',
        )}
      >
        <span className="truncate">{currentReviewerName || 'Chưa phân công'}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 min-w-[260px] max-h-[260px] overflow-hidden flex flex-col">
          {/* Search */}
          <div className="flex items-center gap-1.5 px-2 py-1 mb-1 border border-slate-200 rounded-lg bg-slate-50 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm GV nhận xét..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-transparent outline-none text-xs text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Options */}
          <div className="overflow-y-auto space-y-0.5 max-h-[190px]">
            {currentReviewerId && (
              <button
                type="button"
                onClick={() => {
                  onSelect(null)
                  setOpen(false)
                }}
                className="w-full px-2.5 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition font-medium flex items-center justify-between cursor-pointer"
              >
                <span>Bỏ người nhận xét</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {eligibleLecturers.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                Không tìm thấy giảng viên phù hợp.
              </div>
            ) : (
              eligibleLecturers.map((l) => {
                const isSelected = l.id === currentReviewerId

                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      onSelect(l.id)
                      setOpen(false)
                    }}
                    className={cn(
                      'w-full px-2.5 py-1.5 text-left text-xs rounded-lg transition flex items-center justify-between gap-1.5 cursor-pointer',
                      isSelected
                        ? 'bg-blue-50 text-[#1565C0] font-bold'
                        : 'hover:bg-slate-50 text-slate-700',
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{l.name}</div>
                      <div className="text-[10.5px] text-slate-400 truncate font-normal">
                        {l.department}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#1565C0] shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

