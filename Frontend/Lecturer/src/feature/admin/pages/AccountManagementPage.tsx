import React, { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
} from 'lucide-react'

import { accountService, type AdminAccount } from '@/feature/admin/services'
import { Badge } from '@/shared/components/ui/badge'
import type { UserRole } from '@/feature/auth/types'


export const AccountManagementPage: React.FC = () => {
  const [accounts, setAccounts] = useState<AdminAccount[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('lecturer')
  const [department, setDepartment] = useState('Bộ môn Công nghệ phần mềm')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    accountService.getAccounts().then(setAccounts)
  }, [])

  function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email) return

    accountService
      .createAccount({
        name,
        username: username || email.split('@')[0],
        email,
        role,
        department,
      })
      .then((newAcc) => {
        setAccounts([...accounts, newAcc])
        setShowModal(false)
        setName('')
        setUsername('')
        setEmail('')
        setMessage(`Đã tạo tài khoản thành công cho ${newAcc.name} với quyền ${newAcc.role}.`)
        setTimeout(() => setMessage(null), 4000)
      })
  }

  function handleToggleStatus(id: string, currentStatus: 'active' | 'suspended') {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active'
    accountService.updateAccountStatus(id, nextStatus).then(() => {
      setAccounts(
        accounts.map((a) => (a.id === id ? { ...a, status: nextStatus } : a))
      )
    })
  }

  const filtered = accounts.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.username.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = roleFilter === 'all' || a.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản Lý Tài Khoản & Phân Quyền Người Dùng
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tạo mới tài khoản, gán vai trò (Admin, Trưởng bộ môn, Giảng viên), kích hoạt hoặc khóa tài khoản.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-purple-700 text-white hover:bg-purple-800 shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          Thêm tài khoản mới
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {message}
        </div>
      )}

      {/* Bộ lọc và tìm kiếm */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên (Admin)</option>
              <option value="department-head">Trưởng bộ môn (Head)</option>
              <option value="lecturer">Giảng viên (Lecturer)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="p-3.5">Họ và tên</th>
                <th className="p-3.5">Tài khoản (Username)</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Vai trò hệ thống</th>
                <th className="p-3.5">Đơn vị / Bộ môn</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5 font-semibold text-slate-900">{acc.name}</td>
                  <td className="p-3.5 text-slate-500 font-mono text-[11px]">{acc.username}</td>
                  <td className="p-3.5 text-slate-500">{acc.email}</td>
                  <td className="p-3.5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${acc.role === 'admin'
                        ? 'border-purple-300 text-purple-700 bg-purple-50'
                        : acc.role === 'department-head'
                          ? 'border-blue-300 text-blue-700 bg-blue-50'
                          : 'border-emerald-300 text-emerald-700 bg-emerald-50'
                        }`}
                    >
                      {acc.role === 'admin'
                        ? 'Admin'
                        : acc.role === 'department-head'
                          ? 'Trưởng bộ môn'
                          : 'Giảng viên'}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-slate-500">{acc.department}</td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${acc.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                        }`}
                    >
                      {acc.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(acc.id, acc.status)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md transition ${acc.status === 'active'
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                    >
                      {acc.status === 'active' ? 'Khóa' : 'Kích hoạt'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal tạo tài khoản */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Tạo tài khoản người dùng mới</h3>
            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Họ và tên</label>
                <input
                  type="text"
                  placeholder="Vd: TS. Lê Văn Tuấn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Email (.edu)</label>
                <input
                  type="email"
                  placeholder="Vd: tuan.lv@fe.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Tên đăng nhập (Username)</label>
                <input
                  type="text"
                  placeholder="Vd: tuan.lv"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Vai trò</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="lecturer">Giảng viên</option>
                    <option value="department-head">Trưởng bộ môn</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Bộ môn / Đơn vị</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="Bộ môn Công nghệ phần mềm">Bộ môn CNPM</option>
                    <option value="Bộ môn Hệ thống thông tin">Bộ môn HTTT</option>
                    <option value="Bộ môn An toàn thông tin">Bộ môn ATTT</option>
                    <option value="Phòng Đào tạo">Phòng Đào tạo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-medium text-slate-700 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 font-semibold text-white transition"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountManagementPage
