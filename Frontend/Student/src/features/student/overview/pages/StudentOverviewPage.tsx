import { ClipboardList } from 'lucide-react'

export default function StudentOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tổng quan</h1>
        <p className="text-sm text-slate-500">
          Theo dõi tiến độ thực hiện đồ án tốt nghiệp của bạn.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <ClipboardList size={32} className="text-slate-400" />
        <p className="text-sm text-slate-500">
          Thông tin tiến độ đồ án sẽ hiển thị tại đây khi kết nối dữ liệu từ hệ thống.
        </p>
      </div>
    </div>
  )
}
