import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  Plus,
  Calendar,
  MapPin,
  CheckCircle2,
} from 'lucide-react'

import { departmentService, type DefenseCouncil } from '@/feature/department/services'
import { Badge } from '@/shared/components/ui/badge'

export const CouncilManagementPage: React.FC = () => {
  const [councils, setCouncils] = useState<DefenseCouncil[]>([])
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [room, setRoom] = useState('')
  const [date, setDate] = useState('2026-11-25')
  const [session, setSession] = useState('Sáng (08:00 - 11:30)')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    departmentService.getCouncils().then(setCouncils)
  }, [])

  function handleCreateCouncil(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !room) return

    departmentService
      .createCouncil({
        name,
        room,
        date,
        session,
        members: [
          { id: 'm1', name: 'PGS. TS. Nguyễn Văn Hùng', roleInCouncil: 'chair' },
          { id: 'm2', name: 'ThS. Hoàng Thị Lan', roleInCouncil: 'secretary' },
          { id: 'm3', name: 'TS. Trần Minh Khôi', roleInCouncil: 'commissioner' },
          { id: 'm4', name: 'TS. Vũ Đình Trọng', roleInCouncil: 'commissioner' },
          { id: 'm5', name: 'TS. Lê Hải Đăng', roleInCouncil: 'commissioner' },
        ],
        assignedStudentIds: ['u3', 'u4'],
      })
      .then((newCouncil) => {
        setCouncils([...councils, newCouncil])
        setShowModal(false)
        setName('')
        setRoom('')
        setMessage('Đã thành lập hội đồng mới thành công với đúng quy chuẩn 5 thành viên!')
        setTimeout(() => setMessage(null), 4000)
      })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Thành Lập Hội Đồng & Lên Lịch Bảo Vệ (BF-06)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quy tắc BR-17: Mỗi hội đồng bảo vệ bắt buộc có đúng 5 thành viên (1 Chủ tịch, 1 Thư ký, 3 Ủy viên).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          Thành lập hội đồng mới
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {message}
        </div>
      )}

      {/* Grid danh sách các hội đồng */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {councils.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-sky-600" />
                  {c.name}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> {c.room}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> {c.date} ({c.session})
                  </span>
                </div>
              </div>
              <Badge className="bg-sky-100 text-sky-800 border-none font-semibold text-[11px]">
                {c.assignedStudentCount} sinh viên
              </Badge>
            </div>

            {/* Thành viên hội đồng */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                Cơ cấu 5 thành viên hội đồng:
              </span>
              <div className="space-y-1.5">
                {c.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <span className="font-medium text-slate-800">{m.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${m.roleInCouncil === 'chair'
                        ? 'border-purple-300 text-purple-700 bg-purple-50'
                        : m.roleInCouncil === 'secretary'
                          ? 'border-blue-300 text-blue-700 bg-blue-50'
                          : 'border-slate-300 text-slate-600 bg-white'
                        }`}
                    >
                      {m.roleInCouncil === 'chair'
                        ? 'Chủ tịch'
                        : m.roleInCouncil === 'secretary'
                          ? 'Thư ký'
                          : 'Ủy viên'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal thành lập hội đồng */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Thành lập Hội đồng mới</h3>
            <form onSubmit={handleCreateCouncil} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Tên hội đồng</label>
                <input
                  type="text"
                  placeholder="Vd: Hội đồng 03 - CNPM"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Phòng bảo vệ</label>
                <input
                  type="text"
                  placeholder="Vd: Phòng 304 - Tòa Gamma"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Ngày bảo vệ</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Ca bảo vệ</label>
                  <select
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="Sáng (08:00 - 11:30)">Sáng (08:00 - 11:30)</option>
                    <option value="Chiều (13:30 - 17:00)">Chiều (13:30 - 17:00)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-[11px] leading-relaxed">
                Hệ thống tự động áp dụng cơ cấu 5 thành viên chuẩn khoa (1 Chủ tịch, 1 Thư ký, 3 Ủy viên) và cho phép phân công sinh viên vào phiên.
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
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 font-semibold text-white transition"
                >
                  Xác nhận tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CouncilManagementPage
