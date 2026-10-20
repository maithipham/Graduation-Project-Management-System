import React from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'

interface AccountFilterToolbarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedRole: string
  onRoleChange: (role: string) => void
  selectedStatus: string
  onStatusChange: (status: string) => void
  totalCount: number
}

export const AccountFilterToolbar: React.FC<AccountFilterToolbarProps> = ({
  searchTerm,
  onSearchChange,
  selectedRole,
  onRoleChange,
  selectedStatus,
  onStatusChange,
  totalCount,
}) => {
  return (
    <div className="flex flex-col gap-3 p-4 bg-white border-b border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search & Filters */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5 min-w-[280px]">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
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

          {/* Role Filter */}
          <Select
            value={selectedRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="w-auto min-w-[120px] h-10 bg-white border-slate-200 text-sm font-medium shrink-0"
            aria-label="Lọc theo vai trò"
          >
            <option value="">Vai trò</option>
            <option value="Quản trị viên">Quản trị viên</option>
            <option value="Giảng viên">Giảng viên</option>
            <option value="Sinh viên">Sinh viên</option>
          </Select>

          {/* Status Filter */}
          <Select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-auto min-w-[130px] h-10 bg-white border-slate-200 text-sm font-medium shrink-0"
            aria-label="Lọc theo trạng thái"
          >
            <option value="">Trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </Select>
        </div>
      </div>

      {/* Counter bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
        <div>
          Tổng kết quả:{' '}
          <span className="font-semibold text-slate-800">{totalCount}</span> tài khoản
        </div>
        {(searchTerm || selectedRole || selectedStatus) && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('')
              onRoleChange('')
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

