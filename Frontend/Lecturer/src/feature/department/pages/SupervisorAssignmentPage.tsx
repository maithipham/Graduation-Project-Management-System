import React, { useState, useEffect } from 'react'
import {
  CheckCircle2,
  UserPlus,
} from 'lucide-react'

import { departmentService, type SupervisorQuota } from '@/feature/department/services'

interface UnassignedStudent {
  id: string
  code: string
  name: string
  email: string
  proposedTopic?: string
  status: 'rejected' | 'timeout'
}

export const SupervisorAssignmentPage: React.FC = () => {
  const [supervisors, setSupervisors] = useState<SupervisorQuota[]>([])
  const [unassignedList, setUnassignedList] = useState<UnassignedStudent[]>([
    {
      id: 'sv-un-1',
      code: 'SV202604',
      name: 'Phạm Thu Thảo',
      email: 'thao.pt@sinhvien.edu.vn',
      proposedTopic: 'Phát triển ứng dụng Mobile quản lý tài chính cá nhân',
      status: 'timeout',
    },
    {
      id: 'sv-un-2',
      code: 'SV202611',
      name: 'Đặng Quốc Huy',
      email: 'huy.dq@sinhvien.edu.vn',
      proposedTopic: 'Hệ thống gợi ý sản phẩm Thương mại điện tử',
      status: 'rejected',
    },
    {
      id: 'sv-un-3',
      code: 'SV202619',
      name: 'Vũ Minh Anh',
      email: 'anh.vm@sinhvien.edu.vn',
      proposedTopic: 'Tối ưu hóa thuật toán định tuyến giao hàng chặng cuối',
      status: 'timeout',
    },
  ])

  const [selectedSupervisors, setSelectedSupervisors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    departmentService.getSupervisorsWithQuota().then(setSupervisors)
  }, [])

  function handleAssign(studentId: string) {
    const supervisorId = selectedSupervisors[studentId]
    if (!supervisorId) return

    departmentService.assignSupervisor(studentId, supervisorId).then(() => {
      const student = unassignedList.find((s) => s.id === studentId)
      const supervisor = supervisors.find((sp) => sp.id === supervisorId)
      setUnassignedList((prev) => prev.filter((s) => s.id !== studentId))
      setMessage(`Đã phân công thành công GVHD ${supervisor?.name} cho sinh viên ${student?.name}.`)
      setTimeout(() => setMessage(null), 4000)
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Phân Công GVHD Thủ Công (BF-02)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Quy tắc BR-08 & BR-09: Sau khi hết hạn đăng ký nguyện vọng, Trưởng bộ môn chỉ định GVHD còn chỉ tiêu cho các sinh viên chưa có người hướng dẫn.
        </p>

        {message && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {message}
          </div>
        )}
      </div>

      {/* Danh sách SV cần phân công */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Danh sách sinh viên chưa có GVHD ({unassignedList.length} sinh viên)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Đơn đăng ký bị từ chối hoặc hết thời hạn chưa được duyệt
            </p>
          </div>
        </div>

        {unassignedList.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            Tất cả sinh viên đã được phân công giảng viên hướng dẫn thành công!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="p-3.5">Mã SV</th>
                  <th className="p-3.5">Họ và tên</th>
                  <th className="p-3.5">Đề tài dự kiến</th>
                  <th className="p-3.5">Lý do</th>
                  <th className="p-3.5">Chọn GVHD còn chỉ tiêu</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unassignedList.map((sv) => (
                  <tr key={sv.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-medium text-slate-900">{sv.code}</td>
                    <td className="p-3.5 font-medium">{sv.name}</td>
                    <td className="p-3.5 text-slate-500 max-w-xs truncate">
                      {sv.proposedTopic || 'Chưa đăng ký tên đề tài'}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                        {sv.status === 'timeout' ? 'Hết hạn đăng ký' : 'Bị từ chối'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={selectedSupervisors[sv.id] || ''}
                        onChange={(e) =>
                          setSelectedSupervisors({
                            ...selectedSupervisors,
                            [sv.id]: e.target.value,
                          })
                        }
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                      >
                        <option value="">-- Chọn Giảng viên hướng dẫn --</option>
                        {supervisors.map((sp) => {
                          const isFull = sp.currentStudents >= sp.maxQuota
                          return (
                            <option
                              key={sp.id}
                              value={sp.id}
                              disabled={isFull}
                            >
                              {sp.name} ({sp.currentStudents}/{sp.maxQuota} SV)
                              {isFull ? ' - ĐÃ ĐẦY' : ''}
                            </option>
                          )
                        })}
                      </select>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleAssign(sv.id)}
                        disabled={!selectedSupervisors[sv.id]}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-semibold transition"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Chỉ định
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default SupervisorAssignmentPage
