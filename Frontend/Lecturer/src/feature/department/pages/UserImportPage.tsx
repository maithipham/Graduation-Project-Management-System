import React, { useState, useEffect } from 'react'
import {
  Upload,
  CheckCircle2,
  Search,
  Filter,
} from 'lucide-react'

import { departmentService, type DepartmentUser } from '@/feature/department/services'
import { Badge } from '@/shared/components/ui/badge'

export const UserImportPage: React.FC = () => {
  const [users, setUsers] = useState<DepartmentUser[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'supervisor'>('all')
  const [isImporting, setIsImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)

  useEffect(() => {
    departmentService.getImportedUsers().then(setUsers)
  }, [])

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setTimeout(() => {
      departmentService.importUsers(file).then((res) => {
        setIsImporting(false)
        setImportSuccess(`Đã import thành công ${res.importedCount} bản ghi hợp lệ. Định dạng email miền .edu đã được xác thực.`)
      })
    }, 800)
  }

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Quản Lý & Import Danh Sách SV/GVHD (BF-01)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Nạp danh sách sinh viên đủ điều kiện làm đồ án và giảng viên hướng dẫn khả dụng. Kiểm tra miền email .edu, chống ghi đè tài khoản.
        </p>

        {/* Upload Zone */}
        <div className="mt-5 border-2 border-dashed border-sky-300 bg-sky-50/40 rounded-xl p-6 text-center hover:bg-sky-50 transition">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
            <div className="h-12 w-12 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-3 shadow-sm">
              <Upload className="h-6 w-6" />
            </div>
            <span className="font-semibold text-slate-900 text-sm">
              Tải lên tệp Excel danh sách (.xlsx, .csv)
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Hệ thống tự động kiểm tra định dạng email và loại trừ trùng lặp
            </span>
          </label>
        </div>

        {isImporting && (
          <div className="mt-4 p-3 rounded-lg bg-sky-100 text-sky-800 text-xs flex items-center gap-2">
            <span className="animate-spin h-3.5 w-3.5 border-2 border-sky-600 border-t-transparent rounded-full" />
            Đang xử lý thẩm định và nạp dữ liệu...
          </div>
        )}

        {importSuccess && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {importSuccess}
          </div>
        )}
      </div>

      {/* Danh sách người dùng hiện tại */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, MSV/MSGV..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="student">Sinh viên</option>
              <option value="supervisor">Giảng viên hướng dẫn</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="p-3.5">Mã số</th>
                <th className="p-3.5">Họ và tên</th>
                <th className="p-3.5">Email (.edu)</th>
                <th className="p-3.5">Vai trò</th>
                <th className="p-3.5">Bộ môn</th>
                <th className="p-3.5">GVHD / Đề tài</th>
                <th className="p-3.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5 font-medium text-slate-900">{u.code}</td>
                  <td className="p-3.5 font-medium">{u.name}</td>
                  <td className="p-3.5 text-slate-500">{u.email}</td>
                  <td className="p-3.5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${u.role === 'student'
                        ? 'border-blue-300 text-blue-700 bg-blue-50/40'
                        : 'border-emerald-300 text-emerald-700 bg-emerald-50/40'
                        }`}
                    >
                      {u.role === 'student' ? 'Sinh viên' : 'GVHD'}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-slate-500">{u.department}</td>
                  <td className="p-3.5">
                    {u.assignedSupervisorName ? (
                      <span className="text-emerald-700 font-medium">
                        GVHD: {u.assignedSupervisorName}
                      </span>
                    ) : u.role === 'student' ? (
                      <span className="text-amber-600 font-medium italic">Chưa có GVHD</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                        }`}
                    >
                      {u.status === 'active' ? 'Hoạt động' : 'Chờ duyệt'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default UserImportPage
