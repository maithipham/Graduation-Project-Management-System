import React, { useState, useEffect } from 'react'
import { Plus, CheckCircle2 } from 'lucide-react'

import { semesterService, type Semester } from '@/feature/admin/services'
import { Badge } from '@/shared/components/ui/badge'

export const SemesterManagementPage: React.FC = () => {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [showModal, setShowModal] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [academicYear, setAcademicYear] = useState('2026 - 2027')
  const [startDate, setStartDate] = useState('2027-01-05')
  const [endDate, setEndDate] = useState('2027-05-15')
  const [registrationDeadline, setRegDeadline] = useState('2027-01-25')
  const [defenseDate, setDefenseDate] = useState('2027-05-01')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    semesterService.getSemesters().then(setSemesters)
  }, [])

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !code) return

    semesterService
      .createSemester({
        code,
        name,
        academicYear,
        startDate,
        endDate,
        registrationDeadline,
        defenseDate,
      })
      .then((newSem) => {
        setSemesters([...semesters, newSem])
        setShowModal(false)
        setCode('')
        setName('')
        setMessage(`Đã tạo học kỳ mới ${newSem.name} (${newSem.code}) thành công.`)
        setTimeout(() => setMessage(null), 4000)
      })
  }

  function handleActivate(id: string) {
    semesterService.setActiveSemester(id).then(() => {
      setSemesters(
        semesters.map((s) => ({
          ...s,
          isActive: s.id === id,
        }))
      )
      setMessage('Đã cập nhật học kỳ kích hoạt chính thức của hệ thống.')
      setTimeout(() => setMessage(null), 4000)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản Lý Học Kỳ & Đợt Đồ Án Tốt Nghiệp
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Thiết lập học kỳ, hạn chót nộp nguyện vọng, thời hạn bảo vệ và kích hoạt học kỳ vận hành hiện tại.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-purple-700 text-white hover:bg-purple-800 shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          Tạo học kỳ mới
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {semesters.map((s) => (
          <div
            key={s.id}
            className={`rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${s.isActive
              ? 'bg-purple-50/30 border-purple-300 ring-2 ring-purple-500/20'
              : 'bg-white border-slate-200'
              }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-semibold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded">
                    {s.code}
                  </span>
                  <h2 className="text-base font-bold text-slate-900 mt-1.5">{s.name}</h2>
                  <p className="text-xs text-slate-500">Năm học: {s.academicYear}</p>
                </div>
                {s.isActive && (
                  <Badge className="bg-purple-600 text-white font-semibold text-[10px]">
                    Đang kích hoạt
                  </Badge>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Thời gian kỳ:</span>
                  <span className="font-medium">{s.startDate} → {s.endDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Hạn đăng ký SV:</span>
                  <span className="font-medium text-amber-700">{s.registrationDeadline}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Đợt bảo vệ:</span>
                  <span className="font-medium text-emerald-700">{s.defenseDate}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4">
              {s.isActive ? (
                <div className="text-center text-xs text-purple-700 font-semibold py-1.5">
                  ✓ Học kỳ hoạt động chính
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleActivate(s.id)}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                >
                  Kích hoạt học kỳ này
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Khởi tạo học kỳ đồ án mới</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Mã học kỳ</label>
                <input
                  type="text"
                  placeholder="Vd: SPRING2027"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Tên học kỳ</label>
                <input
                  type="text"
                  placeholder="Vd: Học kỳ Xuân 2027"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Năm học</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Hạn đăng ký GVHD</label>
                  <input
                    type="date"
                    value={registrationDeadline}
                    onChange={(e) => setRegDeadline(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Ngày bảo vệ dự kiến</label>
                <input
                  type="date"
                  value={defenseDate}
                  onChange={(e) => setDefenseDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
                  required
                />
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
                  Tạo học kỳ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SemesterManagementPage
