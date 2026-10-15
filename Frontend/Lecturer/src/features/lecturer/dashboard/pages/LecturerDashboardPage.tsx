export default function LecturerDashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bảng điều khiển Giảng viên
          </h1>
          <p className="text-sm text-slate-500">
            Theo dõi tiến độ hướng dẫn và chấm điểm đồ án tốt nghiệp.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-medium text-slate-600">Sinh viên đang hướng dẫn</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900">5</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-medium text-slate-600">Đề cương chờ duyệt</h3>
          <p className="mt-2 text-3xl font-bold text-amber-600">2</p>
        </div>
      </div>
    </div>
  )
}
