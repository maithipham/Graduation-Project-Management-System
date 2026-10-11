import React, { useState } from 'react'
import {
  BellRing,
  Send,
  CheckCircle2,
  Clock,
  Mail,
} from 'lucide-react'

import { departmentService } from '@/feature/department/services'

export const RemindersPage: React.FC = () => {
  const [isSending, setIsSending] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  function handleSend(type: 'outline' | 'report' | 'scoring', title: string) {
    setIsSending(true)
    departmentService.sendBulkReminders(type).then((res) => {
      setIsSending(false)
      setSuccessMsg(`Đã gửi email nhắc nhở tự động tới ${res.count} giảng viên cho hạng mục: ${title}.`)
      setTimeout(() => setSuccessMsg(null), 5000)
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Gửi Nhắc Nhở Tiến Độ Hàng Loạt (Bulk Email Notifications)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Quy tắc BR-12 & BR-16: Khi kết thúc deadline, Trưởng bộ môn lọc các Giảng viên còn thiếu duyệt đề cương hoặc chưa nộp phiếu nhận xét/bảng điểm và gửi email nhắc nhở tập trung.
        </p>

        {successMsg && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {successMsg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Nhắc duyệt đề cương */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-sm">
              Nhắc duyệt đề cương đồ án
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Lọc các Giảng viên Review được phân công nhưng chưa Approve/Reject bản đề cương mới nhất của sinh viên sau khi đã kết thúc thời hạn nộp.
            </p>
            <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Có <strong>4 giảng viên</strong> thuộc danh sách cần gửi nhắc.
            </div>
          </div>
          <button
            type="button"
            disabled={isSending}
            onClick={() => handleSend('outline', 'Duyệt đề cương đồ án')}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition"
          >
            <Send className="h-3.5 w-3.5" />
            Gửi email nhắc duyệt đề cương
          </button>
        </div>

        {/* Nhắc nộp hồ sơ tiến trình & điểm GVHD */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-sm">
              Nhắc nộp bảng điểm GVHD
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Lọc các Giảng viên hướng dẫn chưa upload kết quả kiểm tra trùng lặp AI (≤ 35%) và phiếu đánh giá quá trình trước đợt thành lập hội đồng.
            </p>
            <div className="text-xs text-sky-700 bg-sky-50 p-2.5 rounded-lg border border-sky-200">
              Có <strong>2 giảng viên</strong> còn thiếu hồ sơ tiến trình.
            </div>
          </div>
          <button
            type="button"
            disabled={isSending}
            onClick={() => handleSend('report', 'Bảng điểm GVHD')}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition"
          >
            <Send className="h-3.5 w-3.5" />
            Gửi email nhắc nộp điểm GVHD
          </button>
        </div>

        {/* Nhắc hoàn tất điểm hội đồng bảo vệ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BellRing className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-sm">
              Nhắc phiếu chấm & biên bản hội đồng
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nhắc nhở Thư ký và các thành viên Hội đồng bảo vệ hoàn tất nhập điểm thành viên, xử lý lệch điểm quá ngưỡng và chốt kết quả.
            </p>
            <div className="text-xs text-purple-700 bg-purple-50 p-2.5 rounded-lg border border-purple-200">
              Có <strong>1 hội đồng</strong> chưa hoàn tất biên bản.
            </div>
          </div>
          <button
            type="button"
            disabled={isSending}
            onClick={() => handleSend('scoring', 'Điểm & Biên bản hội đồng')}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition"
          >
            <Send className="h-3.5 w-3.5" />
            Gửi email nhắc chốt biên bản
          </button>
        </div>
      </div>
    </div>
  )
}

export default RemindersPage
