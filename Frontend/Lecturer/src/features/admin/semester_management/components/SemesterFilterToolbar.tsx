import React from 'react'
import { Search, Plus, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'

interface SemesterFilterToolbarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedStatus: string
  onStatusChange: (status: string) => void
  totalCount: number
  onOpenAddModal: () => void
  onExportCsv?: () => void
}

export const SemesterFilterToolbar: React.FC<SemesterFilterToolbarProps> = ({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  totalCount,
  onOpenAddModal,
}) => {
  return (
    <div className="flex flex-col gap-3 p-4 bg-white border-b border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search & Filters */}
        <div className="flex flex-1 items-center gap-2.5 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Tìm theo tên học kỳ..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-8 h-10 w-full bg-slate-50/70 border-slate-200 focus:bg-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-auto min-w-[130px] h-10 bg-white border-slate-200 text-sm font-medium shrink-0"
            aria-label="Lọc theo trạng thái học kỳ"
          >
            <option value="">Trạng thái</option>
            <option value="active">Đang diễn ra</option>
            <option value="upcoming">Chưa bắt đầu</option>
            <option value="ended">Đã kết thúc</option>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={onOpenAddModal}
            className="h-10 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-sm font-semibold gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm học kỳ</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
        <div>
          Tổng kết quả:{' '}
          <span className="font-semibold text-slate-800">{totalCount}</span> học kỳ
        </div>
        {(searchTerm || selectedStatus) && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('')
              onStatusChange('')
            }}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        )}
      </div>
    </div>
  )
}
