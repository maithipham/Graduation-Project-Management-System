import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Select } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/feedback/toast.store'
import type { UserAccount, AccountRole, AccountStatus } from '../types/account.types'

interface AccountDetailDialogProps {
  account: UserAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateAccount: (
    id: number,
    data: { role?: AccountRole; status?: AccountStatus },
  ) => void
}

interface AccountDetailBodyProps {
  account: UserAccount
  onOpenChange: (open: boolean) => void
  onUpdateAccount: (
    id: number,
    data: { role?: AccountRole; status?: AccountStatus },
  ) => void
}

const AccountDetailBody: React.FC<AccountDetailBodyProps> = ({
  account,
  onOpenChange,
  onUpdateAccount,
}) => {
  const [role, setRole] = useState<AccountRole>(account.role)
  const [status, setStatus] = useState<AccountStatus>(account.status)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isChanged = role !== account.role || status !== account.status

  const handleReset = () => {
    setRole(account.role)
    setStatus(account.status)
  }

  const handleSave = () => {
    setIsSubmitting(true)
    try {
      onUpdateAccount(account.id, { role, status })
      toast.success('Cập nhật tài khoản thành công!')
      onOpenChange(false)
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật tài khoản.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="py-2 space-y-4 text-sm text-left">
        {/* User basic info: Nguyễn Văn A, Quản trị viên */}
        <div className="border-b border-slate-100 pb-3">
          <h4 className="text-base font-bold text-slate-900">{account.name}</h4>
          <p className="text-xs font-medium text-slate-500 mt-0.5">{account.role}</p>
        </div>

        {/* 2-column layout: Cột trái 2/3 (md:col-span-2), Cột phải 1/3 (md:col-span-1) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CỘT TRÁI (2/3): Email, SĐT, Vai trò, Đơn vị/Khoa, Trạng thái */}
          <div className="md:col-span-2 space-y-3">
            {/* Email */}
            <div>
              <span className="block text-xs font-medium text-slate-500 mb-1">Email</span>
              <p className="text-sm font-semibold text-slate-800 break-all">{account.email}</p>
            </div>

            {/* Số điện thoại */}
            <div>
              <span className="block text-xs font-medium text-slate-500 mb-1">Số điện thoại</span>
              <p className="text-sm font-semibold text-slate-800">{account.phone || '—'}</p>
            </div>

            {/* Vai trò */}
            <div>
              <label htmlFor="edit-account-role" className="block text-xs font-medium text-slate-500 mb-1">
                Vai trò
              </label>
              <Select
                id="edit-account-role"
                value={role}
                onChange={(e) => setRole(e.target.value as AccountRole)}
                className="w-full h-9 bg-white text-sm font-medium border-slate-200"
              >
                <option value="Quản trị viên">Quản trị viên</option>
                <option value="Giảng viên">Giảng viên</option>
                <option value="Sinh viên">Sinh viên</option>
              </Select>
            </div>

            {/* Đơn vị / Khoa */}
            <div>
              <span className="block text-xs font-medium text-slate-500 mb-1">Đơn vị / Khoa</span>
              <p className="text-sm font-semibold text-slate-800">{account.unit || 'Phòng Quản trị hệ thống'}</p>
            </div>

            {/* Trạng thái */}
            <div>
              <label htmlFor="edit-account-status" className="block text-xs font-medium text-slate-500 mb-1">
                Trạng thái
              </label>
              <Select
                id="edit-account-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as AccountStatus)}
                className="w-full h-9 bg-white text-sm font-medium border-slate-200"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </Select>
            </div>
          </div>

          {/* CỘT PHẢI (1/3): ID tài khoản, Ngày tạo, Đăng nhập gần nhất */}
          <div className="md:col-span-1 space-y-3 pl-0 md:pl-2">
            {/* ID tài khoản */}
            <div>
              <span className="block text-xs font-medium text-slate-500 mb-1">ID tài khoản</span>
              <p className="text-sm font-semibold text-slate-800">#{account.id}</p>
            </div>

            {/* Ngày tạo */}
            <div>
              <span className="block text-xs font-medium text-slate-500 mb-1">Ngày tạo</span>
              <p className="text-sm font-semibold text-slate-800">{account.createdAt || '10/01/2025'}</p>
            </div>

            {/* Đăng nhập gần nhất */}
            <div>
              <span className="block text-xs font-medium text-slate-500 mb-1">Đăng nhập gần nhất</span>
              <p className="text-sm font-semibold text-slate-800">{account.lastLogin || 'Chưa ghi nhận'}</p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="mt-4 pt-3 border-t border-slate-100">
        {isChanged ? (
          <div className="flex w-full items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={handleReset}
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSave}
              className="bg-[#1565C0] hover:bg-[#0D47A1] text-white"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
        )}
      </DialogFooter>
    </>
  )
}

export const AccountDetailDialog: React.FC<AccountDetailDialogProps> = ({
  account,
  open,
  onOpenChange,
  onUpdateAccount,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Thông tin tài khoản</DialogTitle>
        </DialogHeader>

        {account && (
          <AccountDetailBody
            key={`${account.id}-${account.role}-${account.status}`}
            account={account}
            onOpenChange={onOpenChange}
            onUpdateAccount={onUpdateAccount}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
