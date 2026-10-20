import { useState, useMemo } from 'react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { ChevronLeft, ChevronRight, Download, Plus, Upload } from 'lucide-react'
import { exportTableToCsv } from '@/shared/utils/excel'
import { useAccountStore } from '../store/account.store'
import { AccountFilterToolbar } from '../components/AccountFilterToolbar'
import { AccountTable } from '../components/AccountTable'
import { AddAccountDialog } from '../components/AddAccountDialog'
import { AccountDetailDialog } from '../components/AccountDetailDialog'
import { AccountActivityDialog } from '../components/AccountActivityDialog'
import { ImportAccountDialog } from '../components/ImportAccountDialog'
import { ExportAccountDialog } from '../components/ExportAccountDialog'
import type { UserAccount, AddAccountFormValues } from '../types/account.types'

const PAGE_SIZE = 10

type OpenDialog = 'import' | 'export' | null

export default function AccountListPage() {
  const { accounts, addAccount, updateAccount } = useAccountStore()

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null)
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<UserAccount | null>(null)
  const [selectedAccountForActivity, setSelectedAccountForActivity] = useState<UserAccount | null>(null)

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return accounts.filter((account) => {
      const matchSearch =
        !term ||
        account.name.toLowerCase().includes(term) ||
        account.email.toLowerCase().includes(term) ||
        (account.unit && account.unit.toLowerCase().includes(term))

      const matchRole = !selectedRole || account.role === selectedRole
      const matchStatus = !selectedStatus || account.status === selectedStatus

      return matchSearch && matchRole && matchStatus
    })
  }, [accounts, searchTerm, selectedRole, selectedStatus])

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const paginatedAccounts = filteredAccounts.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  )

  const handleExportCsv = (scope: 'filtered' | 'all' = 'filtered') => {
    const listToExport = scope === 'all' ? accounts : filteredAccounts
    const headers = ['Mã ID', 'Họ và tên', 'Email', 'Số điện thoại', 'Vai trò', 'Đơn vị / Khoa', 'Trạng thái', 'Ngày tạo']
    const rows = listToExport.map((a) => [
      a.id,
      a.name,
      a.email,
      a.phone || '',
      a.role,
      a.unit || '',
      a.status === 'active' ? 'Hoạt động' : 'Không hoạt động',
      a.createdAt || '',
    ])
    exportTableToCsv(headers, rows, `danh_sach_tai_khoan_${Date.now()}`)
  }


  return (
    <div className="space-y-4">
      {/* Top Action Buttons (aligned top-right below nav and above table card) */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpenDialog('import')}
          className="h-10 text-xs font-medium gap-1.5 bg-white shadow-xs"
        >
          <Upload className="h-4 w-4" />
          <span>Import file</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setOpenDialog('export')}
          className="h-10 text-xs font-medium gap-1.5 bg-white shadow-xs"
        >
          <Download className="h-4 w-4" />
          <span>Export file</span>
        </Button>

        <Button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="h-10 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-semibold gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm tài khoản</span>
        </Button>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-visible border-slate-200 shadow-xs">
        <AccountFilterToolbar
          searchTerm={searchTerm}
          onSearchChange={(v) => {
            setSearchTerm(v)
            setCurrentPage(1)
          }}
          selectedRole={selectedRole}
          onRoleChange={(r) => {
            setSelectedRole(r)
            setCurrentPage(1)
          }}
          selectedStatus={selectedStatus}
          onStatusChange={(s) => {
            setSelectedStatus(s)
            setCurrentPage(1)
          }}
          totalCount={filteredAccounts.length}
        />

        <AccountTable
          accounts={paginatedAccounts}
          startIndex={startIndex}
          onViewAccount={(acc) => setSelectedAccountForDetail(acc)}
          onViewActivity={(acc) => setSelectedAccountForActivity(acc)}
        />

        {/* Pagination Footer */}
        <div className="flex items-center justify-center px-4 py-3 bg-white border-t border-slate-200">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline ml-1">Trước</span>
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    page === safeCurrentPage
                      ? 'bg-[#1565C0] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2 text-xs"
            >
              <span className="hidden sm:inline mr-1">Sau</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Dialogs */}
      <AddAccountDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        existingAccounts={accounts}
        onAccountAdded={(vals: AddAccountFormValues) => addAccount(vals)}
      />

      <AccountDetailDialog
        account={selectedAccountForDetail}
        open={Boolean(selectedAccountForDetail)}
        onOpenChange={(open) => !open && setSelectedAccountForDetail(null)}
        onUpdateAccount={updateAccount}
      />

      <AccountActivityDialog
        account={selectedAccountForActivity}
        open={Boolean(selectedAccountForActivity)}
        onOpenChange={(open) => !open && setSelectedAccountForActivity(null)}
      />

      <ImportAccountDialog
        open={openDialog === 'import'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      />

      <ExportAccountDialog
        open={openDialog === 'export'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
        totalFiltered={filteredAccounts.length}
        totalAll={accounts.length}
        onExport={handleExportCsv}
      />
    </div>
  )
}
