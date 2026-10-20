import React, { useState, useRef, useEffect } from 'react'
import { MoreVertical, UserCheck, History } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import type { UserAccount } from '../types/account.types'

interface AccountTableProps {
  accounts: UserAccount[]
  startIndex: number
  onViewAccount: (account: UserAccount) => void
  onViewActivity: (account: UserAccount) => void
}

export const AccountTable: React.FC<AccountTableProps> = ({
  accounts,
  startIndex,
  onViewAccount,
  onViewActivity,
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getRoleBadge = (role: string) => {
    return <span className="text-slate-700 text-sm font-medium">{role}</span>
  }

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Hoạt động
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
        Không hoạt động
      </span>
    )
  }

  return (
    <div className="relative overflow-visible" ref={dropdownRef}>
      <Table containerClassName="overflow-visible">
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            <TableHead className="w-14 text-center font-bold text-slate-600 text-xs uppercase">
              No.
            </TableHead>
            <TableHead className="font-bold text-slate-600 text-xs uppercase">
              Tài khoản
            </TableHead>
            <TableHead className="font-bold text-slate-600 text-xs uppercase">
              Email
            </TableHead>
            <TableHead className="font-bold text-slate-600 text-xs uppercase">
              Vai trò
            </TableHead>
            <TableHead className="font-bold text-slate-600 text-xs uppercase">
              Trạng thái
            </TableHead>
            <TableHead className="w-24 text-center font-bold text-slate-600 text-xs uppercase whitespace-nowrap">
              Thao tác
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {accounts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-slate-400 text-sm">
                Không tìm thấy tài khoản phù hợp với điều kiện tìm kiếm.
              </TableCell>
            </TableRow>
          ) : (
            accounts.map((account, idx) => {
              const isMenuOpen = openDropdownId === account.id
              return (
                <TableRow
                  key={account.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <TableCell className="text-center font-medium text-slate-500 text-xs">
                    {startIndex + idx + 1}
                  </TableCell>

                  <TableCell>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {account.name}
                      </div>
                      {account.unit && account.unit !== '—' && (
                        <div className="text-xs text-slate-500">{account.unit}</div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-slate-600 text-sm font-mono">
                    {account.email}
                  </TableCell>

                  <TableCell>{getRoleBadge(account.role)}</TableCell>

                  <TableCell>{getStatusBadge(account.status)}</TableCell>

                  <TableCell className="text-center relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenDropdownId(isMenuOpen ? null : account.id)
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      aria-label="Thao tác trên tài khoản"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <div
                        className={`absolute right-4 z-50 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-xl animate-in fade-in-0 zoom-in-95 text-left ${
                          idx >= Math.max(0, accounts.length - 2)
                            ? 'bottom-8 origin-bottom-right'
                            : 'top-10 origin-top-right'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenDropdownId(null)
                            onViewAccount(account)
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-700 cursor-pointer whitespace-nowrap"
                        >
                          <UserCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span>Xem thông tin</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOpenDropdownId(null)
                            onViewActivity(account)
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-700 cursor-pointer whitespace-nowrap"
                        >
                          <History className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span className="whitespace-nowrap">Xem lịch sử hoạt động</span>
                        </button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
