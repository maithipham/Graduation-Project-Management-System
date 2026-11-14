import React from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { ACCOUNT_STATUS_FILTER_OPTIONS, type AccountStatusFilter } from '../types/account.types'

const FILTER_SELECT_CLASS =
  'w-auto min-w-[130px] h-10 bg-white border-slate-200 text-sm font-medium shrink-0'

interface AccountFilterToolbarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedStatus: AccountStatusFilter
  onStatusChange: (status: AccountStatusFilter) => void
  totalCount: number
  hasActiveFilters: boolean
  onResetFilters: () => void
}

export const AccountFilterToolbar: React.FC<AccountFilterToolbarProps> = ({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  totalCount,
  hasActiveFilters,
  onResetFilters,
}) => {
  return (
    <div className="flex flex-col gap-3 p-4 bg-white border-b border-slate-200 rounded-t-lg">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search box (bên trái, kéo dài tới sát nhóm bộ lọc) */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Tìm theo tên hoặc email..."
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

        {/* Filters (bên phải) */}
        <div className="flex flex-wrap items-center gap-2.5 md:shrink-0 md:justify-end">
          <Select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as AccountStatusFilter)}
            className={FILTER_SELECT_CLASS}
            aria-label="Lọc theo trạng thái"
          >
            <option value="">Trạng thái</option>
            {ACCOUNT_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Counter bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
        <div>
          Tổng kết quả:{' '}
          <span className="font-semibold text-slate-800">{totalCount}</span> tài khoản
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        )}
      </div>
    </div>
  )
}
