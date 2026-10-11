import React, { useState, useEffect } from 'react'
import { Plus, CheckCircle2, GraduationCap } from 'lucide-react'
import { majorService, type Major } from '@/feature/admin/services'
import { Badge } from '@/shared/components/ui/badge'

export const MajorManagementPage: React.FC = () => {
  const [majors, setMajors] = useState<Major[]>([])
  const [showModal, setShowModal] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('Khoa CNTT - Bộ môn CNPM')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    majorService.getMajors().then(setMajors)
  }, [])

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !code) return

    majorService
      .createMajor({
        code,
        name,
        department,
      })
      .then((newMajor) => {
        setMajors([...majors, newMajor])
        setShowModal(false)
        setCode('')
        setName('')
        setMessage(`Đã tạo chuyên ngành mới ${newMajor.name} (${newMajor.code}) thành công.`)
        setTimeout(() => setMessage(null), 4000)
      })
  }

  function handleToggleStatus(id: string, currentStatus: boolean) {
    const nextStatus = !currentStatus
    majorService.toggleMajorStatus(id, nextStatus).then(() => {
      setMajors(
        majors.map((m) => (m.id === id ? { ...m, isActive: nextStatus } : m))
      )
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <GraduationCap className="text-purple-600" size={26} />
            Quản Lý Chuyên Ngành (Major Management)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Danh mục các chuyên ngành đào tạo, phân bổ đề tài và sinh viên bảo vệ đồ án tốt nghiệp.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={18} />
          <span>Thêm Chuyên Ngành Mới</span>
        </button>
      </div>

      {message && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Majors Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">
            Danh Sách Chuyên Ngành ({majors.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Mã Chuyên Ngành</th>
                <th className="px-6 py-4">Tên Chuyên Ngành</th>
                <th className="px-6 py-4">Bộ Môn / Khoa Phụ Trách</th>
                <th className="px-6 py-4 text-center">Đề Tài Đăng Ký</th>
                <th className="px-6 py-4 text-center">Sinh Viên Tham Gia</th>
                <th className="px-6 py-4 text-center">Trạng Thái</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {majors.map((major) => (
                <tr key={major.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-purple-700">
                    {major.code}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {major.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {major.department}
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-slate-800">
                    {major.totalTopics}
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-slate-800">
                    {major.totalStudents}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={major.isActive ? 'default' : 'secondary'}>
                      {major.isActive ? 'Đang Đào Tạo' : 'Tạm Ngưng'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(major.id, major.isActive)}
                      className="text-xs font-medium text-purple-600 hover:text-purple-800 underline cursor-pointer"
                    >
                      {major.isActive ? 'Tạm ngưng' : 'Kích hoạt lại'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Chuyên Ngành */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Thêm Chuyên Ngành Đào Tạo Mới
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mã chuyên ngành (VD: SE, AI, IA...)
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  placeholder="VD: SE"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tên chuyên ngành
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  placeholder="VD: Kỹ thuật phần mềm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Khoa / Bộ môn phụ trách
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                >
                  Lưu Chuyên Ngành
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MajorManagementPage
